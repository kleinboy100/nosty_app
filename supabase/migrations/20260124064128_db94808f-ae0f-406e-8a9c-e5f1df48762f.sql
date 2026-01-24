
-- Drop existing constraint and add updated one with awaiting_payment status
ALTER TABLE public.orders DROP CONSTRAINT orders_status_check;

ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
CHECK (status = ANY (ARRAY['pending', 'awaiting_payment', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled']));
