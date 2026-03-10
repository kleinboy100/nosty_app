-- Drop the duplicate RESTRICTIVE policies
DROP POLICY IF EXISTS "Allow public read access to meal_recipes" ON public.meal_recipes;
DROP POLICY IF EXISTS "public_read_meal_recipes" ON public.meal_recipes;

-- Create a single PERMISSIVE policy for public read access
CREATE POLICY "Public can read meal recipes"
ON public.meal_recipes
FOR SELECT
TO public
USING (true);