# Privacy & Data Retention

## Data we process (high level)
- Account identifiers (phone/email) via Supabase Auth. ([supabase.com](https://supabase.com/docs/guides/auth/phone-login))
- Order details (items, totals, delivery/collection selection)
- Messaging content (customer ↔ restaurant)
- Restaurant onboarding details (verification status; future: ID/proof/CIPC)

## Privacy design choices
- Separate public restaurant listing fields from private contact/verification fields to reduce scraping exposure via RLS. ([supabase.com](https://supabase.com/docs/guides/database/postgres/row-level-security))
- Store secrets (keys) only in server-side secret storage. ([supabase.com](https://supabase.com/docs/guides/functions/secrets))

## Retention (initial policy; adjust as required)
- Orders/payments: retain for accounting/audit needs.
- Messages: retain for support/disputes; consider auto-deletion after X months.
- Verification documents: retain only as long as needed for verification and compliance; restrict access heavily.

## TODO (planned compliance features)
- Implement ID + proof of address upload flow and secure storage access controls.
- Implement CIPC verification workflow.
