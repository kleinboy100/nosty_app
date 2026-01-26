# Nosty'$ Fresh Fast Food (KasiConnect Powered)

A specialized food ordering platform optimized for Nosty'$ Fresh Fast Food. Customers can browse the menu, place orders for delivery or collection, and track their meals in real-time with zero-cost routing services.

## Core User Journeys
### Customers
- **Direct Access:** Immediate access to Nosty's menu without browsing a restaurant list.
- **Hybrid Fulfillment:** Choose between "Delivery" (R25 fee) or "Collection" (R0 fee) at checkout.
- **Real-Time Tracking:** Live payment status updates and progress tracking (Pending -> Preparing -> Ready/Out for Delivery).
- **No-Cost Routing:** Real-time ETA and distance calculations powered by OpenStreetMap & OSRM.

### Restaurant Owner (Nosty's)
- **Menu Management:** Native file upload for high-res meal photos stored in Supabase Buckets.
- **Dashboard:** Private orders management and item availability toggles (CRUD).
- **Secure Payments:** Integrated Yoco support via secure Edge Functions.

## Tech Stack
- **Frontend:** React + Vite + Tailwind (Custom Red/White "Fresh & Fast" Branding).
- **Backend:** Supabase (Auth, Postgres, Realtime, Storage, Edge Functions).
- **Maps/Routing:** OpenStreetMap (Nominatim API) & OSRM (Open Source Routing Machine).
- **Payments:** Yoco SDK + HMAC-verified webhooks.- **Zero-Trust Frontend:** No secrets stored in client code.
- **Server-Side Validation:** All orders are validated via database functions to prevent price tampering.
- **Webhook Integrity:** All payment signals are verified using HMAC-SHA256 signatures.
- **Privacy First:** Sensitive data (phone numbers, owner IDs) is isolated behind public views.- Approve/decline incoming orders; update order progress and ETA; chat with customers.

## Tech stack
- Lovable (frontend app). Frontend code is public—no secrets stored here. ([docs.lovable.dev](https://docs.lovable.dev/tips-tricks/avoiding-security-pitfalls))
- Supabase (Auth + Postgres + RLS + Realtime + Edge Functions). ([supabase.com](https://supabase.com/docs/guides/database/postgres/row-level-security) [supabase.com](https://supabase.com/docs/guides/realtime) [supabase.com](https://supabase.com/docs/guides/functions))
- Yoco Checkout API + Webhooks for payment confirmation. ([developer.yoco.com](https://developer.yoco.com/docs/checkout-api/authentication) [developer.yoco.com](https://developer.yoco.com/guides/online-payments/webhooks/verifying-the-events))

## Documentation
Start here: `docs/00-introduction.md`

## Security notes (non-negotiables)
- Never expose Yoco secret keys in client-side code. ([developer.yoco.com](https://developer.yoco.com/docs/checkout-api/authentication))
- Keep Supabase service role key only in Edge Functions; it bypasses RLS. ([supabase.com](https://supabase.com/docs/guides/functions/secrets))

## Roadmap (verification)
Planned takeaway verification enhancements:
- Government ID upload
- Proof of address upload
- CIPC company registration checks
