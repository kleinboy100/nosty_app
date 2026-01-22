# Lovable Security Checker Log

Lovable provides API key detection and AI-powered security scanning to identify issues before publishing. ([docs.lovable.dev](https://docs.lovable.dev/features/security))

## How we use it (process)
1. Run the security checker in the Lovable project dashboard. ([docs.lovable.dev](https://docs.lovable.dev/features/security))
2. Review every finding and map it to:
   - Frontend fix (safe public code only), or
   - Supabase fix (RLS policies), or
   - Edge Function fix (server-side validation, signature verification, secrets).
   Lovable’s guidance: frontend code is public; move business logic to Edge Functions; keep RLS simple. ([docs.lovable.dev](https://docs.lovable.dev/tips-tricks/avoiding-security-pitfalls))
3. Implement fixes promptly.
4. Re-run the checker after changes and record results.
5. Document exceptions (if any) with clear rationale.

## Cadence
- During active development: run on every major feature branch before publish.
- After launch: run before each release + monthly review.

## Findings Register (table)
| Date | Finding | Severity | Affected area | Root cause | Fix | Evidence (commit/link) | Status | Owner |
|------|---------|----------|---------------|------------|-----|------------------------|--------|-------|

## Example entries (from our project)
| Date | Finding | Severity | Affected area | Root cause | Fix | Evidence | Status | Owner |
|------|---------|----------|---------------|------------|-----|----------|--------|-------|
| YYYY-MM-DD | Payment Webhook Accepts Unverified Requests | Error | Edge Function | No signature verification | Implement Yoco webhook verification (timestamp + HMAC) | <link> | Done | <name> |
| YYYY-MM-DD | Payment API Keys Could Be Stolen | Error | Frontend | Secret key in client code | Move to Lovable secrets / Supabase function secrets | <link> | Done | <name> |
| YYYY-MM-DD | Order Creation Lacks Server-Side Input Validation | Error | DB/API | Direct client insert | Create Edge Function `create-order` validating + computing totals | <link> | In progress | <name> |
| YYYY-MM-DD | Restaurant Owner Phone Numbers Exposed | Error | DB | Public select access | Move to private table + RLS | <link> | Planned | <name> |
