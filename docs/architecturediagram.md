flowchart LR
  %% =========================
  %% KasiConnect Takeaways - High-level Architecture
  %% =========================

  subgraph Clients["Clients (Browser / Mobile Web)"]
    CUST["Customer UI<br/>(Lovable Frontend)"]
    REST["Restaurant UI<br/>(Lovable Frontend)"]
    ADMIN["Admin/Verifier UI<br/>(Lovable Frontend)"]
  end

  subgraph Supabase["Supabase Backend"]
    AUTH["Supabase Auth<br/>(Phone / Google / Email)"]
    DB["Postgres Database<br/>(Orders, Restaurants, Payments, Reviews, Messages)"]
    RLS["Row Level Security (RLS)"]
    RT["Supabase Realtime<br/>(Chat + order progress updates)"]
    STOR["Supabase Storage<br/>(Planned: ID + Proof of Address uploads)"]
    EF["Edge Functions (API layer)<br/>create-order, create-yoco-checkout, yoco-webhook,<br/>cod-settlement, verification workflows"]
  end

  subgraph External["External Services"]
    YOCO["Yoco Payments<br/>(Checkout API + Webhooks)"]
    CIPC["CIPC verification service<br/>(Planned integration)"]
  end

  %% Auth + general data access
  CUST -->|Sign in / sign up| AUTH
  REST -->|Sign in / sign up| AUTH
  ADMIN -->|Sign in / sign up| AUTH

  AUTH --> DB
  DB --> RLS

  %% Core reads (public-ish)
  CUST -->|Browse/search restaurants & menus| DB

  %% Security boundary: write operations go through Edge Functions
  CUST -->|Place order (COD/Online)| EF
  REST -->|Approve/Decline + update progress/ETA| EF
  ADMIN -->|Verify restaurants| EF

  EF --> DB

  %% Realtime
  DB <--> RT
  CUST <--> RT
  REST <--> RT

  %% Payments (online)
  EF -->|Create checkout (server-side)| YOCO
  YOCO -->|Webhook event (POST)| EF
  EF -->|Verify signature + timestamp then update| DB

  %% COD settlement
  EF -->|Generate statements / track COD commission balance| DB
  REST -->|Pay accumulated COD commission by due date| EF
  EF -->|Enforce restriction/suspension if overdue| DB

  %% Verification roadmap
  REST -->|Upload verification docs (planned)| STOR
  EF -->|Store metadata + status| DB
  EF -.->|Planned: verify with CIPC| CIPC
