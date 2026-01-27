-- Fix warn-level security issues

-- 1. Switch user_has_order_at_restaurant to SECURITY INVOKER
-- This is safer as it uses the caller's permissions instead of bypassing RLS
CREATE OR REPLACE FUNCTION public.user_has_order_at_restaurant(restaurant_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM orders
    WHERE orders.restaurant_id = restaurant_uuid
      AND orders.user_id = auth.uid()
  )
$$;

-- 2. Add Yoco key format validation constraint
ALTER TABLE public.restaurants 
DROP CONSTRAINT IF EXISTS yoco_secret_key_format;

ALTER TABLE public.restaurants 
ADD CONSTRAINT yoco_secret_key_format 
CHECK (yoco_secret_key IS NULL OR yoco_secret_key ~ '^sk_(live|test)_[a-zA-Z0-9]{20,}$');

ALTER TABLE public.restaurants 
DROP CONSTRAINT IF EXISTS yoco_public_key_format;

ALTER TABLE public.restaurants 
ADD CONSTRAINT yoco_public_key_format 
CHECK (yoco_public_key IS NULL OR yoco_public_key ~ '^pk_(live|test)_[a-zA-Z0-9]{20,}$');

-- 3. Add text length constraints for input validation
ALTER TABLE public.reviews 
DROP CONSTRAINT IF EXISTS reviews_comment_length_check;

ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_comment_length_check 
CHECK (length(comment) <= 2000 OR comment IS NULL);

ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_notes_length_check;

ALTER TABLE public.orders 
ADD CONSTRAINT orders_notes_length_check 
CHECK (length(notes) <= 1000 OR notes IS NULL);

ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_delivery_address_length_check;

ALTER TABLE public.orders 
ADD CONSTRAINT orders_delivery_address_length_check 
CHECK (length(delivery_address) <= 500);

-- 4. Fix menu-images storage policies for restaurant-specific validation
DROP POLICY IF EXISTS "Restaurant owners can upload menu images" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant owners can update menu images" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant owners can delete menu images" ON storage.objects;

-- Upload policy: validate restaurant ownership from path
CREATE POLICY "Restaurant owners can upload menu images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'menu-images' AND
  EXISTS (
    SELECT 1 FROM restaurants
    WHERE id::text = (storage.foldername(name))[1]
    AND owner_id = auth.uid()
  )
);

-- Update policy: validate restaurant ownership from path
CREATE POLICY "Restaurant owners can update menu images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'menu-images' AND
  EXISTS (
    SELECT 1 FROM restaurants
    WHERE id::text = (storage.foldername(name))[1]
    AND owner_id = auth.uid()
  )
);

-- Delete policy: validate restaurant ownership from path
CREATE POLICY "Restaurant owners can delete menu images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'menu-images' AND
  EXISTS (
    SELECT 1 FROM restaurants
    WHERE id::text = (storage.foldername(name))[1]
    AND owner_id = auth.uid()
  )
);