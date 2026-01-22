# Database & RLS

## Design goals
- Least privilege by default via RLS policies. ([supabase.com](https://supabase.com/docs/guides/database/postgres/row-level-security))
- Keep sensitive restaurant verification data and phone numbers out of public-readable tables.

## Core tables (conceptual)
- `profiles` (user profile, role flags)
- `restaurants` (public listing fields)
- `restaurant_private` (owner phone, verification docs metadata; not public)
- `restaurant_verifications` (status, reviewer notes, timestamps)
- `menu_items`
- `orders` (status, delivery/collection, ETA)
- `order_items`
- `payments` (COD/online, status, yoco ids)
- `messages` (chat)
- `reviews`

## RLS policy principles
- Users can read/update their own profile using `auth.uid()` patterns. ([supabase.com](https://supabase.com/docs/guides/database/postgres/row-level-security))
- Public restaurant discovery: expose only non-sensitive fields in `restaurants`.
- Private contact details: restrict `restaurant_private` to restaurant owner/admin only (prevents scraping).
- Orders: customer sees own orders; restaurant sees orders for their restaurant.
- Messages: only participants of an order/thread can read/write.

## Notes
Service role bypasses RLS; only use it in Edge Functions for admin workflows. ([supabase.com](https://supabase.com/docs/guides/functions/secrets))
