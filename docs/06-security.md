# Security Documentation

## Hardened Asset Management
- **Image Uploads:** File type validation (images only) and size limits (5MB) are enforced before Supabase Storage ingestion.
- **Folder Isolation:** Owners can only access storage folders matching their `restaurant_id`.

## Location Privacy
- **Client-Side Geocoding:** Addresses are converted to coordinates on the fly; no persistent storage of customer movement history beyond the specific order requirements.

## Mitigations (Updated Jan 2026)
### 1. New User Friction
- **Fix:** Elevated `create_validated_order` permissions to handle new auth users who haven't yet populated the `profiles` table, preventing "Permission Denied" errors at first checkout.

### 2. Payment Signal Integrity
- **Fix:** Implemented real-time listener security. Even if a user manually refreshes, the status is fetched directly from the HMAC-verified database record, not local storage.

### 3. Dashboard Concealment
- **Fix:** UI-level exclusion of administrative tools for non-owners, backed by API-level RLS that rejects dashboard data requests from unauthorized UUIDs.
### 4. API Key Leakage
- **Risk:** Yoco Secret Keys visible in the frontend source code.
- **Fix:** Moved all Yoco interactions to Supabase Edge Functions. Frontend now only interacts with masked RPC functions.
### 3) Missing server-side input validation (orders)
Mitigation: create orders through an Edge Function that validates payload and computes totals from DB, not client values. ([docs.lovable.dev](https://docs.lovable.dev/tips-tricks/avoiding-security-pitfalls))

### 4) Phone numbers scrapeable
Mitigation: keep phone numbers in private tables protected by RLS; do not expose them in public restaurant listings. ([supabase.com](https://supabase.com/docs/guides/database/postgres/row-level-security))

## Security checker process
We run Lovable’s security checker before publish and track findings in `docs/security/lovable-security-scan-log.md`. ([docs.lovable.dev](https://docs.lovable.dev/features/security))

## OWASP mapping (awareness)
Many of the above issues map to OWASP Top 10 categories (e.g., Broken Access Control, Insecure Design). ([owasp.org](https://owasp.org/Top10/2021/))
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
