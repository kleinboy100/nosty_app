
-- Create restaurant_staff table to track assigned staff members
CREATE TABLE public.restaurant_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id, user_id)
);

ALTER TABLE public.restaurant_staff ENABLE ROW LEVEL SECURITY;

-- Owners can manage staff for their restaurants
CREATE POLICY "Restaurant owners can manage staff"
ON public.restaurant_staff
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM restaurants
  WHERE restaurants.id = restaurant_staff.restaurant_id
    AND restaurants.owner_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM restaurants
  WHERE restaurants.id = restaurant_staff.restaurant_id
    AND restaurants.owner_id = auth.uid()
));

-- Staff can view their own assignment
CREATE POLICY "Staff can view own assignment"
ON public.restaurant_staff
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Security definer function to check if user is staff at any restaurant
CREATE OR REPLACE FUNCTION public.is_restaurant_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM restaurant_staff WHERE user_id = auth.uid()
  )
$$;

-- Allow staff to view orders for their assigned restaurant
CREATE POLICY "Staff can view restaurant orders"
ON public.orders
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM restaurant_staff
  WHERE restaurant_staff.restaurant_id = orders.restaurant_id
    AND restaurant_staff.user_id = auth.uid()
));

-- Allow staff to update order status
CREATE POLICY "Staff can update order status"
ON public.orders
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM restaurant_staff
  WHERE restaurant_staff.restaurant_id = orders.restaurant_id
    AND restaurant_staff.user_id = auth.uid()
));

-- Allow staff to view order items for their restaurant
CREATE POLICY "Staff can view order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM orders
  JOIN restaurant_staff ON restaurant_staff.restaurant_id = orders.restaurant_id
  WHERE orders.id = order_items.order_id
    AND restaurant_staff.user_id = auth.uid()
));

-- Allow staff to manage stock
CREATE POLICY "Staff can manage stock"
ON public.stock
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM restaurant_staff
  WHERE restaurant_staff.restaurant_id = stock.restaurant_id
    AND restaurant_staff.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM restaurant_staff
  WHERE restaurant_staff.restaurant_id = stock.restaurant_id
    AND restaurant_staff.user_id = auth.uid()
));

-- Allow staff to manage stock_transactions
CREATE POLICY "Staff can manage stock transactions"
ON public.stock_transactions
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM restaurant_staff
  WHERE restaurant_staff.restaurant_id = stock_transactions.restaurant_id
    AND restaurant_staff.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM restaurant_staff
  WHERE restaurant_staff.restaurant_id = stock_transactions.restaurant_id
    AND restaurant_staff.user_id = auth.uid()
));

-- Allow staff to manage ingredient_stock
CREATE POLICY "Staff can manage ingredient stock"
ON public.ingredient_stock
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM restaurant_staff
  WHERE restaurant_staff.restaurant_id = ingredient_stock.restaurant_id
    AND restaurant_staff.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM restaurant_staff
  WHERE restaurant_staff.restaurant_id = ingredient_stock.restaurant_id
    AND restaurant_staff.user_id = auth.uid()
));

-- Allow staff to view restaurant info (needed for dashboard)
CREATE POLICY "Staff can view assigned restaurant"
ON public.restaurants
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM restaurant_staff
  WHERE restaurant_staff.restaurant_id = restaurants.id
    AND restaurant_staff.user_id = auth.uid()
));

-- Allow staff to view sales_history
CREATE POLICY "Staff can view sales history"
ON public.sales_history
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM restaurant_staff
  WHERE restaurant_staff.restaurant_id = sales_history.restaurant_id
    AND restaurant_staff.user_id = auth.uid()
));

-- Allow staff to view events
CREATE POLICY "Staff can view events"
ON public.events
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM restaurant_staff
  WHERE restaurant_staff.restaurant_id = events.restaurant_id
    AND restaurant_staff.user_id = auth.uid()
));

-- Allow staff to view messages for their restaurant orders
CREATE POLICY "Staff can view messages"
ON public.messages
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM orders
  JOIN restaurant_staff ON restaurant_staff.restaurant_id = orders.restaurant_id
  WHERE orders.id = messages.order_id
    AND restaurant_staff.user_id = auth.uid()
));

-- Allow staff to send messages for their restaurant orders
CREATE POLICY "Staff can send messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_type = 'restaurant' AND
  EXISTS (
    SELECT 1 FROM orders
    JOIN restaurant_staff ON restaurant_staff.restaurant_id = orders.restaurant_id
    WHERE orders.id = messages.order_id
      AND restaurant_staff.user_id = auth.uid()
  )
);
