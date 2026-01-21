-- Drop the overly permissive policy
DROP POLICY "Allow service role to manage payments" ON public.payments;

-- Create proper policies for payment management
-- Edge functions with service role bypass RLS anyway, so we don't need an explicit policy
-- Users can insert payments when creating orders
CREATE POLICY "Users can create payments for their orders"
ON public.payments
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM orders WHERE orders.id = payments.order_id AND orders.user_id = auth.uid()
));