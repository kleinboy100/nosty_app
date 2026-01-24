-- Fix infinite recursion in restaurants RLS policies
-- The issue is that the SELECT policy joins with orders which causes recursion

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view restaurants they have orders with" ON public.restaurants;

-- Create a simpler policy that doesn't cause recursion
-- Owners can view their own restaurants (already covered by the ALL policy)
-- For public viewing, we'll use the restaurants_public view instead

-- Create policy for users who have placed orders at a restaurant (using security definer function)
CREATE OR REPLACE FUNCTION public.user_has_order_at_restaurant(restaurant_uuid UUID)
RETURNS BOOLEAN
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

-- Create new SELECT policy that uses the security definer function
CREATE POLICY "Users can view restaurants they ordered from"
ON public.restaurants
FOR SELECT
USING (
  auth.uid() = owner_id
  OR public.user_has_order_at_restaurant(id)
);

-- Grant public access to the restaurants_public view for anonymous browsing
GRANT SELECT ON public.restaurants_public TO anon;
GRANT SELECT ON public.restaurants_public TO authenticated;