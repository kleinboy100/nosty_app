
-- Fix infinite recursion between restaurants and restaurant_staff RLS policies

-- 1. Drop the problematic policies
DROP POLICY IF EXISTS "Staff can view assigned restaurant" ON public.restaurants;
DROP POLICY IF EXISTS "Restaurant owners can manage staff" ON public.restaurant_staff;
DROP POLICY IF EXISTS "Staff can view own assignment" ON public.restaurant_staff;

-- 2. Recreate restaurant_staff policies using SECURITY DEFINER functions (no direct restaurants query)
CREATE POLICY "Restaurant owners can manage staff"
ON public.restaurant_staff FOR ALL TO authenticated
USING (is_restaurant_owner(restaurant_id))
WITH CHECK (is_restaurant_owner(restaurant_id));

CREATE POLICY "Staff can view own assignment"
ON public.restaurant_staff FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 3. Recreate restaurants policy for staff using SECURITY DEFINER function (no direct restaurant_staff query)
CREATE POLICY "Staff can view assigned restaurant"
ON public.restaurants FOR SELECT TO authenticated
USING (is_restaurant_staff());
