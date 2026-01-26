# Database & RLS

## Storage & Assets
- **`menu-images` Bucket:** Organized by `restaurant_id`. RLS policies allow public read access but restrict uploads/deletes to the verified restaurant owner.

## Enhanced Functions
- **`create_validated_order` (Security Definer):** Updated to allow first-time customers (unindexed users) to place orders. It bypasses initial RLS checks to validate the restaurant and items, then binds the order to the user's UUID.
- **Ownership Verification:** `useRestaurantOwner` hook interacts with a server-side check to determine if the `user.id` matches the `owner_id` of the primary restaurant.

## Data Access Layer
- **`restaurants_public`:** Redefined to serve only the primary restaurant (Nosty's) to the frontend, ensuring a "Single App" experience.- Private contact details: restrict `restaurant_private` to restaurant owner/admin only (prevents scraping).
- Orders: customer sees own orders; restaurant sees orders for their restaurant.
- Messages: only participants of an order/thread can read/write.

## Notes
Service role bypasses RLS; only use it in Edge Functions for admin workflows. ([supabase.com](https://supabase.com/docs/guides/functions/secrets))
