``` mermaidflowchart LR
  subgraph Clients
    CUST[Customer UI (Lovable)]
    REST[Restaurant UI (Lovable)]
    ADMIN[Admin/Verifier UI (Lovable)]
  end

  subgraph Supabase
    AUTH[Supabase Auth (Phone / Google / Email)]
    DB[(Postgres DB)]
    RLS[RLS Policies]
    RT[Realtime (Chat + Order Updates)]
    STOR[Storage (Planned: ID + Proof of Address)]
    EF[Edge Functions (API Layer)]
  end

  subgraph External
    YOCO[Yoco Checkout API]
    YWH[Yoco Webhooks]
    CIPC[CIPC Checks (Planned)]
  end

  %% Auth
  CUST --> AUTH
  REST --> AUTH
  ADMIN --> AUTH
  AUTH --> DB
  DB --> RLS

  %% Discovery (reads)
  CUST -->|Browse / Search restaurants & menus| DB

  %% Core writes via Edge Functions
  CUST -->|Place order (COD or Online)| EF
  REST -->|Approve/Decline; Progress; ETA| EF
  ADMIN -->|Restaurant verification decisions| EF
  EF --> DB

  %% Realtime updates
  DB <--> RT
  CUST <--> RT
  REST <--> RT

  %% Online payments
  EF -->|Create checkout (server-side)| YOCO
  YWH -->|Webhook event POST| EF
  EF -->|Verify + update payment/order| DB

  %% COD commission settlement
  EF -->|Compute COD commission balance| DB
  REST -->|Settle COD commission on due date| EF
  EF -->|Restrict/Suspend if overdue| DB

  %% Verification roadmap
  REST -->|Upload docs (planned)| STOR
  EF -->|Store verification metadata/status| DB
  EF -.->|Planned integration| CIPC
  ```
