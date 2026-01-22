# Testing & Release

## Testing strategy
- Unit-ish tests (where feasible) for:
  - Order validation (Edge Function)
  - Webhook signature verification logic
- Integration tests:
  - Create checkout (test mode) + simulate webhook
  - Restaurant approve/decline + progress updates
  - Realtime messaging behavior

## Release checklist
1) Run Lovable security checker; fix Errors; record log entry. ([docs.lovable.dev](https://docs.lovable.dev/features/security))
2) Confirm no secrets are present in frontend code or repo. ([docs.lovable.dev](https://docs.lovable.dev/tips-tricks/avoiding-security-pitfalls))
3) Confirm webhook verification enabled per Yoco docs. ([developer.yoco.com](https://developer.yoco.com/guides/online-payments/webhooks/verifying-the-events))
4) Smoke test: signup/login (phone + Google + email). ([supabase.com](https://supabase.com/docs/guides/auth/phone-login) [supabase.com](https://supabase.com/docs/guides/auth/social-login/auth-google))
5) Deploy Edge Functions (including public webhook endpoints as needed). ([supabase.com](https://supabase.com/docs/guides/functions/deploy))
