import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/hooks/useCurrency";
import { useToast } from "@/hooks/use-toast";
import { RotateCcw, AlertCircle, Package } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";

interface SaleItem {
  id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  product_id: string;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
}

interface Sale {
  id: string;
  sale_number: string;
  sale_date: string;
  total_amount: number;
  payment_method: string;
  items: SaleItem[];
}

interface ReturnItem {
  sale_item_id: string;
  product_id: string;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  max_quantity: number;
  unit_price: number;
  return_quantity: number;
  selected: boolean;
}

interface SaleReturnDialogProps {
  open: boolean;
  onClose: () => void;
  sale: Sale | null;
  userId: string;
  onComplete: () => void;
}

const returnFormSchema = z.object({
  reason: z.string().max(500, "Reason must be less than 500 characters").optional(),
  notes: z.string().max(1000, "Notes must be less than 1000 characters").optional(),
  processedBy: z.string().max(100, "Name must be less than 100 characters").optional(),
});

export function SaleReturnDialog({
  open,
  onClose,
  sale,
  userId,
  onComplete,
}: SaleReturnDialogProps) {
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [refundMethod, setRefundMethod] = useState("cash");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [processedBy, setProcessedBy] = useState("");
  const [processing, setProcessing] = useState(false);
  const [existingReturns, setExistingReturns] = useState<Map<string, number>>(new Map());
  const { formatPrice } = useCurrency();
  const { toast } = useToast();

  useEffect(() => {
    if (open && sale) {
      fetchExistingReturns();
    }
  }, [open, sale]);

  const fetchExistingReturns = async () => {
    if (!sale) return;

    try {
      // Get all return items for this sale
      const { data: returnData } = await supabase
        .from("sale_return_items")
        .select(`
          sale_item_id,
          quantity,
          sale_returns!inner (sale_id)
        `)
        .eq("user_id", userId);

      const returnsForSale = (returnData || []).filter(
        (r: any) => r.sale_returns?.sale_id === sale.id
      );

      const returnsMap = new Map<string, number>();
      returnsForSale.forEach((r: any) => {
        const current = returnsMap.get(r.sale_item_id) || 0;
        returnsMap.set(r.sale_item_id, current + r.quantity);
      });

      setExistingReturns(returnsMap);

      // Initialize return items
      const items: ReturnItem[] = sale.items.map((item) => {
        const alreadyReturned = returnsMap.get(item.id) || 0;
        const maxQty = item.quantity - alreadyReturned;
        return {
          sale_item_id: item.id,
          product_id: item.product_id,
          variant_id: item.variant_id,
          product_name: item.product_name,
          variant_name: item.variant_name,
          max_quantity: Math.max(0, maxQty),
          unit_price: item.unit_price,
          return_quantity: 0,
          selected: false,
        };
      });

      setReturnItems(items);
    } catch (error) {
      console.error("Error fetching existing returns:", error);
    }
  };

  const toggleItemSelection = (index: number, checked: boolean) => {
    setReturnItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              selected: checked,
              return_quantity: checked ? Math.min(1, item.max_quantity) : 0,
            }
          : item
      )
    );
  };

  const updateReturnQuantity = (index: number, quantity: number) => {
    setReturnItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              return_quantity: Math.min(Math.max(0, quantity), item.max_quantity),
            }
          : item
      )
    );
  };

  const selectedItems = returnItems.filter((item) => item.selected && item.return_quantity > 0);
  const totalRefund = selectedItems.reduce(
    (sum, item) => sum + item.unit_price * item.return_quantity,
    0
  );

  const handleProcessReturn = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: "No Items Selected",
        description: "Please select at least one item to return",
        variant: "destructive",
      });
      return;
    }

    // Validate form
    try {
      returnFormSchema.parse({ reason, notes, processedBy });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setProcessing(true);

    try {
      // Generate return number
      const { data: returnNumberData, error: returnNumberError } = await supabase
        .rpc("generate_return_number");

      if (returnNumberError) throw returnNumberError;

      // Create the sale return record
      const { data: returnRecord, error: returnError } = await supabase
        .from("sale_returns")
        .insert({
          user_id: userId,
          sale_id: sale!.id,
          return_number: returnNumberData,
          total_refund: totalRefund,
          refund_method: refundMethod,
          reason: reason || null,
          notes: notes || null,
          processed_by: processedBy || null,
          status: "completed",
        })
        .select()
        .single();

      if (returnError) throw returnError;

      // Create return items
      const returnItemsData = selectedItems.map((item) => ({
        user_id: userId,
        sale_return_id: returnRecord.id,
        sale_item_id: item.sale_item_id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.return_quantity,
        unit_price: item.unit_price,
        refund_amount: item.unit_price * item.return_quantity,
      }));

      const { error: itemsError } = await supabase
        .from("sale_return_items")
        .insert(returnItemsData);

      if (itemsError) throw itemsError;

      // Create stock movement records for the return
      const stockMovements = selectedItems.map((item) => ({
        user_id: userId,
        product_id: item.product_id,
        variant_id: item.variant_id,
        warehouse_id: sale!.id, // We'll need to get warehouse from sale
        quantity: item.return_quantity,
        transaction_type: "RETURN" as const,
        reference_number: returnNumberData,
        notes: `Return from sale ${sale!.sale_number}`,
      }));

      // Get the warehouse from original sale
      const { data: saleData } = await supabase
        .from("sales")
        .select("warehouse_id")
        .eq("id", sale!.id)
        .single();

      if (saleData?.warehouse_id) {
        const movementsWithWarehouse = stockMovements.map((m) => ({
          ...m,
          warehouse_id: saleData.warehouse_id,
        }));

        await supabase.from("stock_movements").insert(movementsWithWarehouse);
      }

      toast({
        title: "Return Processed",
        description: `Return ${returnNumberData} processed successfully. Refund: ${formatPrice(totalRefund)}`,
      });

      // Reset form
      setReason("");
      setNotes("");
      setProcessedBy("");
      setRefundMethod("cash");
      
      onComplete();
      onClose();
    } catch (error: any) {
      console.error("Error processing return:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process return",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (!sale) return null;

  const allItemsReturned = returnItems.every((item) => item.max_quantity === 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-warning" />
            Process Return / Refund
          </DialogTitle>
          <DialogDescription>
            Sale: {sale.sale_number} • {format(new Date(sale.sale_date), "PPp")}
          </DialogDescription>
        </DialogHeader>

        {allItemsReturned ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-warning mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              All Items Already Returned
            </h3>
            <p className="text-muted-foreground">
              All items from this sale have already been returned.
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4">
                {/* Items Selection */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">
                    Select Items to Return
                  </Label>
                  <div className="space-y-2 rounded-lg border border-divider overflow-hidden">
                    {returnItems.map((item, index) => {
                      const displayName = item.variant_name
                        ? `${item.product_name} - ${item.variant_name}`
                        : item.product_name;
                      const isDisabled = item.max_quantity === 0;

                      return (
                        <div
                          key={item.sale_item_id}
                          className={`p-3 flex items-center gap-3 ${
                            index !== 0 ? "border-t border-divider" : ""
                          } ${isDisabled ? "opacity-50 bg-muted-100" : "bg-surface-100"}`}
                        >
                          <Checkbox
                            checked={item.selected}
                            onCheckedChange={(checked) =>
                              toggleItemSelection(index, !!checked)
                            }
                            disabled={isDisabled}
                          />
                          <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {displayName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatPrice(item.unit_price)} each •{" "}
                              {isDisabled
                                ? "Fully returned"
                                : `Max returnable: ${item.max_quantity}`}
                            </p>
                          </div>
                          {item.selected && !isDisabled && (
                            <div className="flex items-center gap-2">
                              <Label className="text-xs text-muted-foreground">Qty:</Label>
                              <Input
                                type="number"
                                min={1}
                                max={item.max_quantity}
                                value={item.return_quantity}
                                onChange={(e) =>
                                  updateReturnQuantity(index, parseInt(e.target.value) || 0)
                                }
                                className="w-16 h-8 text-center"
                              />
                            </div>
                          )}
                          {item.selected && item.return_quantity > 0 && (
                            <Badge variant="outline" className="ml-2">
                              {formatPrice(item.unit_price * item.return_quantity)}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Return Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="refundMethod">Refund Method</Label>
                    <Select value={refundMethod} onValueChange={setRefundMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="store_credit">Store Credit</SelectItem>
                        <SelectItem value="original_method">Original Payment Method</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="processedBy">Processed By</Label>
                    <Input
                      id="processedBy"
                      placeholder="Staff name"
                      value={processedBy}
                      onChange={(e) => setProcessedBy(e.target.value)}
                      maxLength={100}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Return</Label>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="defective">Defective Product</SelectItem>
                      <SelectItem value="wrong_item">Wrong Item</SelectItem>
                      <SelectItem value="not_as_described">Not As Described</SelectItem>
                      <SelectItem value="changed_mind">Customer Changed Mind</SelectItem>
                      <SelectItem value="damaged">Damaged in Transit</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional notes about the return..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={1000}
                    rows={2}
                  />
                </div>
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="border-t border-divider pt-4 mt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {selectedItems.length} item(s) selected
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Refund</p>
                  <p className="text-2xl font-bold text-warning">{formatPrice(totalRefund)}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleProcessReturn}
                  disabled={processing || selectedItems.length === 0}
                  className="flex-1 bg-warning hover:bg-warning/90 text-warning-foreground"
                >
                  {processing ? "Processing..." : "Process Return"}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}