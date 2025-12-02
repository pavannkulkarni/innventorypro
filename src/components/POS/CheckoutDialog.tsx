import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { CreditCard, Banknote, Smartphone, Plus } from "lucide-react";
import { CustomerDialog } from "@/components/CustomerDialog";

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
  const [customerId, setCustomerId] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [cashierName, setCashierName] = useState("");
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && userId) {
      fetchCustomers();
    }
  }, [open, userId]);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxAmount = (subtotal * tax) / 100;
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal + taxAmount - discountAmount;

  const handleCheckout = async () => {
    if (paymentMethod === "credit" && !customerId) {
      toast({
        title: "Customer Required",
        description: "Please select a customer for on-credit transactions",
        variant: "destructive",
      });
      return;
    }

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
          customer_id: customerId || null,
          subtotal,
          tax: taxAmount,
          discount: discountAmount,
          total_amount: total,
          payment_method: paymentMethod,
          payment_status: paymentMethod === "credit" ? "pending" : "completed",
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

      // Update customer credit balance if on-credit
      if (paymentMethod === "credit" && customerId) {
        const { data: customer } = await supabase
          .from("customers")
          .select("credit_balance")
          .eq("id", customerId)
          .single();
        
        if (customer) {
          await supabase
            .from("customers")
            .update({ credit_balance: (customer.credit_balance || 0) + total })
            .eq("id", customerId);
        }
      }

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
    setCustomerId("");
    setDiscount(0);
    setTax(0);
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Checkout</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 py-4 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* LEFT COLUMN - Order Summary */}
          <div className="space-y-4 pr-4 border-r border-divider">
            <h3 className="font-semibold text-text-primary text-lg">Order Summary</h3>
            <div className="space-y-2">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-start bg-surface-200 rounded-lg p-3">
                  <div className="flex-1">
                    <p className="text-text-primary font-medium">
                      {item.quantity}x {item.name}
                    </p>
                    {item.variant_name && (
                      <p className="text-text-secondary text-sm">
                        {item.variant_name}
                      </p>
                    )}
                  </div>
                  <span className="text-text-primary font-semibold">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN - Payment Details */}
          <div className="space-y-6 pl-4">
            {/* Customer Selection */}
            <div className="space-y-2">
              <Label>Customer (Optional)</Label>
              <div className="flex gap-2">
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Customer</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                        {customer.credit_balance > 0 && (
                          <span className="text-xs text-status-danger ml-2">
                            (Bal: {formatPrice(customer.credit_balance)})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setCustomerDialogOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

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
                  <SelectItem value="credit">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      On-Credit
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {paymentMethod === "credit" && !customerId && (
                <p className="text-xs text-status-danger">
                  Customer required for on-credit transactions
                </p>
              )}
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

            <Separator />

            {/* Total */}
            <div className="space-y-3 bg-surface-200 rounded-lg p-4">
              <div className="flex justify-between text-text-secondary">
                <span>Subtotal:</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              {taxAmount > 0 && (
                <div className="flex justify-between text-text-secondary">
                  <span>Tax ({tax}%):</span>
                  <span className="font-medium">{formatPrice(taxAmount)}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between text-status-success">
                  <span>Discount ({discount}%):</span>
                  <span className="font-medium">-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-xl font-bold text-text-primary">
                <span>Total:</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-divider pt-4">
          <Button variant="outline" onClick={handleClose} disabled={processing}>
            Cancel
          </Button>
          <Button onClick={handleCheckout} disabled={processing}>
            {processing ? "Processing..." : "Complete Sale"}
          </Button>
        </DialogFooter>
      </DialogContent>
      
      <CustomerDialog
        open={customerDialogOpen}
        onClose={() => setCustomerDialogOpen(false)}
        onSuccess={() => {
          fetchCustomers();
          setCustomerDialogOpen(false);
        }}
      />
    </Dialog>
  );
}
