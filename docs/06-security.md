# Security

## Security principles (Lovable + Supabase)
- Frontend code is public; do not store secrets in code. Use secret storage. ([docs.lovable.dev](https://docs.lovable.dev/features/security))
- Move business logic to Supabase Edge Functions (treat as API layer). ([docs.lovable.dev](https://docs.lovable.dev/tips-tricks/avoiding-security-pitfalls))
- Use Supabase Row Level Security (RLS) early and keep it simple. ([docs.lovable.dev](https://docs.lovable.dev/tips-tricks/avoiding-security-pitfalls))

## Secrets management
- Where secrets live (Lovable secrets / Supabase Edge Function secrets).
- Never expose Yoco secret keys client-side. ([developer.yoco.com](https://developer.yoco.com/docs/checkout-api/authentication))
- Supabase service_role key bypasses RLS; only use in Edge Functions, never in browser. ([supabase.com](https://supabase.com/docs/guides/functions/secrets))

## Webhook security (Yoco)
We verify authenticity using:
1) Replay-attack protection: validate `webhook-timestamp` is within 3 minutes. ([developer.yoco.com](https://developer.yoco.com/guides/online-payments/webhooks/verifying-the-events))
2) Signature verification: compute and compare HMAC signature using `webhook-id`, `webhook-timestamp`, and raw body. ([developer.yoco.com](https://developer.yoco.com/guides/online-payments/webhooks/verifying-the-events))

## Input validation & server-side enforcement
- Orders are created via Edge Function (`create-order`) that validates payload and computes totals server-side.
- Client-side validation exists for UX only; server-side validation is the authority. ([docs.lovable.dev](https://docs.lovable.dev/tips-tricks/avoiding-security-pitfalls))

## Access control & RLS
- Which tables are public vs private.
- Policies overview and testing approach.

## Security testing
- Lovable security checker process and logs location.
- Manual tests (abuse cases).
- Optional: we map issues to OWASP Top 10 categories for awareness. ([owasp.org](https://owasp.org/Top10/2021/))
