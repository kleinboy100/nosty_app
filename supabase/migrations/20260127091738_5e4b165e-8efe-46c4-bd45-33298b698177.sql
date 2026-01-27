-- Fix: profiles_table_public_exposure
-- Block anonymous access to profiles table containing PII (phone, address)
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- Fix: orders_table_delivery_address_exposure  
-- Block anonymous access to orders table containing delivery addresses and payment info
CREATE POLICY "Deny anonymous access to orders"
ON public.orders
FOR SELECT
TO anon
USING (false);

-- Fix: messages_table_unauthorized_access
-- Block anonymous access to messages table containing private customer-restaurant communications
CREATE POLICY "Deny anonymous access to messages"
ON public.messages
FOR SELECT
TO anon
USING (false);

-- Add documentation comments
COMMENT ON POLICY "Deny anonymous access to profiles" ON public.profiles IS 
'Security: Prevents unauthenticated users from accessing PII (phone numbers, addresses)';

COMMENT ON POLICY "Deny anonymous access to orders" ON public.orders IS 
'Security: Prevents unauthenticated users from accessing delivery addresses and payment info';

COMMENT ON POLICY "Deny anonymous access to messages" ON public.messages IS 
'Security: Prevents unauthenticated users from reading private customer-restaurant communications';