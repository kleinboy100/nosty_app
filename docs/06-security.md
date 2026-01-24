# Security Documentation

## The Security Model
KasiConnect operates on the principle that the **Frontend is Public**. We do not trust any data coming from the browser regarding prices or payment status.

## Completed Mitigations (Jan 2026)

### 1. Order Price Tampering
- **Risk:** Users could edit the "Total Price" in the browser before clicking buy.
- **Fix:** Implemented server-side price lookups during the order creation transaction.

### 2. Webhook Spoofing
- **Risk:** An attacker could send a fake "Success" message to our webhook URL.
- **Fix:** Implemented HMAC-SHA256 signature verification using `YOCO_WEBHOOK_SECRET`.

### 3. Sensitive Data Exposure
- **Risk:** Restaurant owner phone numbers could be scraped by bots.
- **Fix:** Created the `restaurants_public` view to filter out contact details for non-authenticated or unauthorized requests.

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
