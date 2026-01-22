# Lovable Security Checker Log

Lovable provides API key detection and security scanning; we use it as a gate before publishing. ([docs.lovable.dev](https://docs.lovable.dev/features/security))

## Process
1) Run security checker in Lovable dashboard. ([docs.lovable.dev](https://docs.lovable.dev/features/security))
2) Fix findings using Edge Functions + RLS where applicable (frontend is public). ([docs.lovable.dev](https://docs.lovable.dev/tips-tricks/avoiding-security-pitfalls))
3) Re-run checker after fixes.
4) Document exceptions (if any) with rationale.

## Findings register
> Never paste secrets here—redact. ([docs.lovable.dev](https://docs.lovable.dev/features/security))

| Date | Finding | Severity | Area | Root cause | Fix | Evidence | Status | Owner |
|---|---|---|---|---|---|---|---|---|
| 2026-01-22 | Payment Webhook Accepts Unverified Requests | Error | Edge Function | No signature verification | Implement Yoco timestamp + HMAC signature verification | PR/commit: ____ | In progress | ____ |
| 2026-01-22 | Payment API Keys Could Be Stolen | Error | Frontend/Config | Secrets in client or logs | Move to secrets + Edge Functions; rotate keys | PR/commit: ____ | In progress | ____ |
| 2026-01-22 | Order Creation Lacks Server-Side Input Validation | Error | Orders | Client can tamper with order payload | Add `create-order` Edge Function; compute totals server-side | PR/commit: ____ | Planned | ____ |
| 2026-01-22 | Restaurant Owner Phone Numbers Exposed to Public Scraping | Error | DB/RLS | Public readable fields | Move to private table + RLS policies | PR/commit: ____ | Planned | ____ |
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
