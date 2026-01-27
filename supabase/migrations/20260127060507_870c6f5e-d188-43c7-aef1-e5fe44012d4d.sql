-- Fix: Payment API Keys Exposed to Customers Through RLS Policy
-- The current policy "Users can view restaurants they ordered from" exposes yoco_secret_key
-- to any customer who has placed an order. This is a critical security vulnerability.

-- Drop the problematic policy that exposes payment keys to customers
DROP POLICY IF EXISTS "Users can view restaurants they ordered from" ON public.restaurants;

-- Customers should use the restaurants_public view which already excludes sensitive columns
-- Restaurant owners retain full access via the "Owners can manage own restaurants" policy