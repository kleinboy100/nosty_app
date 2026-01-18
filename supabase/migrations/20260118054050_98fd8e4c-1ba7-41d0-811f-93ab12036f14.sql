-- Create messages table for in-app messaging between customers and restaurants
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'restaurant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_read BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Customers can view/send messages for their orders
CREATE POLICY "Customers can view messages for their orders"
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = messages.order_id 
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Customers can send messages for their orders"
ON public.messages FOR INSERT
WITH CHECK (
  sender_type = 'customer' AND
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = messages.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- Restaurant owners can view/send messages for orders at their restaurants
CREATE POLICY "Restaurant owners can view messages for their orders"
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.restaurants r ON o.restaurant_id = r.id
    WHERE o.id = messages.order_id 
    AND r.owner_id = auth.uid()
  )
);

CREATE POLICY "Restaurant owners can send messages for their orders"
ON public.messages FOR INSERT
WITH CHECK (
  sender_type = 'restaurant' AND
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.restaurants r ON o.restaurant_id = r.id
    WHERE o.id = messages.order_id 
    AND r.owner_id = auth.uid()
  )
);

-- Mark messages as read
CREATE POLICY "Users can update message read status"
ON public.messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = messages.order_id 
    AND (orders.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.restaurants r WHERE r.id = orders.restaurant_id AND r.owner_id = auth.uid()
    ))
  )
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;