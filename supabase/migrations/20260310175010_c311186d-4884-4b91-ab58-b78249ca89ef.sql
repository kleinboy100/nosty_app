CREATE POLICY "Owners can insert own restaurants"
ON public.restaurants
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);