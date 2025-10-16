-- Fix function search path security issue
DROP FUNCTION IF EXISTS update_synced_at() CASCADE;

CREATE OR REPLACE FUNCTION update_synced_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.synced_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Recreate trigger with fixed function
DROP TRIGGER IF EXISTS update_products_synced_at ON public.products;

CREATE TRIGGER update_products_synced_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION update_synced_at();