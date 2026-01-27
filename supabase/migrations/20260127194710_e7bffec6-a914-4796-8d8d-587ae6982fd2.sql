-- Update the restaurants_public view to include operating hours fields
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