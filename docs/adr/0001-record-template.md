# ADR 0001: Use Edge Functions as the Security Boundary

- Date: 2026-01-22
- Status: Accepted

## Context
Lovable generates a React frontend that runs in the browser; client-side validation and secrets cannot be trusted. ([docs.lovable.dev](https://docs.lovable.dev/tips-tricks/avoiding-security-pitfalls))

We also integrate with Yoco, which requires secret keys and webhook signature verification. ([developer.yoco.com](https://developer.yoco.com/docs/checkout-api/authentication) [developer.yoco.com](https://developer.yoco.com/guides/online-payments/webhooks/verifying-the-events))

## Decision
We will:
- Implement security-critical workflows (order creation validation, payment checkout creation, webhook handling) in Supabase Edge Functions. ([supabase.com](https://supabase.com/docs/guides/functions))
- Enforce data access using Supabase RLS policies. ([supabase.com](https://supabase.com/docs/guides/database/postgres/row-level-security))
- Store secrets only in Edge Function secrets storage. ([supabase.com](https://supabase.com/docs/guides/functions/secrets))

## Consequences
- More backend code, but significantly stronger security posture.
- Requires deployment and monitoring of Edge Functions.
- Webhook endpoints must be public but verified via signature/timestamp. ([developer.yoco.com](https://developer.yoco.com/guides/online-payments/webhooks/verifying-the-events))
