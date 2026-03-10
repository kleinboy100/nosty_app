
-- Enable RLS on all unprotected inventory/analytics tables
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredient_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_history ENABLE ROW LEVEL SECURITY;

-- Create a helper function to check if user is any restaurant owner
CREATE OR REPLACE FUNCTION public.is_any_restaurant_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM restaurants WHERE owner_id = auth.uid()
  )
$$;

-- stock: owner-only access
CREATE POLICY "Restaurant owners can manage stock"
ON public.stock FOR ALL TO authenticated
USING (public.is_any_restaurant_owner())
WITH CHECK (public.is_any_restaurant_owner());

-- ingredient_stock: owner-only access
CREATE POLICY "Restaurant owners can manage ingredient stock"
ON public.ingredient_stock FOR ALL TO authenticated
USING (public.is_any_restaurant_owner())
WITH CHECK (public.is_any_restaurant_owner());

-- stock_transactions: owner-only access
CREATE POLICY "Restaurant owners can manage stock transactions"
ON public.stock_transactions FOR ALL TO authenticated
USING (public.is_any_restaurant_owner())
WITH CHECK (public.is_any_restaurant_owner());

-- meal_ingredients: owner-only access
CREATE POLICY "Restaurant owners can manage meal ingredients"
ON public.meal_ingredients FOR ALL TO authenticated
USING (public.is_any_restaurant_owner())
WITH CHECK (public.is_any_restaurant_owner());

-- events: owner-only access
CREATE POLICY "Restaurant owners can manage events"
ON public.events FOR ALL TO authenticated
USING (public.is_any_restaurant_owner())
WITH CHECK (public.is_any_restaurant_owner());

-- sales_history: owner-only access
CREATE POLICY "Restaurant owners can manage sales history"
ON public.sales_history FOR ALL TO authenticated
USING (public.is_any_restaurant_owner())
WITH CHECK (public.is_any_restaurant_owner());
