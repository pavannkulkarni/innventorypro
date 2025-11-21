import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Banknote, Smartphone } from "lucide-react";

interface CartItem {
  id: string;
  product_id: string;
  variant_id?: string;
  name: string;
  variant_name?: string;
  price: number;
  quantity: number;
}

interface CheckoutDialogProps {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  warehouseId: string;
  userId: string;
  onComplete: () => void;
  formatPrice: (price: number) => string;
}

export function CheckoutDialog({
  open,
  onClose,
  cart,
  warehouseId,
  userId,
  onComplete,
  formatPrice,
}: CheckoutDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [notes, setNotes] = useState("");
  const [cashierName, setCashierName] = useState("");
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxAmount = (subtotal * tax) / 100;
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal + taxAmount - discountAmount;

  const handleCheckout = async () => {
    setProcessing(true);
    try {
      // Generate sale number
      const { data: saleNumberData, error: saleNumberError } = await supabase
        .rpc('generate_sale_number');

      if (saleNumberError) throw saleNumberError;
      const saleNumber = saleNumberData;

      // Create sale record
      const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .insert({
          user_id: userId,
          sale_number: saleNumber,
          warehouse_id: warehouseId,
          subtotal,
          tax: taxAmount,
          discount: discountAmount,
          total_amount: total,
          payment_method: paymentMethod,
          payment_status: "completed",
          notes,
          cashier_name: cashierName,
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items
      const saleItems = cart.map((item) => ({
        user_id: userId,
        sale_id: saleData.id,
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        quantity: item.quantity,
        unit_price: item.price,
        line_total: item.price * item.quantity,
        discount: 0,
      }));

      const { error: itemsError } = await supabase
        .from("sale_items")
        .insert(saleItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Sale Completed",
        description: `Sale ${saleNumber} has been successfully processed. Stock updated automatically.`,
      });

      onComplete();
      resetForm();
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setPaymentMethod("cash");
    setDiscount(0);
    setTax(0);
    setNotes("");
    setCashierName("");
  };

  const handleClose = () => {
    if (!processing) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Checkout</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Order Summary */}
          <div className="space-y-2">
            <h3 className="font-medium text-text-primary">Order Summary</h3>
            <div className="bg-surface-200 rounded-lg p-3 space-y-2 text-sm">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span className="text-text-secondary">
                    {item.quantity}x {item.name}
                    {item.variant_name && ` - ${item.variant_name}`}
                  </span>
                  <span className="text-text-primary">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    Cash
                  </div>
                </SelectItem>
                <SelectItem value="card">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Card
                  </div>
                </SelectItem>
                <SelectItem value="upi">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    UPI
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tax & Discount */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tax (%)</Label>
              <Input
                type="number"
                value={tax}
                onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                step="0.1"
              />
            </div>
            <div className="space-y-2">
              <Label>Discount (%)</Label>
              <Input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                step="0.1"
              />
            </div>
          </div>

          {/* Cashier Name */}
          <div className="space-y-2">
            <Label>Cashier Name (Optional)</Label>
            <Input
              value={cashierName}
              onChange={(e) => setCashierName(e.target.value)}
              placeholder="Enter cashier name"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes..."
              rows={2}
            />
          </div>

          <Separator />

          {/* Total */}
          <div className="space-y-2 bg-surface-200 rounded-lg p-4">
            <div className="flex justify-between text-text-secondary text-sm">
              <span>Subtotal:</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {taxAmount > 0 && (
              <div className="flex justify-between text-text-secondary text-sm">
                <span>Tax ({tax}%):</span>
                <span>{formatPrice(taxAmount)}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex justify-between text-success text-sm">
                <span>Discount ({discount}%):</span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-semibold text-text-primary">
              <span>Total:</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={processing}>
            Cancel
          </Button>
          <Button onClick={handleCheckout} disabled={processing}>
            {processing ? "Processing..." : "Complete Sale"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
