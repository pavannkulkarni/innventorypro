import { useEffect, useState } from "react";
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
import { z } from "zod";

const movementSchema = z.object({
  product_id: z.string().min(1, "Product is required"),
  variant_id: z.string().optional(),
  warehouse_id: z.string().min(1, "Warehouse is required"),
  transaction_type: z.enum([
    "OPENING_STOCK",
    "PURCHASE",
    "SALE",
    "RETURN",
    "ADJUSTMENT",
    "TRANSFER_IN",
    "TRANSFER_OUT",
  ]),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
  transaction_date: z.string(),
});

interface StockMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movement?: any;
  scannedProduct?: any;
  onSuccess?: () => void;
}

export function StockMovementDialog({
  open,
  onOpenChange,
  movement,
  scannedProduct,
  onSuccess,
}: StockMovementDialogProps) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    product_id: "",
    variant_id: "",
    warehouse_id: "",
    transaction_type: "PURCHASE",
    quantity: 1,
    reference_number: "",
    notes: "",
    transaction_date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (open) {
      fetchOptions();
    }
  }, [open]);

  useEffect(() => {
    if (movement) {
      setFormData({
        product_id: movement.product_id || "",
        variant_id: movement.variant_id || "",
        warehouse_id: movement.warehouse_id || "",
        transaction_type: movement.transaction_type || "PURCHASE",
        quantity: movement.quantity || 1,
        reference_number: movement.reference_number || "",
        notes: movement.notes || "",
        transaction_date: movement.transaction_date
          ? new Date(movement.transaction_date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
      });
    } else if (scannedProduct) {
      setFormData({
        product_id: scannedProduct.id || "",
        variant_id: "",
        warehouse_id: "",
        transaction_type: "PURCHASE",
        quantity: 1,
        reference_number: "",
        notes: "",
        transaction_date: new Date().toISOString().split("T")[0],
      });
    } else {
      setFormData({
        product_id: "",
        variant_id: "",
        warehouse_id: "",
        transaction_type: "PURCHASE",
        quantity: 1,
        reference_number: "",
        notes: "",
        transaction_date: new Date().toISOString().split("T")[0],
      });
    }
  }, [movement, scannedProduct, open]);

  useEffect(() => {
    if (formData.product_id) {
      fetchVariants(formData.product_id);
    } else {
      setVariants([]);
      setFormData(prev => ({ ...prev, variant_id: "" }));
    }
  }, [formData.product_id]);

  const fetchOptions = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const [productsData, warehousesData] = await Promise.all([
      supabase
        .from("products")
        .select("id, name, sku")
        .eq("user_id", session.user.id)
        .order("name"),
      supabase
        .from("warehouses")
        .select("id, name, code")
        .eq("user_id", session.user.id)
        .eq("is_active", true),
    ]);

    setProducts(productsData.data || []);
    setWarehouses(warehousesData.data || []);
  };

  const fetchVariants = async (productId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("product_variants")
      .select("id, name, sku")
      .eq("product_id", productId)
      .eq("user_id", session.user.id)
      .eq("is_active", true);

    setVariants(data || []);
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
      const validatedData = movementSchema.parse({
        ...formData,
        variant_id: formData.variant_id || undefined,
        reference_number: formData.reference_number || undefined,
        notes: formData.notes || undefined,
      });

      const movementData = {
        user_id: session.user.id,
        product_id: validatedData.product_id,
        variant_id: validatedData.variant_id || null,
        warehouse_id: validatedData.warehouse_id,
        transaction_type: validatedData.transaction_type,
        quantity: validatedData.quantity,
        reference_number: validatedData.reference_number || null,
        notes: validatedData.notes || null,
        transaction_date: new Date(validatedData.transaction_date).toISOString(),
      };

      if (movement?.id) {
        const { error } = await supabase
          .from("stock_movements")
          .update(movementData)
          .eq("id", movement.id);

        if (error) throw error;
        toast.success("Stock movement updated successfully");
      } else {
        const { error } = await supabase
          .from("stock_movements")
          .insert([movementData]);

        if (error) throw error;
        toast.success("Stock movement recorded successfully");
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Failed to save stock movement");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {movement ? "Edit Stock Movement" : "Record Stock Movement"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product">Product *</Label>
                <Select
                  value={formData.product_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, product_id: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
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

              <div className="space-y-2">
                <Label htmlFor="variant">Variant (Optional)</Label>
                <Select
                  value={formData.variant_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, variant_id: value })
                  }
                  disabled={!formData.product_id || variants.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select variant" />
                  </SelectTrigger>
                  <SelectContent>
                    {variants.map((variant) => (
                      <SelectItem key={variant.id} value={variant.id}>
                        {variant.name} {variant.sku && `(${variant.sku})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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

              <div className="space-y-2">
                <Label htmlFor="transaction_type">Transaction Type *</Label>
                <Select
                  value={formData.transaction_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, transaction_type: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPENING_STOCK">Opening Stock</SelectItem>
                    <SelectItem value="PURCHASE">Purchase</SelectItem>
                    <SelectItem value="SALE">Sale</SelectItem>
                    <SelectItem value="RETURN">Return</SelectItem>
                    <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                    <SelectItem value="TRANSFER_IN">Transfer In</SelectItem>
                    <SelectItem value="TRANSFER_OUT">Transfer Out</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantity: parseInt(e.target.value) || 1,
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transaction_date">Transaction Date *</Label>
                <Input
                  id="transaction_date"
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) =>
                    setFormData({ ...formData, transaction_date: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference_number">Reference Number</Label>
              <Input
                id="reference_number"
                value={formData.reference_number}
                onChange={(e) =>
                  setFormData({ ...formData, reference_number: e.target.value })
                }
                placeholder="PO#, Invoice#, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Additional information..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : movement ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
