-- Create sales table to record completed transactions
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sale_number TEXT NOT NULL,
  warehouse_id UUID NOT NULL,
  sale_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'completed',
  notes TEXT,
  cashier_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sale_items table for line items
CREATE TABLE public.sale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sale_id UUID NOT NULL,
  product_id UUID NOT NULL,
  variant_id UUID,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  line_total NUMERIC NOT NULL,
  discount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sales
CREATE POLICY "Users can view their own sales"
  ON public.sales FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sales"
  ON public.sales FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sales"
  ON public.sales FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sales"
  ON public.sales FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for sale_items
CREATE POLICY "Users can view their own sale items"
  ON public.sale_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sale items"
  ON public.sale_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sale items"
  ON public.sale_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sale items"
  ON public.sale_items FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to generate sale numbers
CREATE OR REPLACE FUNCTION public.generate_sale_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  year_prefix TEXT;
  sequence_num INTEGER;
BEGIN
  year_prefix := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(sale_number FROM '\d+$') AS INTEGER)
  ), 0) + 1
  INTO sequence_num
  FROM public.sales
  WHERE sale_number LIKE 'SALE-' || year_prefix || '-%'
  AND user_id = auth.uid();
  
  new_number := 'SALE-' || year_prefix || '-' || LPAD(sequence_num::TEXT, 5, '0');
  
  RETURN new_number;
END;
$$;

-- Create trigger to update sales updated_at
CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create trigger to update sale_items updated_at
CREATE TRIGGER update_sale_items_updated_at
  BEFORE UPDATE ON public.sale_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create function to auto-create stock movements when a sale is completed
CREATE OR REPLACE FUNCTION public.create_stock_movement_for_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create stock movements for completed sales
  IF NEW.payment_status = 'completed' THEN
    -- Insert stock movements for each sale item
    INSERT INTO public.stock_movements (
      user_id,
      product_id,
      variant_id,
      warehouse_id,
      transaction_type,
      quantity,
      transaction_date,
      reference_number,
      notes
    )
    SELECT
      si.user_id,
      si.product_id,
      si.variant_id,
      NEW.warehouse_id,
      'SALE'::transaction_type,
      -si.quantity, -- Negative to deduct from inventory
      NEW.sale_date,
      NEW.sale_number,
      'Sale - ' || NEW.sale_number
    FROM public.sale_items si
    WHERE si.sale_id = NEW.id;

    -- Update product quantities
    UPDATE public.products p
    SET quantity = p.quantity - si.quantity
    FROM public.sale_items si
    WHERE si.sale_id = NEW.id
      AND si.product_id = p.id
      AND si.variant_id IS NULL;

    -- Update variant quantities
    UPDATE public.product_variants pv
    SET quantity = pv.quantity - si.quantity
    FROM public.sale_items si
    WHERE si.sale_id = NEW.id
      AND si.variant_id = pv.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to auto-create stock movements on sale insert
CREATE TRIGGER create_stock_movement_on_sale
  AFTER INSERT ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.create_stock_movement_for_sale();