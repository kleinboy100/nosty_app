
-- Fix circular RLS recursion between orders and restaurants tables
-- The restaurants policy uses user_has_order_at_restaurant() which queries orders,
-- but orders policies query restaurants, causing infinite recursion.

-- Solution: For orders table, don't reference restaurants in the user's SELECT policy
-- The user only needs to see their own orders (auth.uid() = user_id)
-- Restaurant owner access is separate and doesn't cause recursion

-- Additionally, the restaurant owner's UPDATE policy for orders queries restaurants
-- which then queries orders again via user_has_order_at_restaurant() - causing recursion

-- Fix: Create a simpler helper function that doesn't trigger recursion
CREATE OR REPLACE FUNCTION public.is_restaurant_owner(p_restaurant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM restaurants
    WHERE id = p_restaurant_id
      AND owner_id = auth.uid()
  )
$$;

-- Now update the orders policies to use this non-recursive function
DROP POLICY IF EXISTS "Restaurant owners can view their orders" ON public.orders;
DROP POLICY IF EXISTS "Restaurant owners can update order status" ON public.orders;

CREATE POLICY "Restaurant owners can view their orders"
ON public.orders
FOR SELECT
TO authenticated
USING (is_restaurant_owner(restaurant_id));

CREATE POLICY "Restaurant owners can update order status"
ON public.orders
FOR UPDATE
TO authenticated
USING (is_restaurant_owner(restaurant_id));

-- Also fix the restaurants policy to be simpler and avoid the circular dependency
DROP POLICY IF EXISTS "Authenticated users can view restaurants they ordered from" ON public.restaurants;

-- Use SECURITY DEFINER function to check order history without RLS interference
CREATE OR REPLACE FUNCTION public.user_has_order_at_restaurant(restaurant_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM orders
    WHERE orders.restaurant_id = restaurant_uuid
      AND orders.user_id = auth.uid()
  )
$$;

-- Recreate the restaurants policy (the function is now SECURITY DEFINER to avoid RLS loops)
CREATE POLICY "Authenticated users can view restaurants they ordered from"
ON public.restaurants
FOR SELECT
TO authenticated
USING (is_active = true AND (auth.uid() = owner_id OR user_has_order_at_restaurant(id)));
