# Environments & Secrets

## Environments
- Local/dev (test payments)
- Production (live payments)

## Secret storage rules
- Never store secrets in frontend code; frontend runs in the browser. ([docs.lovable.dev](https://docs.lovable.dev/tips-tricks/avoiding-security-pitfalls))
- Store secrets in Supabase Edge Function secrets / Lovable secrets. ([supabase.com](https://supabase.com/docs/guides/functions/secrets) [docs.lovable.dev](https://docs.lovable.dev/features/security))

## Required secrets (examples; DO NOT paste real values)
### Supabase
- `SUPABASE_URL` (provided in Edge Functions). ([supabase.com](https://supabase.com/docs/guides/functions/secrets))
- `SUPABASE_ANON_KEY` (safe for browser with RLS). ([supabase.com](https://supabase.com/docs/guides/functions/secrets))
- `SUPABASE_SERVICE_ROLE_KEY` (Edge Functions only; bypasses RLS). ([supabase.com](https://supabase.com/docs/guides/functions/secrets))

### Yoco
- `YOCO_SECRET_KEY` (e.g. `sk_test_...` or `sk_live_...`) used as Bearer token. Never expose client-side. ([developer.yoco.com](https://developer.yoco.com/docs/checkout-api/authentication))
- `YOCO_WEBHOOK_SECRET` (starts with `whsec_...`) used to verify webhooks. ([developer.yoco.com](https://developer.yoco.com/guides/online-payments/webhooks/verifying-the-events))

## Rotation & leakage response
If a secret is ever committed or pasted into public chat/logs, rotate it immediately (treat it as compromised). ([docs.lovable.dev](https://docs.lovable.dev/features/security))
