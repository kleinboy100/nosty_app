-- Fix the create_validated_order function to use SECURITY DEFINER
-- This allows the function to bypass RLS when validating restaurant existence
-- The function still enforces security by checking auth.uid() for order creation

CREATE OR REPLACE FUNCTION public.create_validated_order(
  p_restaurant_id uuid, 
  p_delivery_address text, 
  p_notes text, 
  p_payment_method text, 
  p_items jsonb,
  p_order_type text DEFAULT 'delivery'
)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_order_id UUID;
  v_total DECIMAL(10,2) := 0;
  v_item JSONB;
  v_menu_item RECORD;
  v_item_total DECIMAL(10,2);
  v_quantity INTEGER;
  v_delivery_fee DECIMAL(10,2) := 0;
  v_user_id UUID;
BEGIN
  -- Get the authenticated user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to place an order';
  END IF;

  -- Validate restaurant exists and is active (using SECURITY DEFINER bypasses RLS)
  IF NOT EXISTS (
    SELECT 1 FROM restaurants 
    WHERE id = p_restaurant_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Restaurant not found or inactive';
  END IF;

  -- Validate order type
  IF p_order_type NOT IN ('delivery', 'collection') THEN
    RAISE EXCEPTION 'Invalid order type';
  END IF;

  -- Validate delivery address (required for delivery, optional for collection)
  IF p_order_type = 'delivery' AND (p_delivery_address IS NULL OR length(trim(p_delivery_address)) < 5) THEN
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
  
  -- Add delivery fee only for delivery orders (R25)
  IF p_order_type = 'delivery' THEN
    v_delivery_fee := 25;
    v_total := v_total + v_delivery_fee;
  END IF;
  
  -- Create order with validated total
  INSERT INTO orders (
    user_id, restaurant_id, total_amount, delivery_address, 
    notes, status, payment_method, order_type
  ) VALUES (
    v_user_id, 
    p_restaurant_id, 
    v_total, 
    CASE WHEN p_order_type = 'delivery' THEN trim(p_delivery_address) ELSE 'Collection at store' END,
    CASE WHEN p_notes IS NOT NULL THEN trim(p_notes) ELSE NULL END,
    'pending',
    p_payment_method,
    p_order_type
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
$function$;