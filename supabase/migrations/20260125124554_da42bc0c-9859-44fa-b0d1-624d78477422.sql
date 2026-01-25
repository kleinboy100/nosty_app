-- Add order_type column to orders table (delivery or collection)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_type text NOT NULL DEFAULT 'delivery';

-- Add constraint to ensure valid order types
ALTER TABLE public.orders ADD CONSTRAINT orders_order_type_check CHECK (order_type IN ('delivery', 'collection'));