-- Add foreign key constraints to sale_items table for products and product_variants
ALTER TABLE public.sale_items
ADD CONSTRAINT sale_items_product_id_fkey
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;

ALTER TABLE public.sale_items
ADD CONSTRAINT sale_items_variant_id_fkey
FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE SET NULL;