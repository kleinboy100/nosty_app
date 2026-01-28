-- Add explicit DENY policy for anonymous access to profiles table
-- This makes the security posture crystal clear and prevents future misconfigurations

CREATE POLICY "Deny anonymous access to profiles" 
ON public.profiles 
AS RESTRICTIVE
FOR ALL 
TO anon 
USING (false) 
WITH CHECK (false);