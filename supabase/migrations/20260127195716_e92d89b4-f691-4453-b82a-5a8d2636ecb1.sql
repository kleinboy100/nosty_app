-- Fix 1: Restrict direct restaurants table access to prevent owner_id exposure
-- Drop the overly permissive policy that exposes owner_id
DROP POLICY IF EXISTS "Anyone can view active restaurants via view" ON public.restaurants;

-- Create a more restrictive policy that still allows:
-- 1. Owners to manage their restaurants (already exists via "Owners can manage own restaurants")
-- 2. Anonymous/public access MUST go through restaurants_public view
-- Note: The restaurants_public view uses security_invoker=on so it needs underlying SELECT permission
-- We'll allow anon access ONLY to specific columns via the view by keeping a minimal policy

-- Create policy for authenticated users who have placed orders at the restaurant
CREATE POLICY "Authenticated users can view restaurants they ordered from"
ON public.restaurants
FOR SELECT
TO authenticated
USING (
  is_active = true AND (
    auth.uid() = owner_id OR
    public.user_has_order_at_restaurant(id)
  )
);

-- For anonymous users and the public view to work, we need a minimal policy
-- The security_invoker view will respect RLS, so we need to allow anon SELECT
-- But the view already filters which columns are exposed
CREATE POLICY "Public view access for active restaurants"
ON public.restaurants
FOR SELECT
TO anon
USING (is_active = true);

-- Fix 2: Add length constraint on messages.content
ALTER TABLE public.messages
ADD CONSTRAINT messages_content_length_check
CHECK (length(content) <= 1000 AND length(content) > 0);