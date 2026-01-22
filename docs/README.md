# KasiConnect

# Takeaway Ordering App (Lovable + Supabase + Yoco)

A food ordering platform where customers discover restaurants/takeaways, place orders for delivery or collection, and pay via Cash on Delivery or online payments (Yoco). Restaurants can register, get verified, manage orders, update progress/ETA, and message customers in real time.

## Core user journeys
### Customers
- Sign up / sign in via phone, Google, or email. ([supabase.com](https://supabase.com/docs/guides/auth/phone-login) [supabase.com](https://supabase.com/docs/guides/auth/social-login/auth-google))
- Browse/search restaurants, place delivery/collection orders, track progress + ETA, chat in-app, and leave reviews.

### Restaurants (takeaways)
- Register a restaurant profile.
- Complete verification (currently manual/partial; see roadmap).
- Optionally apply for online payments (Yoco) to accept online card payments.
- Approve/decline incoming orders; update order progress and ETA; chat with customers.

## Tech stack
- Lovable (frontend app). Frontend code is public—no secrets stored here. ([docs.lovable.dev](https://docs.lovable.dev/tips-tricks/avoiding-security-pitfalls))
- Supabase (Auth + Postgres + RLS + Realtime + Edge Functions). ([supabase.com](https://supabase.com/docs/guides/database/postgres/row-level-security) [supabase.com](https://supabase.com/docs/guides/realtime) [supabase.com](https://supabase.com/docs/guides/functions))
- Yoco Checkout API + Webhooks for payment confirmation. ([developer.yoco.com](https://developer.yoco.com/docs/checkout-api/authentication) [developer.yoco.com](https://developer.yoco.com/guides/online-payments/webhooks/verifying-the-events))

## Documentation
Start here: `docs/00-introduction.md`

## Security notes (non-negotiables)
- Never expose Yoco secret keys in client-side code. ([developer.yoco.com](https://developer.yoco.com/docs/checkout-api/authentication))
- Keep Supabase service role key only in Edge Functions; it bypasses RLS. ([supabase.com](https://supabase.com/docs/guides/functions/secrets))

## Roadmap (verification)
Planned takeaway verification enhancements:
- Government ID upload
- Proof of address upload
- CIPC company registration checks
