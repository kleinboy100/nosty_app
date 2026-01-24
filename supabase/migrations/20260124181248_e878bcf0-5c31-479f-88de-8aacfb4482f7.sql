-- Add coordinates to restaurants for distance calculation
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- Add payment_confirmed flag to orders for new payment flow
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_confirmed BOOLEAN DEFAULT false;

-- Drop and recreate the restaurants_public view to include coordinates
DROP VIEW IF EXISTS restaurants_public;

CREATE VIEW restaurants_public AS
SELECT 
  id, name, description, cuisine_type, address, 
  image_url, rating, average_prep_time, is_active, 
  created_at, updated_at, latitude, longitude,
  (yoco_secret_key IS NOT NULL AND yoco_secret_key != '') as accepts_online_payment
FROM restaurants
WHERE is_active = true;