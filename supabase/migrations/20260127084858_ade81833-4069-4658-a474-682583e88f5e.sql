-- Add explicit deny-all policy for restaurant_payment_credentials
-- This documents the security intent that direct access is prohibited
-- All access must be through SECURITY DEFINER functions or service role
CREATE POLICY "No direct access to payment credentials"
ON public.restaurant_payment_credentials
FOR ALL
USING (false)
WITH CHECK (false);

-- Add comment documenting the security design
COMMENT ON TABLE public.restaurant_payment_credentials IS 
'Payment credentials are protected by a deny-all RLS policy. Access is only permitted through SECURITY DEFINER functions (update_restaurant_payment_credentials, remove_restaurant_payment_credentials, owner_has_payment_keys) or via service role in edge functions.';

-- Verify profiles table has proper protection against anonymous access
-- The existing policies already require auth.uid() which ensures authentication
-- But let's add an explicit comment for clarity
COMMENT ON TABLE public.profiles IS 
'User profiles containing PII (phone, address). Protected by RLS policies requiring authentication - only users can view/modify their own profile via auth.uid() = user_id check.';