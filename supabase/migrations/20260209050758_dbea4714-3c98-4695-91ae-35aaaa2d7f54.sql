-- Fix 1: profiles_phone_address_exposure
-- The profiles table already has RESTRICTIVE policies with auth.uid() = user_id checks
-- But we need to ensure these are explicitly TO authenticated role only

-- First, drop existing policies that might allow any authenticated user access
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;

-- Recreate with explicit TO authenticated clause
-- Deny all access to anon role (belt and suspenders)
CREATE POLICY "Deny anonymous access to profiles"
  ON public.profiles
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Users can ONLY view their own profile (TO authenticated enforces auth requirement)
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can ONLY update their own profile  
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can ONLY insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Fix 2: restaurants_owner_phone_exposure
-- Create a secure view that hides phone from non-owners
-- The restaurants_public view already excludes phone, but the base table is accessible to customers who ordered

-- First, drop existing problematic policy that exposes all columns to users who ordered
DROP POLICY IF EXISTS "Authenticated users can view restaurants they ordered from" ON public.restaurants;

-- Create a more restrictive policy: customers can only see non-sensitive fields through the public view
-- Owners see everything through the owner policy, customers should use restaurants_public view
-- We'll modify the policy to only allow owner access to the base table

-- Allow only owners full access to base restaurants table
-- Customers should query restaurants_public view instead (which already excludes phone)
CREATE POLICY "Authenticated users can view restaurants they ordered from (limited)"
  ON public.restaurants
  FOR SELECT
  TO authenticated
  USING (
    (is_active = true) AND 
    (
      auth.uid() = owner_id  -- Owners see everything
      -- Remove the user_has_order_at_restaurant check - customers use restaurants_public view
    )
  );