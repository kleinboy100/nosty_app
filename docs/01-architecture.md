# Architecture

## High-level components
- **Client (Lovable UI):** Customer mode + Restaurant mode. Frontend code is public. ([docs.lovable.dev](https://docs.lovable.dev/tips-tricks/avoiding-security-pitfalls))
- **Supabase Auth:** Phone login + Google + Email. ([supabase.com](https://supabase.com/docs/guides/auth/phone-login) [supabase.com](https://supabase.com/docs/guides/auth/social-login/auth-google))
- **Supabase Postgres + RLS:** Source of truth for users, restaurants, menus, orders, payments, reviews, and messaging. ([supabase.com](https://supabase.com/docs/guides/database/postgres/row-level-security))
- **Supabase Realtime:** Real-time chat and order progress updates. ([supabase.com](https://supabase.com/docs/guides/realtime))
- **Supabase Edge Functions:** “API layer” for sensitive operations (create order, create checkout, webhook handling). ([supabase.com](https://supabase.com/docs/guides/functions) [docs.lovable.dev](https://docs.lovable.dev/tips-tricks/avoiding-security-pitfalls))
- **Yoco:** Checkout creation (server-side) + webhooks for payment confirmation. ([developer.yoco.com](https://developer.yoco.com/docs/checkout-api/authentication) [developer.yoco.com](https://developer.yoco.com/guides/online-payments/webhooks/listen-for-events))

## Key flows
### Order flow (COD)
1) Customer submits cart → server validates + creates order + payment record.
2) Restaurant approves/declines.
3) Restaurant updates progress + ETA → customer sees updates in real time.

### Order flow (Online payment)
1) Server creates Yoco checkout (never from browser). ([developer.yoco.com](https://developer.yoco.com/docs/checkout-api/authentication))
2) Customer completes payment.
3) Yoco webhook → Edge Function verifies signature + timestamp → updates DB. ([developer.yoco.com](https://developer.yoco.com/guides/online-payments/webhooks/verifying-the-events))

### Restaurant onboarding
1) Restaurant registers.
2) Verification (current: basic). Roadmap includes ID/proof/CIPC checks.
3) Restaurant may apply for online payments within the app.
