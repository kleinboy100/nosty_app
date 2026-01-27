-- Remove overly permissive payments table policy
-- Edge functions use service role which bypasses RLS entirely, so this policy is unnecessary
-- and creates a security risk by allowing all authenticated users full access

DROP POLICY IF EXISTS "Allow service role to manage payments" ON public.payments;