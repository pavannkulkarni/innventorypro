-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'low_stock', 'out_of_stock', 'stock_movement', 'info'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create function to check and create low stock notifications
CREATE OR REPLACE FUNCTION public.check_low_stock_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  product_record RECORD;
  variant_record RECORD;
BEGIN
  -- Check products
  FOR product_record IN 
    SELECT p.id, p.user_id, p.name, p.quantity, p.reorder_level
    FROM products p
    WHERE p.quantity <= COALESCE(p.reorder_level, 0)
    AND p.reorder_level > 0
  LOOP
    -- Check if notification already exists for this product
    IF NOT EXISTS (
      SELECT 1 FROM notifications
      WHERE user_id = product_record.user_id
      AND type IN ('low_stock', 'out_of_stock')
      AND metadata->>'product_id' = product_record.id::text
      AND is_read = false
    ) THEN
      INSERT INTO notifications (user_id, type, title, message, metadata)
      VALUES (
        product_record.user_id,
        CASE WHEN product_record.quantity = 0 THEN 'out_of_stock' ELSE 'low_stock' END,
        CASE WHEN product_record.quantity = 0 THEN 'Out of Stock' ELSE 'Low Stock Alert' END,
        CASE 
          WHEN product_record.quantity = 0 THEN product_record.name || ' is out of stock'
          ELSE product_record.name || ' is running low (Qty: ' || product_record.quantity || ', Reorder at: ' || product_record.reorder_level || ')'
        END,
        jsonb_build_object('product_id', product_record.id, 'quantity', product_record.quantity, 'reorder_level', product_record.reorder_level)
      );
    END IF;
  END LOOP;

  -- Check variants
  FOR variant_record IN 
    SELECT v.id, v.user_id, v.name, v.quantity, v.reorder_level, p.name as product_name
    FROM product_variants v
    JOIN products p ON v.product_id = p.id
    WHERE v.quantity <= COALESCE(v.reorder_level, 0)
    AND v.reorder_level > 0
  LOOP
    -- Check if notification already exists for this variant
    IF NOT EXISTS (
      SELECT 1 FROM notifications
      WHERE user_id = variant_record.user_id
      AND type IN ('low_stock', 'out_of_stock')
      AND metadata->>'variant_id' = variant_record.id::text
      AND is_read = false
    ) THEN
      INSERT INTO notifications (user_id, type, title, message, metadata)
      VALUES (
        variant_record.user_id,
        CASE WHEN variant_record.quantity = 0 THEN 'out_of_stock' ELSE 'low_stock' END,
        CASE WHEN variant_record.quantity = 0 THEN 'Out of Stock' ELSE 'Low Stock Alert' END,
        CASE 
          WHEN variant_record.quantity = 0 THEN variant_record.product_name || ' - ' || variant_record.name || ' is out of stock'
          ELSE variant_record.product_name || ' - ' || variant_record.name || ' is running low (Qty: ' || variant_record.quantity || ', Reorder at: ' || variant_record.reorder_level || ')'
        END,
        jsonb_build_object('variant_id', variant_record.id, 'product_id', variant_record.user_id, 'quantity', variant_record.quantity, 'reorder_level', variant_record.reorder_level)
      );
    END IF;
  END LOOP;
END;
$$;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;