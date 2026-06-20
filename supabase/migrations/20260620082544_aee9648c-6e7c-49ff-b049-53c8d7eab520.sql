
-- 1. Strengthen purchase_order_items INSERT policy to verify PO ownership
DROP POLICY IF EXISTS "Users can insert their own purchase order items" ON public.purchase_order_items;
CREATE POLICY "Users can insert their own purchase order items"
ON public.purchase_order_items
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.purchase_orders
    WHERE id = purchase_order_id AND user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update their own purchase order items" ON public.purchase_order_items;
CREATE POLICY "Users can update their own purchase order items"
ON public.purchase_order_items
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.purchase_orders
    WHERE id = purchase_order_id AND user_id = auth.uid()
  )
);

-- 2. Add ownership guard inside update_po_total
CREATE OR REPLACE FUNCTION public.update_po_total()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  po_id uuid;
  po_owner uuid;
BEGIN
  po_id := COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);
  SELECT user_id INTO po_owner FROM public.purchase_orders WHERE id = po_id;

  IF po_owner IS NULL OR po_owner <> COALESCE(NEW.user_id, OLD.user_id) THEN
    RAISE EXCEPTION 'Purchase order ownership mismatch';
  END IF;

  UPDATE public.purchase_orders
  SET total_amount = (
    SELECT COALESCE(SUM(line_total), 0)
    FROM public.purchase_order_items
    WHERE purchase_order_id = po_id
  ),
  updated_at = now()
  WHERE id = po_id AND user_id = po_owner;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 3. Add user_id ownership guard in stock triggers
CREATE OR REPLACE FUNCTION public.create_stock_movement_for_sale_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  sale_record RECORD;
  product_owner uuid;
BEGIN
  -- Ownership check: product must belong to same user
  IF NEW.variant_id IS NULL THEN
    SELECT user_id INTO product_owner FROM public.products WHERE id = NEW.product_id;
  ELSE
    SELECT user_id INTO product_owner FROM public.product_variants WHERE id = NEW.variant_id;
  END IF;

  IF product_owner IS NULL OR product_owner <> NEW.user_id THEN
    RAISE EXCEPTION 'Product/variant ownership mismatch';
  END IF;

  SELECT id, warehouse_id, sale_number, sale_date
  INTO sale_record
  FROM public.sales
  WHERE id = NEW.sale_id AND user_id = NEW.user_id;

  IF sale_record.id IS NULL THEN
    RAISE EXCEPTION 'Sale ownership mismatch';
  END IF;

  INSERT INTO public.stock_movements (
    user_id, product_id, variant_id, warehouse_id,
    transaction_type, quantity, transaction_date, reference_number, notes
  ) VALUES (
    NEW.user_id, NEW.product_id, NEW.variant_id, sale_record.warehouse_id,
    'SALE'::transaction_type, NEW.quantity, sale_record.sale_date,
    sale_record.sale_number, 'Sale - ' || sale_record.sale_number
  );

  IF NEW.variant_id IS NULL THEN
    UPDATE public.products p
    SET quantity = p.quantity - NEW.quantity, updated_at = now()
    WHERE p.id = NEW.product_id AND p.user_id = NEW.user_id;
  ELSE
    UPDATE public.product_variants pv
    SET quantity = pv.quantity - NEW.quantity, updated_at = now()
    WHERE pv.id = NEW.variant_id AND pv.user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_return_stock_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  product_owner uuid;
BEGIN
  IF NEW.variant_id IS NULL THEN
    SELECT user_id INTO product_owner FROM public.products WHERE id = NEW.product_id;
  ELSE
    SELECT user_id INTO product_owner FROM public.product_variants WHERE id = NEW.variant_id;
  END IF;

  IF product_owner IS NULL OR product_owner <> NEW.user_id THEN
    RAISE EXCEPTION 'Product/variant ownership mismatch';
  END IF;

  UPDATE public.products
  SET quantity = quantity + NEW.quantity, updated_at = now()
  WHERE id = NEW.product_id AND user_id = NEW.user_id;

  IF NEW.variant_id IS NOT NULL THEN
    UPDATE public.product_variants
    SET quantity = quantity + NEW.quantity, updated_at = now()
    WHERE id = NEW.variant_id AND user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$function$;

-- 4. Lock down purchase_order_approvals UPDATE so approvers can't reassign
DROP POLICY IF EXISTS "Approvers can update their assignments" ON public.purchase_order_approvals;
DROP POLICY IF EXISTS "Approvers can update assignments" ON public.purchase_order_approvals;
DROP POLICY IF EXISTS "Approvers can update their own approvals" ON public.purchase_order_approvals;

CREATE POLICY "Approvers can update their own approvals"
ON public.purchase_order_approvals
FOR UPDATE
TO authenticated
USING (auth.uid() = approver_id)
WITH CHECK (
  auth.uid() = approver_id
  AND purchase_order_id = (
    SELECT purchase_order_id FROM public.purchase_order_approvals poa WHERE poa.id = purchase_order_approvals.id
  )
  AND user_id = (
    SELECT user_id FROM public.purchase_order_approvals poa WHERE poa.id = purchase_order_approvals.id
  )
  AND approver_id = (
    SELECT approver_id FROM public.purchase_order_approvals poa WHERE poa.id = purchase_order_approvals.id
  )
);
