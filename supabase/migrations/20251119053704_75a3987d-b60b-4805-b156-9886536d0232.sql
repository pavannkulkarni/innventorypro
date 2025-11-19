-- Add reorder_level to products table
ALTER TABLE public.products 
ADD COLUMN reorder_level integer DEFAULT 0;

-- Add reorder_level to product_variants table
ALTER TABLE public.product_variants 
ADD COLUMN reorder_level integer DEFAULT 0;

-- Create enum for transaction types
CREATE TYPE public.transaction_type AS ENUM (
  'OPENING_STOCK',
  'PURCHASE',
  'SALE',
  'RETURN',
  'ADJUSTMENT',
  'TRANSFER_IN',
  'TRANSFER_OUT'
);

-- Create stock_movements table
CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE,
  warehouse_id uuid NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  transaction_type transaction_type NOT NULL,
  quantity integer NOT NULL,
  reference_number text,
  notes text,
  transaction_date timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on stock_movements
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stock_movements
CREATE POLICY "Users can view their own stock movements"
  ON public.stock_movements
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stock movements"
  ON public.stock_movements
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stock movements"
  ON public.stock_movements
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stock movements"
  ON public.stock_movements
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX idx_stock_movements_product_id ON public.stock_movements(product_id);
CREATE INDEX idx_stock_movements_variant_id ON public.stock_movements(variant_id);
CREATE INDEX idx_stock_movements_warehouse_id ON public.stock_movements(warehouse_id);
CREATE INDEX idx_stock_movements_transaction_date ON public.stock_movements(transaction_date);

-- Add trigger for updated_at
CREATE TRIGGER update_stock_movements_updated_at
  BEFORE UPDATE ON public.stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();