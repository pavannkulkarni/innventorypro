import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface ReceivePODialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrder: any;
  onSuccess?: () => void;
}

interface ReceivingItem {
  id: string;
  product_id: string;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  ordered_quantity: number;
  received_quantity: number;
  pending_quantity: number;
  receive_now: string;
}

export function ReceivePODialog({
  open,
  onOpenChange,
  purchaseOrder,
  onSuccess,
}: ReceivePODialogProps) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ReceivingItem[]>([]);

  useEffect(() => {
    if (open && purchaseOrder) {
      fetchItems();
    }
  }, [open, purchaseOrder]);

  const fetchItems = async () => {
    const { data } = await supabase
      .from("purchase_order_items")
      .select(`
        *,
        products(name),
        product_variants(name)
      `)
      .eq("purchase_order_id", purchaseOrder.id);

    if (data) {
      setItems(
        data.map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          variant_id: item.variant_id,
          product_name: item.products.name,
          variant_name: item.product_variants?.name || null,
          ordered_quantity: item.quantity,
          received_quantity: item.received_quantity,
          pending_quantity: item.quantity - item.received_quantity,
          receive_now: (item.quantity - item.received_quantity).toString(),
        }))
      );
    }
  };

  const updateReceiveQuantity = (id: string, value: string) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, receive_now: value } : item
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("You must be logged in");
      setLoading(false);
      return;
    }

    try {
      // Validate quantities
      const itemsToReceive = items.filter(
        (item) => Number(item.receive_now) > 0
      );

      if (itemsToReceive.length === 0) {
        toast.error("Please enter quantities to receive");
        setLoading(false);
        return;
      }

      for (const item of itemsToReceive) {
        const receiveQty = Number(item.receive_now);
        if (receiveQty > item.pending_quantity) {
          toast.error(
            `Cannot receive more than pending quantity for ${item.product_name}`
          );
          setLoading(false);
          return;
        }
      }

      // Update received quantities
      for (const item of itemsToReceive) {
        const receiveQty = Number(item.receive_now);
        const newReceivedQty = item.received_quantity + receiveQty;

        const { error: updateError } = await supabase
          .from("purchase_order_items")
          .update({ received_quantity: newReceivedQty })
          .eq("id", item.id);

        if (updateError) throw updateError;

        // Create stock movement
        const { error: movementError } = await supabase
          .from("stock_movements")
          .insert({
            user_id: session.user.id,
            product_id: item.product_id,
            variant_id: item.variant_id,
            warehouse_id: purchaseOrder.warehouse_id,
            transaction_type: "PURCHASE",
            quantity: receiveQty,
            reference_number: purchaseOrder.po_number,
            notes: `Received from PO ${purchaseOrder.po_number}`,
          });

        if (movementError) throw movementError;
      }

      // Check if all items are fully received
      const { data: allItems } = await supabase
        .from("purchase_order_items")
        .select("quantity, received_quantity")
        .eq("purchase_order_id", purchaseOrder.id);

      const isFullyReceived = allItems?.every(
        (item: any) => item.received_quantity >= item.quantity
      );

      const isPartiallyReceived = allItems?.some(
        (item: any) => item.received_quantity > 0
      );

      // Update PO status
      let newStatus = purchaseOrder.status;
      if (isFullyReceived) {
        newStatus = "RECEIVED";
      } else if (isPartiallyReceived) {
        newStatus = "PARTIALLY_RECEIVED";
      }

      const updateData: any = { status: newStatus };
      if (isFullyReceived) {
        updateData.received_at = new Date().toISOString();
      }

      const { error: poError } = await supabase
        .from("purchase_orders")
        .update(updateData)
        .eq("id", purchaseOrder.id);

      if (poError) throw poError;

      toast.success("Items received successfully");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to receive items");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Receive Purchase Order</DialogTitle>
          <DialogDescription>
            PO Number: {purchaseOrder?.po_number}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-3 p-4 border rounded-md bg-surface-100"
                >
                  <div className="col-span-5">
                    <div className="font-medium">{item.product_name}</div>
                    {item.variant_name && (
                      <div className="text-sm text-muted-foreground">
                        Variant: {item.variant_name}
                      </div>
                    )}
                  </div>

                  <div className="col-span-2 flex flex-col justify-center">
                    <div className="text-sm text-muted-foreground">Ordered</div>
                    <div className="font-medium">{item.ordered_quantity}</div>
                  </div>

                  <div className="col-span-2 flex flex-col justify-center">
                    <div className="text-sm text-muted-foreground">Received</div>
                    <div className="font-medium">{item.received_quantity}</div>
                  </div>

                  <div className="col-span-3">
                    <Label className="text-xs text-muted-foreground">
                      Receive Now (Max: {item.pending_quantity})
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max={item.pending_quantity}
                      value={item.receive_now}
                      onChange={(e) =>
                        updateReceiveQuantity(item.id, e.target.value)
                      }
                      className="mt-1"
                      disabled={item.pending_quantity === 0}
                    />
                    {item.pending_quantity === 0 && (
                      <Badge variant="success" className="mt-1">
                        Fully Received
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Processing..." : "Receive Items"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
