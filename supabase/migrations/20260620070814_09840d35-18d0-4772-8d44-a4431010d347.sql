
-- 1) Restrict generator functions: revoke from anon, keep authenticated (app calls via RPC)
REVOKE EXECUTE ON FUNCTION public.generate_sale_number() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_po_number() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_return_number() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_sale_number() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_po_number() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_return_number() TO authenticated;

-- Also lock down other SECURITY DEFINER helpers that should not be callable from the API
REVOKE EXECUTE ON FUNCTION public.check_low_stock_notifications() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_return_stock_update() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_po_total() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_stock_movement_for_sale() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_stock_movement_for_sale_item() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;

-- 2) Notifications: add explicit INSERT policy so users can only create notifications targeting themselves
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
CREATE POLICY "Users can insert their own notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3) Harden purchase_order_approvals UPDATE policy: only the assigned approver can update,
-- and they cannot reassign the approver or change ownership.
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='public' AND tablename='purchase_order_approvals' AND cmd='UPDATE'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.purchase_order_approvals', pol.policyname);
  END LOOP;
END$$;

CREATE POLICY "Approvers can update their own approval row"
  ON public.purchase_order_approvals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = approver_id)
  WITH CHECK (auth.uid() = approver_id);
