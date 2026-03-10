
-- =============================================================
-- FIX 1: Remove overly permissive public_read policies on orders & order_items
-- =============================================================

-- Drop the blanket public SELECT policies
DROP POLICY IF EXISTS "public_read_orders" ON public.orders;
DROP POLICY IF EXISTS "Allow API reads" ON public.order_items;
DROP POLICY IF EXISTS "public_read_order_items" ON public.order_items;

-- The existing policies on orders are RESTRICTIVE. With only restrictive policies
-- and no permissive ones, access is denied by default. We need to recreate
-- the legitimate policies as PERMISSIVE.

-- Drop existing restrictive auth policies on orders
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
DROP POLICY IF EXISTS "Restaurant owners can view their orders" ON public.orders;
DROP POLICY IF EXISTS "Restaurant owners can update order status" ON public.orders;

-- Recreate as PERMISSIVE (the default) with proper auth scoping
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Restaurant owners can view their orders" ON public.orders
  FOR SELECT TO authenticated
  USING (is_restaurant_owner(restaurant_id));

CREATE POLICY "Restaurant owners can update order status" ON public.orders
  FOR UPDATE TO authenticated
  USING (is_restaurant_owner(restaurant_id));

-- Drop existing restrictive auth policies on order_items
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can create own order items" ON public.order_items;
DROP POLICY IF EXISTS "Restaurant owners can view order items" ON public.order_items;

-- Recreate as PERMISSIVE with proper auth scoping
CREATE POLICY "Users can view own order items" ON public.order_items
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own order items" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
  ));

CREATE POLICY "Restaurant owners can view order items" ON public.order_items
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM orders o JOIN restaurants r ON o.restaurant_id = r.id
    WHERE o.id = order_items.order_id AND r.owner_id = auth.uid()
  ));

-- =============================================================
-- FIX 2: Prevent self-promotion to restaurant owner
-- Replace the blanket ALL policy with scoped policies (no INSERT for public)
-- =============================================================

DROP POLICY IF EXISTS "Owners can manage own restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Authenticated users can view restaurants they ordered from (lim" ON public.restaurants;

-- Owner can SELECT, UPDATE, DELETE their own restaurants (no INSERT)
CREATE POLICY "Owners can view own restaurants" ON public.restaurants
  FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can update own restaurants" ON public.restaurants
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own restaurants" ON public.restaurants
  FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

-- =============================================================
-- FIX 3: Add restaurant_id to inventory tables for proper scoping
-- Since this is a single-restaurant model, we add nullable column first,
-- backfill from the single restaurant, then add NOT NULL constraint.
-- =============================================================

-- stock table
ALTER TABLE public.stock ADD COLUMN IF NOT EXISTS restaurant_id uuid REFERENCES public.restaurants(id);

-- ingredient_stock table
ALTER TABLE public.ingredient_stock ADD COLUMN IF NOT EXISTS restaurant_id uuid REFERENCES public.restaurants(id);

-- stock_transactions table
ALTER TABLE public.stock_transactions ADD COLUMN IF NOT EXISTS restaurant_id uuid REFERENCES public.restaurants(id);

-- meal_ingredients table (already has order_id, add restaurant_id too)
ALTER TABLE public.meal_ingredients ADD COLUMN IF NOT EXISTS restaurant_id uuid REFERENCES public.restaurants(id);

-- events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS restaurant_id uuid REFERENCES public.restaurants(id);

-- sales_history table
ALTER TABLE public.sales_history ADD COLUMN IF NOT EXISTS restaurant_id uuid REFERENCES public.restaurants(id);

-- Backfill restaurant_id from the single restaurant
UPDATE public.stock SET restaurant_id = (SELECT id FROM public.restaurants LIMIT 1) WHERE restaurant_id IS NULL;
UPDATE public.ingredient_stock SET restaurant_id = (SELECT id FROM public.restaurants LIMIT 1) WHERE restaurant_id IS NULL;
UPDATE public.stock_transactions SET restaurant_id = (SELECT id FROM public.restaurants LIMIT 1) WHERE restaurant_id IS NULL;
UPDATE public.meal_ingredients SET restaurant_id = (SELECT id FROM public.restaurants LIMIT 1) WHERE restaurant_id IS NULL;
UPDATE public.events SET restaurant_id = (SELECT id FROM public.restaurants LIMIT 1) WHERE restaurant_id IS NULL;
UPDATE public.sales_history SET restaurant_id = (SELECT id FROM public.restaurants LIMIT 1) WHERE restaurant_id IS NULL;

-- Now replace the overly broad policies with restaurant-scoped ones

-- stock
DROP POLICY IF EXISTS "Restaurant owners can manage stock" ON public.stock;
CREATE POLICY "Restaurant owners can manage own stock" ON public.stock
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM restaurants WHERE restaurants.id = stock.restaurant_id AND restaurants.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM restaurants WHERE restaurants.id = stock.restaurant_id AND restaurants.owner_id = auth.uid()
  ));

-- ingredient_stock
DROP POLICY IF EXISTS "Restaurant owners can manage ingredient stock" ON public.ingredient_stock;
CREATE POLICY "Restaurant owners can manage own ingredient stock" ON public.ingredient_stock
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM restaurants WHERE restaurants.id = ingredient_stock.restaurant_id AND restaurants.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM restaurants WHERE restaurants.id = ingredient_stock.restaurant_id AND restaurants.owner_id = auth.uid()
  ));

-- stock_transactions
DROP POLICY IF EXISTS "Restaurant owners can manage stock transactions" ON public.stock_transactions;
CREATE POLICY "Restaurant owners can manage own stock transactions" ON public.stock_transactions
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM restaurants WHERE restaurants.id = stock_transactions.restaurant_id AND restaurants.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM restaurants WHERE restaurants.id = stock_transactions.restaurant_id AND restaurants.owner_id = auth.uid()
  ));

-- meal_ingredients
DROP POLICY IF EXISTS "Restaurant owners can manage meal ingredients" ON public.meal_ingredients;
CREATE POLICY "Restaurant owners can manage own meal ingredients" ON public.meal_ingredients
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM restaurants WHERE restaurants.id = meal_ingredients.restaurant_id AND restaurants.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM restaurants WHERE restaurants.id = meal_ingredients.restaurant_id AND restaurants.owner_id = auth.uid()
  ));

-- events
DROP POLICY IF EXISTS "Restaurant owners can manage events" ON public.events;
CREATE POLICY "Restaurant owners can manage own events" ON public.events
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM restaurants WHERE restaurants.id = events.restaurant_id AND restaurants.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM restaurants WHERE restaurants.id = events.restaurant_id AND restaurants.owner_id = auth.uid()
  ));

-- sales_history
DROP POLICY IF EXISTS "Restaurant owners can manage sales history" ON public.sales_history;
CREATE POLICY "Restaurant owners can manage own sales history" ON public.sales_history
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM restaurants WHERE restaurants.id = sales_history.restaurant_id AND restaurants.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM restaurants WHERE restaurants.id = sales_history.restaurant_id AND restaurants.owner_id = auth.uid()
  ));
