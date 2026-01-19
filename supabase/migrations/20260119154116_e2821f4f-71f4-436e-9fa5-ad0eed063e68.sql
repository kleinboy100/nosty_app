-- Add payment_method column to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cash';

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint to prevent duplicate reviews per order
ALTER TABLE public.reviews ADD CONSTRAINT reviews_order_unique UNIQUE (order_id);

-- Enable Row Level Security
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for reviews
CREATE POLICY "Anyone can view reviews"
ON public.reviews
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create reviews"
ON public.reviews
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
ON public.reviews
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
ON public.reviews
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_reviews_restaurant_id ON public.reviews(restaurant_id);
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);

-- Update restaurant rating function
CREATE OR REPLACE FUNCTION public.update_restaurant_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.restaurants
  SET rating = (
    SELECT ROUND(AVG(rating)::numeric, 1)
    FROM public.reviews
    WHERE restaurant_id = COALESCE(NEW.restaurant_id, OLD.restaurant_id)
  )
  WHERE id = COALESCE(NEW.restaurant_id, OLD.restaurant_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic rating updates
DROP TRIGGER IF EXISTS update_rating_on_review ON public.reviews;
CREATE TRIGGER update_rating_on_review
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_restaurant_rating();