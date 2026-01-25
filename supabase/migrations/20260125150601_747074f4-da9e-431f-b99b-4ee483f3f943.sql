-- Drop the existing view with SECURITY DEFINER
DROP VIEW IF EXISTS public.restaurants_public;

-- Recreate with security_invoker=on (uses querying user's permissions)
CREATE VIEW public.restaurants_public
WITH (security_invoker=on) AS
  SELECT 
    id,
    name,
    description,
    cuisine_type,
    address,
    image_url,
    rating,
    average_prep_time,
    latitude,
    longitude,
    is_active,
    created_at,
    updated_at,
    (yoco_secret_key IS NOT NULL AND yoco_secret_key != '') AS accepts_online_payment
  FROM public.restaurants
  WHERE is_active = true;