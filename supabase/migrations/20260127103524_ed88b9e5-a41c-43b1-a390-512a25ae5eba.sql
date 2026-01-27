-- =============================================
-- FIX: profiles table RLS policies
-- Issue: Potential policy conflicts with "deny anonymous" approach
-- Solution: Use explicit TO authenticated role restrictions
-- =============================================

DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Authenticated users can only access their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- FIX: orders table RLS policies  
-- Issue: Potential gaps in restrictive policy coverage
-- Solution: Use explicit TO authenticated role restrictions
-- =============================================

DROP POLICY IF EXISTS "Deny anonymous access to orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
DROP POLICY IF EXISTS "Restaurant owners can view their orders" ON public.orders;
DROP POLICY IF EXISTS "Restaurant owners can update order status" ON public.orders;

-- Customers can only view their own orders
CREATE POLICY "Users can view own orders" 
ON public.orders 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Customers can only create orders for themselves
CREATE POLICY "Users can create own orders" 
ON public.orders 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Restaurant owners can view orders for their restaurant
CREATE POLICY "Restaurant owners can view their orders" 
ON public.orders 
FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM restaurants
  WHERE restaurants.id = orders.restaurant_id 
  AND restaurants.owner_id = auth.uid()
));

-- Restaurant owners can update order status for their restaurant
CREATE POLICY "Restaurant owners can update order status" 
ON public.orders 
FOR UPDATE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM restaurants
  WHERE restaurants.id = orders.restaurant_id 
  AND restaurants.owner_id = auth.uid()
));