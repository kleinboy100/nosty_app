-- Fix menu_items RLS: The "Anyone can view" policy needs to be PERMISSIVE, not RESTRICTIVE
-- Currently both policies are RESTRICTIVE, so authenticated non-owners fail the owner check

-- Drop the problematic restrictive policy
DROP POLICY IF EXISTS "Anyone can view available menu items" ON public.menu_items;

-- Create a PERMISSIVE policy that allows anyone (including authenticated users) to view available items
CREATE POLICY "Anyone can view available menu items"
ON public.menu_items
FOR SELECT
TO public
USING (is_available = true);

-- The restaurant owner policy for ALL should only apply to INSERT, UPDATE, DELETE - not SELECT
-- Drop and recreate it properly
DROP POLICY IF EXISTS "Restaurant owners can manage menu items" ON public.menu_items;

-- Create separate policies for management (INSERT, UPDATE, DELETE)
CREATE POLICY "Restaurant owners can insert menu items"
ON public.menu_items
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM restaurants
  WHERE restaurants.id = menu_items.restaurant_id 
  AND restaurants.owner_id = auth.uid()
));

CREATE POLICY "Restaurant owners can update menu items"
ON public.menu_items
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM restaurants
  WHERE restaurants.id = menu_items.restaurant_id 
  AND restaurants.owner_id = auth.uid()
));

CREATE POLICY "Restaurant owners can delete menu items"
ON public.menu_items
FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM restaurants
  WHERE restaurants.id = menu_items.restaurant_id 
  AND restaurants.owner_id = auth.uid()
));