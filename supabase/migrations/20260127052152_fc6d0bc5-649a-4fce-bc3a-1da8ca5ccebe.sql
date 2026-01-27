-- Confirm COD payment in a SECURITY DEFINER function so new users are not blocked by RLS edge cases
-- (Online payments remain handled by existing checkout + webhook flow)

CREATE OR REPLACE FUNCTION public.confirm_cod_payment(p_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Only allow the customer who owns the order to confirm COD
  UPDATE public.orders
  SET
    payment_method = 'cash',
    payment_confirmed = true,
    updated_at = now()
  WHERE id = p_order_id
    AND user_id = v_user_id;

  IF NOT FOUND THEN
    -- Either the order doesn't exist or doesn't belong to this user
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_cod_payment(uuid) TO authenticated;