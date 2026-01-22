# Edge Functions

We use Supabase Edge Functions as the backend API layer for validation, payments, and webhooks. ([supabase.com](https://supabase.com/docs/guides/functions) [docs.lovable.dev](https://docs.lovable.dev/tips-tricks/avoiding-security-pitfalls))

## Why functions
- Frontend code is public and can be tampered with; server-side validation must enforce rules. ([docs.lovable.dev](https://docs.lovable.dev/tips-tricks/avoiding-security-pitfalls))
- External integrations (Yoco) require secrets stored server-side. ([supabase.com](https://supabase.com/docs/guides/functions/secrets) [developer.yoco.com](https://developer.yoco.com/docs/checkout-api/authentication))

## Functions (planned/implemented)
- `create-order` (planned): validates cart, recalculates totals server-side, creates `orders`, `order_items`, and `payments`.
- `create-yoco-checkout` (planned/implemented): creates checkout using `YOCO_SECRET_KEY` (server-side only). ([developer.yoco.com](https://developer.yoco.com/docs/checkout-api/authentication))
- `yoco-webhook` / `yoco-webhook-secure` (implemented): verifies webhook signature + timestamp before DB updates. ([developer.yoco.com](https://developer.yoco.com/guides/online-payments/webhooks/verifying-the-events))
- `restaurant-apply-online-payments` (planned): captures application + status workflow.

## Deployment notes
For public webhooks, deploy functions without requiring a Supabase JWT (webhook authenticity is verified via signature instead). Supabase supports `--no-verify-jwt` for this use case. ([supabase.com](https://supabase.com/docs/guides/functions/deploy))
