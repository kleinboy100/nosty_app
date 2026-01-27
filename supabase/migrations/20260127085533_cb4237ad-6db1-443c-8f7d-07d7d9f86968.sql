-- Create a public view for reviews that hides user_id to prevent tracking
CREATE VIEW public.reviews_public
WITH (security_invoker=on) AS
SELECT 
  id,
  restaurant_id,
  rating,
  comment,
  created_at
FROM public.reviews;

-- Grant access to the view for public reading
GRANT SELECT ON public.reviews_public TO anon, authenticated;

-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;

-- Create new policy: Only authenticated users can view reviews (for managing their own)
-- Public viewing happens through reviews_public view
CREATE POLICY "Users can view own reviews"
ON public.reviews
FOR SELECT
USING (auth.uid() = user_id);

-- Restaurant owners can also view reviews for their restaurant
CREATE POLICY "Restaurant owners can view reviews for their restaurant"
ON public.reviews
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM restaurants
    WHERE restaurants.id = reviews.restaurant_id
    AND restaurants.owner_id = auth.uid()
  )
);

-- Add comment documenting the security design
COMMENT ON VIEW public.reviews_public IS 
'Public view for reviews that hides user_id and order_id to prevent customer tracking. Use this view for public-facing review displays.';