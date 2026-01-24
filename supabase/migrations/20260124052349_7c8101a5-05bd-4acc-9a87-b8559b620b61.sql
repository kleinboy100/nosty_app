-- Fix #1: Create server-side order validation function
CREATE OR REPLACE FUNCTION public.create_validated_order(
  p_restaurant_id UUID,
  p_delivery_address TEXT,
  p_notes TEXT,
  p_payment_method TEXT,
  p_items JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_total DECIMAL(10,2) := 0;
  v_item JSONB;
  v_menu_item RECORD;
  v_item_total DECIMAL(10,2);
  v_quantity INTEGER;
BEGIN
  -- Validate restaurant exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM restaurants 
    WHERE id = p_restaurant_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Restaurant not found or inactive';
  END IF;

  -- Validate delivery address
  IF p_delivery_address IS NULL OR length(trim(p_delivery_address)) < 5 THEN
    RAISE EXCEPTION 'Invalid delivery address';
  END IF;

  -- Validate payment method
  IF p_payment_method NOT IN ('cash', 'online') THEN
    RAISE EXCEPTION 'Invalid payment method';
  END IF;

  -- Validate items array
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;

  -- Validate items and calculate total from server-side prices
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_quantity := (v_item->>'quantity')::INTEGER;
    
    -- Get current price and verify availability
    SELECT price, name, is_available INTO v_menu_item
    FROM menu_items
    WHERE id = (v_item->>'menu_item_id')::UUID
      AND restaurant_id = p_restaurant_id;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Menu item not found or does not belong to this restaurant';
    END IF;
    
    IF NOT v_menu_item.is_available THEN
      RAISE EXCEPTION 'Menu item % is not available', v_menu_item.name;
    END IF;
    
    -- Validate quantity (1-100 range)
    IF v_quantity <= 0 OR v_quantity > 100 THEN
      RAISE EXCEPTION 'Invalid quantity for %: must be between 1 and 100', v_menu_item.name;
    END IF;
    
    v_item_total := v_menu_item.price * v_quantity;
    v_total := v_total + v_item_total;
  END LOOP;
  
  -- Add delivery fee (R25)
  v_total := v_total + 25;
  
  -- Create order with validated total
  INSERT INTO orders (
    user_id, restaurant_id, total_amount, delivery_address, 
    notes, status, payment_method
  ) VALUES (
    auth.uid(), 
    p_restaurant_id, 
    v_total, 
    trim(p_delivery_address), 
    CASE WHEN p_notes IS NOT NULL THEN trim(p_notes) ELSE NULL END,
    CASE WHEN p_payment_method = 'online' THEN 'awaiting_payment' ELSE 'pending' END,
    p_payment_method
  )
  RETURNING id INTO v_order_id;
  
  -- Create order items with server-validated prices
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT price, name INTO v_menu_item
    FROM menu_items
    WHERE id = (v_item->>'menu_item_id')::UUID;
    
    INSERT INTO order_items (order_id, menu_item_id, quantity, price, item_name)
    VALUES (
      v_order_id,
      (v_item->>'menu_item_id')::UUID,
      (v_item->>'quantity')::INTEGER,
      v_menu_item.price,
      v_menu_item.name
    );
  END LOOP;
  
  RETURN v_order_id;
END;
$$;

-- Fix #3 & #4: Create function to check if restaurant has payment configured (without exposing secret)
CREATE OR REPLACE FUNCTION public.restaurant_has_online_payment(p_restaurant_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM restaurants 
    WHERE id = p_restaurant_id 
    AND is_active = true
    AND yoco_secret_key IS NOT NULL 
    AND yoco_secret_key != ''
  );
END;
$$;

-- Fix #3: Create function for owners to check their own keys status
CREATE OR REPLACE FUNCTION public.owner_has_payment_keys(p_restaurant_id UUID)
RETURNS BOOLEAN
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
    SELECT 1 FROM restaurants 
    WHERE id = p_restaurant_id 
    AND yoco_secret_key IS NOT NULL 
    AND yoco_secret_key != ''
    AND yoco_public_key IS NOT NULL
    AND yoco_public_key != ''
  );
END;
$$;

-- Fix #4: Create public view for restaurants without sensitive fields
CREATE OR REPLACE VIEW public.restaurants_public
WITH (security_invoker = false)
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

-- Grant access to the public view
GRANT SELECT ON public.restaurants_public TO anon, authenticated;

-- Fix #4: Update RLS policies to restrict public access to sensitive columns
-- First drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view active restaurants" ON public.restaurants;

-- Create policy for owners to see all their restaurant data (including secrets for updates)
-- The existing "Owners can manage own restaurants" policy already handles this

-- Create a restricted public SELECT policy that only allows seeing basic info
-- Note: We keep using the view for public access, but allow authenticated users 
-- to query restaurants table if they have an active order (for order details)
CREATE POLICY "Users can view restaurants they have orders with"
ON public.restaurants
FOR SELECT
USING (
  is_active = true AND (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.restaurant_id = restaurants.id 
      AND orders.user_id = auth.uid()
    )
  )
);