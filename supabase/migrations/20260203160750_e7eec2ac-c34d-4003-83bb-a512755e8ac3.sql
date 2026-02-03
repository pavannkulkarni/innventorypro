-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create sale_returns table to track returns and refunds
CREATE TABLE public.sale_returns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  return_number TEXT NOT NULL,
  return_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_refund NUMERIC NOT NULL DEFAULT 0,
  refund_method TEXT NOT NULL DEFAULT 'cash',
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  processed_by TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sale_return_items table for individual returned items
CREATE TABLE public.sale_return_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sale_return_id UUID NOT NULL REFERENCES public.sale_returns(id) ON DELETE CASCADE,
  sale_item_id UUID NOT NULL REFERENCES public.sale_items(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  refund_amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.sale_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_return_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for sale_returns
CREATE POLICY "Users can view their own sale returns"
  ON public.sale_returns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sale returns"
  ON public.sale_returns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sale returns"
  ON public.sale_returns FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sale returns"
  ON public.sale_returns FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for sale_return_items
CREATE POLICY "Users can view their own sale return items"
  ON public.sale_return_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sale return items"
  ON public.sale_return_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sale return items"
  ON public.sale_return_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sale return items"
  ON public.sale_return_items FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to generate return number
CREATE OR REPLACE FUNCTION public.generate_return_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  today_prefix TEXT;
  sequence_num INTEGER;
BEGIN
  today_prefix := 'RET-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-';
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(return_number FROM length(today_prefix) + 1) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM public.sale_returns
  WHERE return_number LIKE today_prefix || '%';
  
  new_number := today_prefix || LPAD(sequence_num::TEXT, 4, '0');
  RETURN new_number;
END;
$$;

-- Trigger to update stock on return (add stock back)
CREATE OR REPLACE FUNCTION public.handle_return_stock_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update product quantity
  UPDATE public.products
  SET quantity = quantity + NEW.quantity,
      updated_at = now()
  WHERE id = NEW.product_id;
  
  -- Update variant quantity if applicable
  IF NEW.variant_id IS NOT NULL THEN
    UPDATE public.product_variants
    SET quantity = quantity + NEW.quantity,
        updated_at = now()
    WHERE id = NEW.variant_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_return_item_insert
  AFTER INSERT ON public.sale_return_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_return_stock_update();

-- Update timestamp triggers
CREATE TRIGGER update_sale_returns_updated_at
  BEFORE UPDATE ON public.sale_returns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sale_return_items_updated_at
  BEFORE UPDATE ON public.sale_return_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();