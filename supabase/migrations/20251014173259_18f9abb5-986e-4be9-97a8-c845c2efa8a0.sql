-- Create products table to store WooCommerce product data
CREATE TABLE IF NOT EXISTS public.products (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  stock_status TEXT NOT NULL,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access (no auth required for viewing products)
CREATE POLICY "Public read access for products"
  ON public.products
  FOR SELECT
  USING (true);

-- Create policy to allow service role to insert/update products
CREATE POLICY "Service role can manage products"
  ON public.products
  FOR ALL
  USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_products_stock_status ON public.products(stock_status);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX IF NOT EXISTS idx_products_synced_at ON public.products(synced_at);

-- Create function to update synced_at timestamp
CREATE OR REPLACE FUNCTION update_synced_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.synced_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update synced_at on product updates
CREATE TRIGGER update_products_synced_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION update_synced_at();