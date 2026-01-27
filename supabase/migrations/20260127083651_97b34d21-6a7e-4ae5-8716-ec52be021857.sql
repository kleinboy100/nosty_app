-- Create a secure table for restaurant payment credentials
-- This table is NOT accessible to restaurant owners via RLS to prevent credential theft

CREATE TABLE public.restaurant_payment_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL UNIQUE REFERENCES public.restaurants(id) ON DELETE CASCADE,
  yoco_secret_key text,
  yoco_public_key text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Format validation for keys
  CONSTRAINT valid_yoco_secret_key CHECK (
    yoco_secret_key IS NULL OR yoco_secret_key ~ '^sk_(live|test)_[a-zA-Z0-9]{20,}$'
  ),
  CONSTRAINT valid_yoco_public_key CHECK (
    yoco_public_key IS NULL OR yoco_public_key ~ '^pk_(live|test)_[a-zA-Z0-9]{20,}$'
  )
);

-- Enable RLS - NO policies will be added, meaning NO direct access
-- All access will be through SECURITY DEFINER functions or service role
ALTER TABLE public.restaurant_payment_credentials ENABLE ROW LEVEL SECURITY;

-- Migrate existing data from restaurants table
INSERT INTO public.restaurant_payment_credentials (restaurant_id, yoco_secret_key, yoco_public_key)
SELECT id, yoco_secret_key, yoco_public_key
FROM public.restaurants
WHERE yoco_secret_key IS NOT NULL OR yoco_public_key IS NOT NULL;

-- Create timestamp update trigger
CREATE TRIGGER update_payment_credentials_updated_at
BEFORE UPDATE ON public.restaurant_payment_credentials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create SECURITY DEFINER function to safely update credentials (only for owners)
CREATE OR REPLACE FUNCTION public.update_restaurant_payment_credentials(
  p_restaurant_id uuid,
  p_yoco_secret_key text,
  p_yoco_public_key text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the caller owns this restaurant
  IF NOT EXISTS (
    SELECT 1 FROM restaurants 
    WHERE id = p_restaurant_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized to update this restaurant';
  END IF;
  
  -- Upsert the credentials
  INSERT INTO restaurant_payment_credentials (restaurant_id, yoco_secret_key, yoco_public_key)
  VALUES (p_restaurant_id, p_yoco_secret_key, p_yoco_public_key)
  ON CONFLICT (restaurant_id) DO UPDATE SET
    yoco_secret_key = EXCLUDED.yoco_secret_key,
    yoco_public_key = EXCLUDED.yoco_public_key,
    updated_at = now();
  
  RETURN true;
END;
$$;

-- Create SECURITY DEFINER function to remove credentials (only for owners)
CREATE OR REPLACE FUNCTION public.remove_restaurant_payment_credentials(
  p_restaurant_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the caller owns this restaurant
  IF NOT EXISTS (
    SELECT 1 FROM restaurants 
    WHERE id = p_restaurant_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized to update this restaurant';
  END IF;
  
  -- Delete the credentials
  DELETE FROM restaurant_payment_credentials
  WHERE restaurant_id = p_restaurant_id;
  
  RETURN true;
END;
$$;

-- Update the owner_has_payment_keys function to use the new table
CREATE OR REPLACE FUNCTION public.owner_has_payment_keys(p_restaurant_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller owns the restaurant
  IF NOT EXISTS (
    SELECT 1 FROM restaurants 
    WHERE id = p_restaurant_id AND owner_id = auth.uid()
  ) THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM restaurant_payment_credentials 
    WHERE restaurant_id = p_restaurant_id 
    AND yoco_secret_key IS NOT NULL 
    AND yoco_secret_key != ''
    AND yoco_public_key IS NOT NULL
    AND yoco_public_key != ''
  );
END;
$$;

-- Update restaurant_has_online_payment function to use the new table
CREATE OR REPLACE FUNCTION public.restaurant_has_online_payment(p_restaurant_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM restaurants r
    JOIN restaurant_payment_credentials rpc ON r.id = rpc.restaurant_id
    WHERE r.id = p_restaurant_id 
    AND r.is_active = true
    AND rpc.yoco_secret_key IS NOT NULL 
    AND rpc.yoco_secret_key != ''
  );
END;
$$;

-- Update restaurants_public view to use the new table for checking payment availability
DROP VIEW IF EXISTS public.restaurants_public;
CREATE VIEW public.restaurants_public
WITH (security_invoker=on) AS
SELECT 
  r.id,
  r.name,
  r.description,
  r.cuisine_type,
  r.address,
  r.image_url,
  r.rating,
  r.average_prep_time,
  r.latitude,
  r.longitude,
  r.is_active,
  r.created_at,
  r.updated_at,
  EXISTS (
    SELECT 1 FROM restaurant_payment_credentials rpc
    WHERE rpc.restaurant_id = r.id
    AND rpc.yoco_secret_key IS NOT NULL 
    AND rpc.yoco_secret_key != ''
  ) AS accepts_online_payment
FROM restaurants r
WHERE r.is_active = true;

-- Grant access to the view
GRANT SELECT ON public.restaurants_public TO anon, authenticated;

-- Now drop the payment key columns from restaurants table
ALTER TABLE public.restaurants DROP COLUMN IF EXISTS yoco_secret_key;
ALTER TABLE public.restaurants DROP COLUMN IF EXISTS yoco_public_key;