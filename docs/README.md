# KasiConnect (Takeaway Ordering App)

A food ordering platform where customers discover local restaurants, place orders for delivery or collection, and pay via Cash or secure online payments (Yoco).

## Core user journeys
### Customers
- Secure sign-in via phone, Google, or email.
- Mobile-optimized browsing with a persistent bottom navigation bar.
- Real-time order tracking and in-app chat.

### Restaurants
- Register profiles and manage digital menus.
- Securely configure Yoco payment keys (keys are masked and never exposed to the UI).
- Manage order lifecycle (Awaiting Payment -> Pending -> Preparing -> Out for Delivery).

## Tech stack
- **Frontend:** Lovable (React + Vite + Tailwind).
- **Backend:** Supabase (Auth, Postgres, Realtime, Edge Functions).
- **Payments:** Yoco SDK + Secure Server-side Webhooks.

## Security (Current State)
- **Zero-Trust Frontend:** No secrets stored in client code.
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
