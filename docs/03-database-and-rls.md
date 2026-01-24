# Database & RLS

## Data Isolation
To prevent data scraping and protect owner privacy, we use **Database Views**:
- **`restaurants_public`:** This is the primary view for the discovery page. It excludes sensitive columns like `owner_id`, `phone_number`, and `yoco_secret_key`.

## Server-Side Enforcement
We use `SECURITY DEFINER` functions to perform actions that require elevated permissions without granting those permissions to the public role:
- **`create_validated_order`:** Prevents price manipulation by recalculating totals server-side.
- **`restaurant_has_online_payment`:** Checks if a restaurant is set up for Yoco without returning the actual API keys to the frontend.

## Core Tables
- `profiles`: User identity.
- `restaurants`: Store details.
- `orders` & `order_items`: Order history and server-validated totals.
- `payments`: Tracks Yoco `checkoutId` and verification status.- Public restaurant discovery: expose only non-sensitive fields in `restaurants`.
- Private contact details: restrict `restaurant_private` to restaurant owner/admin only (prevents scraping).
- Orders: customer sees own orders; restaurant sees orders for their restaurant.
- Messages: only participants of an order/thread can read/write.

## Notes
Service role bypasses RLS; only use it in Edge Functions for admin workflows. ([supabase.com](https://supabase.com/docs/guides/functions/secrets))
