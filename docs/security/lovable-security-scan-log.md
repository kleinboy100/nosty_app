# Lovable Security Checker Log

| Date | Finding | Severity | Status | Fix Action |
|---|---|---|---|---|
| 2026-01-24 | Payment Webhook Unverified | Error | **FIXED** | HMAC signature verification implemented in Edge Functions. |
| 2026-01-24 | Payment API Keys Exposed | Error | **FIXED** | Keys moved to Supabase Secrets; UI uses RPC masking. |
| 2026-01-24 | Client-Side Order Validation | Error | **FIXED** | Created `create_validated_order` SQL function. |
| 2026-01-24 | Public Phone Data Exposure | Error | **FIXED** | Implemented `restaurants_public` view. |

**Last Scan Status:** All Error-level issues resolved.| 2026-01-22 | Payment API Keys Could Be Stolen | Error | Frontend/Config | Secrets in client or logs | Move to secrets + Edge Functions; rotate keys | PR/commit: ____ | In progress | ____ |
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
