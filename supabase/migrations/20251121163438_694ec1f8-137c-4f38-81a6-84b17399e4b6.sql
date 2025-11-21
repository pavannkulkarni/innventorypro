-- Create trigger to automatically create stock movements when a sale is completed
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

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS create_stock_movement_on_sale ON public.sales;

-- Create the trigger
CREATE TRIGGER create_stock_movement_on_sale
AFTER INSERT ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.create_stock_movement_for_sale();