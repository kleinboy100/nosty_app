# Architecture

## High-level
- Frontend: Lovable app (runs in browser; treat as public). ([docs.lovable.dev](https://docs.lovable.dev/tips-tricks/avoiding-security-pitfalls))
- Backend: Supabase (Postgres + Auth + RLS) and Edge Functions for business logic.
- Payments: Yoco Checkout + Webhooks.

## Key flows
1) Customer places order → server creates order/payment record
2) Customer pays via Yoco
3) Yoco webhook → Edge Function verifies signature → updates payment/order status
