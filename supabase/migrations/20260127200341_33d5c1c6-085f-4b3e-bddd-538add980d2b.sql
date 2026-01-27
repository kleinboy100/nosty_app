-- Fix: Remove anonymous access to restaurants base table to prevent owner_id exposure
-- Anonymous users must use the restaurants_public view which excludes owner_id

-- Drop the policy that exposes owner_id to anonymous users
DROP POLICY IF EXISTS "Public view access for active restaurants" ON public.restaurants;

-- Recreate the view WITHOUT security_invoker (defaults to security_definer behavior)
-- This allows the view to bypass RLS and return only the safe columns
DROP VIEW IF EXISTS public.restaurants_public;

CREATE VIEW public.restaurants_public AS
SELECT 
  r.id,
  r.name,
  r.description,
  r.address,
  r.cuisine_type,
  r.image_url,
  r.rating,
  r.latitude,
  r.longitude,
  r.average_prep_time,
  r.is_active,
  r.is_accepting_orders,
  r.operating_hours_start,
  r.operating_hours_end,
  r.created_at,
  r.updated_at,
  EXISTS (
    SELECT 1 FROM public.restaurant_payment_credentials rpc
    WHERE rpc.restaurant_id = r.id 
    AND rpc.yoco_public_key IS NOT NULL 
    AND rpc.yoco_secret_key IS NOT NULL
  ) AS accepts_online_payment
FROM public.restaurants r
WHERE r.is_active = true;

-- owner_id and phone are intentionally excluded from the public view

-- Grant SELECT access to the view for all roles
GRANT SELECT ON public.restaurants_public TO anon, authenticated;