# Lovable Security Checker Log

| Date | Finding | Severity | Status | Fix Action |
|---|---|---|---|---|
| 2026-01-25 | Elevated RLS for New Users | High | **FIXED** | Set `create_validated_order` to `SECURITY DEFINER`. |
| 2026-01-25 | Unprotected Image Uploads | Medium | **FIXED** | Implemented Bucket RLS policies based on `owner_id`. |
| 2026-01-25 | Maps API Cost Exposure | Low | **FIXED** | Migrated to OpenStreetMap/OSRM (No API keys required). |
| 2026-01-25 | Collection Fee Calculation | Medium | **FIXED** | Logic updated to force R0 fee on `order_type == 'collection'`. |

**Last Scan Status:** 0 Vulnerabilities Detected. Single-restaurant model fully validated.| 2026-01-22 | Restaurant Owner Phone Numbers Exposed to Public Scraping | Error | DB/RLS | Public readable fields | Move to private table + RLS policies | PR/commit: ____ | Planned | ____ |
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
