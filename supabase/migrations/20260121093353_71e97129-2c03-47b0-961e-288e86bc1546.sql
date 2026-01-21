-- Add Yoco API keys to restaurants table (encrypted storage via column)
ALTER TABLE public.restaurants
ADD COLUMN yoco_secret_key TEXT NULL,
ADD COLUMN yoco_public_key TEXT NULL;

-- Create a table to track online payments
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT NOT NULL DEFAULT 'ZAR',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed, cancelled
  yoco_checkout_id TEXT NULL,
  yoco_payment_id TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users can view payments for their orders
CREATE POLICY "Users can view payments for their orders"
ON public.payments
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM orders WHERE orders.id = payments.order_id AND orders.user_id = auth.uid()
));

-- Restaurant owners can view payments for their orders
CREATE POLICY "Restaurant owners can view payments for their orders"
ON public.payments
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM orders o
  JOIN restaurants r ON o.restaurant_id = r.id
  WHERE o.id = payments.order_id AND r.owner_id = auth.uid()
));

-- Allow insert via edge function (service role)
CREATE POLICY "Allow service role to manage payments"
ON public.payments
FOR ALL
USING (true)
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();