import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2 } from "lucide-react";
import { z } from "zod";
import { useCurrency } from "@/hooks/useCurrency";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const poSchema = z.object({
  supplier_id: z.string().min(1, "Supplier is required"),
  warehouse_id: z.string().min(1, "Warehouse is required"),
  expected_delivery_date: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    product_id: z.string().min(1, "Product is required"),
    variant_id: z.string().optional(),
    quantity: z.number().int().min(1, "Quantity must be at least 1"),
    unit_price: z.number().min(0, "Price cannot be negative"),
  })).min(1, "At least one item is required"),
});

interface PurchaseOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrder?: any;
  onSuccess?: () => void;
}

interface LineItem {
  id: string;
  product_id: string;
  variant_id: string;
  quantity: string;
  unit_price: string;
}

export function PurchaseOrderDialog({
  open,
  onOpenChange,
  purchaseOrder,
  onSuccess,
}: PurchaseOrderDialogProps) {
  const { formatPrice } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [variants, setVariants] = useState<Record<string, any[]>>({});
  const [formData, setFormData] = useState({
    supplier_id: "",
    warehouse_id: "",
    expected_delivery_date: "",
    notes: "",
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), product_id: "", variant_id: "", quantity: "", unit_price: "" },
  ]);

  useEffect(() => {
    if (open) {
      fetchOptions();
    }
  }, [open]);

  useEffect(() => {
    if (purchaseOrder) {
      setFormData({
        supplier_id: purchaseOrder.supplier_id || "",
        warehouse_id: purchaseOrder.warehouse_id || "",
        expected_delivery_date: purchaseOrder.expected_delivery_date
          ? new Date(purchaseOrder.expected_delivery_date).toISOString().split("T")[0]
          : "",
        notes: purchaseOrder.notes || "",
      });
      fetchPOItems(purchaseOrder.id);
    } else {
      setFormData({
        supplier_id: "",
        warehouse_id: "",
        expected_delivery_date: "",
        notes: "",
      });
      setLineItems([
        { id: crypto.randomUUID(), product_id: "", variant_id: "", quantity: "", unit_price: "" },
      ]);
    }
  }, [purchaseOrder, open]);

  const fetchOptions = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const [suppliersData, warehousesData, productsData] = await Promise.all([
      supabase.from("suppliers").select("id, name, code").eq("user_id", session.user.id).eq("is_active", true),
      supabase.from("warehouses").select("id, name, code").eq("user_id", session.user.id).eq("is_active", true),
      supabase.from("products").select("id, name, sku, cost").eq("user_id", session.user.id),
    ]);

    setSuppliers(suppliersData.data || []);
    setWarehouses(warehousesData.data || []);
    setProducts(productsData.data || []);
  };

  const fetchPOItems = async (poId: string) => {
    const { data } = await supabase
      .from("purchase_order_items")
      .select("*")
      .eq("purchase_order_id", poId);

    if (data && data.length > 0) {
      setLineItems(
        data.map((item) => ({
          id: item.id,
          product_id: item.product_id,
          variant_id: item.variant_id || "",
          quantity: item.quantity.toString(),
          unit_price: item.unit_price.toString(),
        }))
      );
    }
  };

  const fetchVariants = async (productId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("product_variants")
      .select("id, name, sku, cost")
      .eq("product_id", productId)
      .eq("user_id", session.user.id)
      .eq("is_active", true);

    setVariants((prev) => ({ ...prev, [productId]: data || [] }));
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: crypto.randomUUID(), product_id: "", variant_id: "", quantity: "", unit_price: "" },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((item) => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          
          // Auto-populate unit price when product is selected
          if (field === "product_id" && value) {
            const product = products.find((p) => p.id === value);
            if (product && product.cost) {
              updated.unit_price = product.cost.toString();
            }
            fetchVariants(value);
          }
          
          // Auto-populate unit price when variant is selected
          if (field === "variant_id" && value) {
            const productVariants = variants[item.product_id] || [];
            const variant = productVariants.find((v) => v.id === value);
            if (variant && variant.cost) {
              updated.unit_price = variant.cost.toString();
            }
          }
          
          return updated;
        }
        return item;
      })
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
      const items = lineItems.map((item) => ({
        product_id: item.product_id,
        variant_id: item.variant_id || undefined,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
      }));

      const validatedData = poSchema.parse({
        ...formData,
        items,
      });

      if (purchaseOrder?.id) {
        // Update existing PO
        const { error: poError } = await supabase
          .from("purchase_orders")
          .update({
            supplier_id: validatedData.supplier_id,
            warehouse_id: validatedData.warehouse_id,
            expected_delivery_date: validatedData.expected_delivery_date || null,
            notes: validatedData.notes || null,
          })
          .eq("id", purchaseOrder.id);

        if (poError) throw poError;

        // Delete existing items
        await supabase
          .from("purchase_order_items")
          .delete()
          .eq("purchase_order_id", purchaseOrder.id);

        // Insert new items
        const itemsData = validatedData.items.map((item) => ({
          user_id: session.user.id,
          purchase_order_id: purchaseOrder.id,
          product_id: item.product_id,
          variant_id: item.variant_id || null,
          quantity: item.quantity,
          unit_price: item.unit_price,
        }));

        const { error: itemsError } = await supabase
          .from("purchase_order_items")
          .insert(itemsData);

        if (itemsError) throw itemsError;

        toast.success("Purchase order updated successfully");
      } else {
        // Generate PO number
        const { data: poNumber, error: poNumberError } = await supabase
          .rpc("generate_po_number");

        if (poNumberError) throw poNumberError;

        // Create new PO
        const { data: newPO, error: poError } = await supabase
          .from("purchase_orders")
          .insert({
            user_id: session.user.id,
            po_number: poNumber,
            supplier_id: validatedData.supplier_id,
            warehouse_id: validatedData.warehouse_id,
            expected_delivery_date: validatedData.expected_delivery_date || null,
            notes: validatedData.notes || null,
            created_by: session.user.id,
            status: "DRAFT",
          })
          .select()
          .single();

        if (poError) throw poError;

        // Insert line items
        const itemsData = validatedData.items.map((item) => ({
          user_id: session.user.id,
          purchase_order_id: newPO.id,
          product_id: item.product_id,
          variant_id: item.variant_id || null,
          quantity: item.quantity,
          unit_price: item.unit_price,
        }));

        const { error: itemsError } = await supabase
          .from("purchase_order_items")
          .insert(itemsData);

        if (itemsError) throw itemsError;

        toast.success("Purchase order created successfully");
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Failed to save purchase order");
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return lineItems.reduce((total, item) => {
      const quantity = Number(item.quantity) || 0;
      const price = Number(item.unit_price) || 0;
      return total + quantity * price;
    }, 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {purchaseOrder ? "Edit Purchase Order" : "Create Purchase Order"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier *</Label>
                <Select
                  value={formData.supplier_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, supplier_id: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name} ({supplier.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="warehouse">Warehouse *</Label>
                <Select
                  value={formData.warehouse_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, warehouse_id: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} ({warehouse.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected_delivery_date">Expected Delivery Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.expected_delivery_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.expected_delivery_date ? (
                      format(new Date(formData.expected_delivery_date), "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.expected_delivery_date ? new Date(formData.expected_delivery_date) : undefined}
                    onSelect={(date) =>
                      setFormData({ 
                        ...formData, 
                        expected_delivery_date: date ? format(date, "yyyy-MM-dd") : "" 
                      })
                    }
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Line Items *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {lineItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-2 p-3 border rounded-md bg-muted/30"
                  >
                    <div className="col-span-4">
                      <Select
                        value={item.product_id}
                        onValueChange={(value) =>
                          updateLineItem(item.id, "product_id", value)
                        }
                        required
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} {product.sku && `(${product.sku})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-3">
                      <Select
                        value={item.variant_id}
                        onValueChange={(value) =>
                          updateLineItem(item.id, "variant_id", value)
                        }
                        disabled={!item.product_id || !variants[item.product_id]?.length}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Variant (opt.)" />
                        </SelectTrigger>
                        <SelectContent>
                          {(variants[item.product_id] || []).map((variant) => (
                            <SelectItem key={variant.id} value={variant.id}>
                              {variant.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateLineItem(item.id, "quantity", e.target.value)
                        }
                        placeholder="Qty"
                        className="h-9"
                        required
                      />
                    </div>

                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unit_price}
                        onChange={(e) =>
                          updateLineItem(item.id, "unit_price", e.target.value)
                        }
                        placeholder="Price"
                        className="h-9"
                        required
                      />
                    </div>

                    <div className="col-span-1 flex items-center justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLineItem(item.id)}
                        disabled={lineItems.length === 1}
                        className="h-9 w-9"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end text-lg font-semibold">
                Total: {formatPrice(calculateTotal())}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : purchaseOrder ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
