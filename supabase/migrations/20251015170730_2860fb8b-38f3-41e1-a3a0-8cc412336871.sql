-- Add new columns to products table to match WooCommerce fields
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS stock_quantity integer,
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS tags text[],
ADD COLUMN IF NOT EXISTS on_sale boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS date_created timestamp with time zone;

-- Update created_at column to be nullable to avoid conflicts
ALTER TABLE public.products 
ALTER COLUMN created_at DROP NOT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_on_sale ON public.products(on_sale);
CREATE INDEX IF NOT EXISTS idx_products_stock_quantity ON public.products(stock_quantity);