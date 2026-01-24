-- Fix the security definer view issue - use security_invoker instead
DROP VIEW IF EXISTS public.restaurants_public;

CREATE VIEW public.restaurants_public
WITH (security_invoker = true)
AS
SELECT 
  id,
  name,
  description,
  cuisine_type,
  address,
  image_url,
  is_active,
  average_prep_time,
  rating,
  created_at,
  updated_at,
  (yoco_secret_key IS NOT NULL AND yoco_secret_key != '') AS accepts_online_payment
FROM public.restaurants
WHERE is_active = true;

-- Re-grant access to the public view
GRANT SELECT ON public.restaurants_public TO anon, authenticated;