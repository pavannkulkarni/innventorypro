-- Create enum for PO status
CREATE TYPE public.po_status AS ENUM (
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'PARTIALLY_RECEIVED',
  'RECEIVED',
  'CANCELLED'
);

-- Create enum for approval status
CREATE TYPE public.approval_status AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED'
);

-- Create purchase_orders table
CREATE TABLE public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  po_number TEXT NOT NULL,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  status public.po_status NOT NULL DEFAULT 'DRAFT',
  order_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expected_delivery_date TIMESTAMP WITH TIME ZONE,
  total_amount NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_by UUID NOT NULL,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_po_number UNIQUE (po_number, user_id)
);

-- Create purchase_order_items table
CREATE TABLE public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  received_quantity INTEGER NOT NULL DEFAULT 0 CHECK (received_quantity >= 0),
  line_total NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT check_received_not_exceeds_ordered CHECK (received_quantity <= quantity)
);

-- Create purchase_order_approvals table
CREATE TABLE public.purchase_order_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL,
  status public.approval_status NOT NULL DEFAULT 'PENDING',
  comments TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for purchase_orders
CREATE POLICY "Users can view their own purchase orders"
  ON public.purchase_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own purchase orders"
  ON public.purchase_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id AND auth.uid() = created_by);

CREATE POLICY "Users can update their own purchase orders"
  ON public.purchase_orders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own draft purchase orders"
  ON public.purchase_orders FOR DELETE
  USING (auth.uid() = user_id AND status = 'DRAFT');

-- RLS Policies for purchase_order_items
CREATE POLICY "Users can view their own purchase order items"
  ON public.purchase_order_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own purchase order items"
  ON public.purchase_order_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchase order items"
  ON public.purchase_order_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own purchase order items"
  ON public.purchase_order_items FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for purchase_order_approvals
CREATE POLICY "Users can view their own purchase order approvals"
  ON public.purchase_order_approvals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own purchase order approvals"
  ON public.purchase_order_approvals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update purchase order approvals they are assigned to"
  ON public.purchase_order_approvals FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = approver_id);

-- Create function to update PO total amount
CREATE OR REPLACE FUNCTION public.update_po_total()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.purchase_orders
  SET total_amount = (
    SELECT COALESCE(SUM(line_total), 0)
    FROM public.purchase_order_items
    WHERE purchase_order_id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id)
  ),
  updated_at = now()
  WHERE id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for updating PO totals
CREATE TRIGGER update_po_total_on_item_insert
  AFTER INSERT ON public.purchase_order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_po_total();

CREATE TRIGGER update_po_total_on_item_update
  AFTER UPDATE ON public.purchase_order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_po_total();

CREATE TRIGGER update_po_total_on_item_delete
  AFTER DELETE ON public.purchase_order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_po_total();

-- Create trigger for updated_at timestamp
CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_purchase_order_items_updated_at
  BEFORE UPDATE ON public.purchase_order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_purchase_order_approvals_updated_at
  BEFORE UPDATE ON public.purchase_order_approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create function to generate PO number
CREATE OR REPLACE FUNCTION public.generate_po_number()
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
    CAST(SUBSTRING(po_number FROM '\d+$') AS INTEGER)
  ), 0) + 1
  INTO sequence_num
  FROM public.purchase_orders
  WHERE po_number LIKE 'PO-' || year_prefix || '-%'
  AND user_id = auth.uid();
  
  new_number := 'PO-' || year_prefix || '-' || LPAD(sequence_num::TEXT, 5, '0');
  
  RETURN new_number;
END;
$$;