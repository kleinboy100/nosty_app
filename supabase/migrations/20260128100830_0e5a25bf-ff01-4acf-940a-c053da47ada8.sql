
-- Fix menu_items: Change the SELECT policy to PERMISSIVE so anyone can see available items
DROP POLICY IF EXISTS "Anyone can view available menu items" ON public.menu_items;

CREATE POLICY "Anyone can view available menu items"
ON public.menu_items
FOR SELECT
TO public
USING (is_available = true);

-- Fix profiles: The restrictive "Deny anonymous access" blocks EVERYONE including authenticated users
-- Change it to only target the anon role
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;

CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Also need to make the authenticated user policies PERMISSIVE (they were restrictive)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
