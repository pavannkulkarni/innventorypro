-- Update products table to add foreign keys
ALTER TABLE public.products 
  DROP COLUMN IF EXISTS category,
  DROP COLUMN IF EXISTS supplier,
  DROP COLUMN IF EXISTS location,
  ADD COLUMN category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  ADD COLUMN warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  ADD COLUMN currency_id UUID REFERENCES public.currencies(id) ON DELETE SET NULL;

-- Create product_variants table
CREATE TABLE public.product_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  barcode TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  price NUMERIC(15, 2),
  cost NUMERIC(15, 2),
  attributes JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own product variants"
ON public.product_variants FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own product variants"
ON public.product_variants FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own product variants"
ON public.product_variants FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own product variants"
ON public.product_variants FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_product_variants_updated_at
BEFORE UPDATE ON public.product_variants
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Add indexes for performance
CREATE INDEX idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_products_supplier_id ON public.products(supplier_id);
CREATE INDEX idx_products_warehouse_id ON public.products(warehouse_id);
CREATE INDEX idx_products_currency_id ON public.products(currency_id);