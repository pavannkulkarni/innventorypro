-- 1) Create or replace function to handle stock movements per sale item
CREATE OR REPLACE FUNCTION public.create_stock_movement_for_sale_item()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sale_record RECORD;
BEGIN
  -- Fetch related sale to get warehouse, date and number
  SELECT id, warehouse_id, sale_number, sale_date
  INTO sale_record
  FROM public.sales
  WHERE id = NEW.sale_id;

  -- Only create stock movements for completed sales
  IF sale_record.id IS NOT NULL THEN
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
    ) VALUES (
      NEW.user_id,
      NEW.product_id,
      NEW.variant_id,
      sale_record.warehouse_id,
      'SALE'::transaction_type,
      NEW.quantity,              -- positive; treated as stock_out in InventoryView
      sale_record.sale_date,
      sale_record.sale_number,
      'Sale - ' || sale_record.sale_number
    );

    -- Update product quantities (non-variant)
    IF NEW.variant_id IS NULL THEN
      UPDATE public.products p
      SET quantity = p.quantity - NEW.quantity,
          updated_at = now()
      WHERE p.id = NEW.product_id;
    ELSE
      -- Update variant quantities
      UPDATE public.product_variants pv
      SET quantity = pv.quantity - NEW.quantity,
          updated_at = now()
      WHERE pv.id = NEW.variant_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 2) Drop old trigger on sales if it exists (no-op if already removed)
DROP TRIGGER IF EXISTS create_stock_movement_on_sale ON public.sales;

-- 3) Create new trigger on sale_items so it runs after each line item is inserted
DROP TRIGGER IF EXISTS create_stock_movement_on_sale_item ON public.sale_items;

CREATE TRIGGER create_stock_movement_on_sale_item
AFTER INSERT ON public.sale_items
FOR EACH ROW
EXECUTE FUNCTION public.create_stock_movement_for_sale_item();

-- 4) Backfill stock movements for existing sale_items that don't yet have SALE movements
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
  s.warehouse_id,
  'SALE'::transaction_type,
  si.quantity,
  s.sale_date,
  s.sale_number,
  'Sale - ' || s.sale_number
FROM public.sale_items si
JOIN public.sales s ON s.id = si.sale_id
LEFT JOIN public.stock_movements sm
  ON sm.reference_number = s.sale_number
  AND sm.product_id = si.product_id
  AND COALESCE(sm.variant_id::text, '') = COALESCE(si.variant_id::text, '')
  AND sm.transaction_type = 'SALE'
WHERE sm.id IS NULL;

-- 5) Adjust product and variant quantities for those backfilled sale items
UPDATE public.products p
SET quantity = p.quantity - si.quantity,
    updated_at = now()
FROM public.sale_items si
JOIN public.sales s ON s.id = si.sale_id
LEFT JOIN public.stock_movements sm
  ON sm.reference_number = s.sale_number
  AND sm.product_id = si.product_id
  AND COALESCE(sm.variant_id::text, '') = COALESCE(si.variant_id::text, '')
  AND sm.transaction_type = 'SALE'
WHERE sm.id IS NULL
  AND si.variant_id IS NULL
  AND p.id = si.product_id;

UPDATE public.product_variants pv
SET quantity = pv.quantity - si.quantity,
    updated_at = now()
FROM public.sale_items si
JOIN public.sales s ON s.id = si.sale_id
LEFT JOIN public.stock_movements sm
  ON sm.reference_number = s.sale_number
  AND sm.product_id = si.product_id
  AND COALESCE(sm.variant_id::text, '') = COALESCE(si.variant_id::text, '')
  AND sm.transaction_type = 'SALE'
WHERE sm.id IS NULL
  AND si.variant_id IS NOT NULL
  AND pv.id = si.variant_id;