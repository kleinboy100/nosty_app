-- Add order_number column with auto-incrementing sequence
ALTER TABLE public.orders 
ADD COLUMN order_number INTEGER;

-- Create a sequence for order numbers starting at 1
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START WITH 1 INCREMENT BY 1;

-- Backfill existing orders with sequential numbers based on created_at
WITH numbered_orders AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM public.orders
)
UPDATE public.orders 
SET order_number = numbered_orders.rn
FROM numbered_orders
WHERE public.orders.id = numbered_orders.id;

-- Set the sequence to continue from the highest existing order number
SELECT setval('public.order_number_seq', COALESCE((SELECT MAX(order_number) FROM public.orders), 0) + 1, false);

-- Make order_number NOT NULL after backfill
ALTER TABLE public.orders 
ALTER COLUMN order_number SET NOT NULL;

-- Add unique constraint
ALTER TABLE public.orders 
ADD CONSTRAINT orders_order_number_unique UNIQUE (order_number);

-- Create trigger function to auto-assign order number
CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := nextval('public.order_number_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger
CREATE TRIGGER trigger_set_order_number
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_order_number();