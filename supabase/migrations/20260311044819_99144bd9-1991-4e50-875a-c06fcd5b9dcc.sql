-- Fix 1: Replace public read policy on meal_recipes with owner-only access
DROP POLICY IF EXISTS "Public can read meal recipes" ON public.meal_recipes;

CREATE POLICY "Restaurant owners can manage meal recipes"
ON public.meal_recipes
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM restaurants
  WHERE restaurants.owner_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM restaurants
  WHERE restaurants.owner_id = auth.uid()
));

-- Fix 2: Add CHECK constraint on reviews.rating to enforce 1-5 range
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_rating_range_check
  CHECK (rating BETWEEN 1 AND 5);