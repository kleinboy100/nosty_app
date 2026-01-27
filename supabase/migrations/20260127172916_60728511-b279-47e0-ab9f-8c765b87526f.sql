-- Add operating hours columns to restaurants table
ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS is_accepting_orders BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS operating_hours_start TIME DEFAULT '09:00:00',
ADD COLUMN IF NOT EXISTS operating_hours_end TIME DEFAULT '18:00:00';

-- Add comment for documentation
COMMENT ON COLUMN public.restaurants.is_accepting_orders IS 'Manual toggle to enable/disable orders';
COMMENT ON COLUMN public.restaurants.operating_hours_start IS 'Daily opening time';
COMMENT ON COLUMN public.restaurants.operating_hours_end IS 'Daily closing time';