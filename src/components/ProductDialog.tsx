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

const productSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200, "Name must be less than 200 characters"),
  sku: z.string().trim().max(100, "SKU must be less than 100 characters").optional().or(z.literal("")),
  barcode: z.string().trim().max(100, "Barcode must be less than 100 characters").optional().or(z.literal("")),
  description: z.string().trim().max(1000, "Description must be less than 1000 characters").optional().or(z.literal("")),
  quantity: z.number().int("Quantity must be a whole number").min(0, "Quantity cannot be negative"),
  price: z.number().min(0, "Price cannot be negative").optional(),
  cost: z.number().min(0, "Cost cannot be negative").optional(),
  reorder_level: z.number().int("Reorder level must be a whole number").min(0, "Reorder level cannot be negative"),
});

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: any;
}

interface SelectOption {
  id: string;
  name: string;
  code?: string;
  symbol?: string;
}

export function ProductDialog({
  open,
  onOpenChange,
  product,
}: ProductDialogProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<SelectOption[]>([]);
  const [suppliers, setSuppliers] = useState<SelectOption[]>([]);
  const [warehouses, setWarehouses] = useState<SelectOption[]>([]);
  const [currencies, setCurrencies] = useState<SelectOption[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    barcode: "",
    category_id: "",
    supplier_id: "",
    warehouse_id: "",
    currency_id: "",
    quantity: 0,
    price: 0,
    cost: 0,
    reorder_level: 0,
  });

  useEffect(() => {
    if (open) {
      fetchOptions();
    }
  }, [open]);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        sku: product.sku || "",
        barcode: product.barcode || "",
        category_id: product.category_id || "",
        supplier_id: product.supplier_id || "",
        warehouse_id: product.warehouse_id || "",
        currency_id: product.currency_id || "",
        quantity: product.quantity || 0,
        price: product.price || 0,
        cost: product.cost || 0,
        reorder_level: product.reorder_level || 0,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        sku: "",
        barcode: "",
        category_id: "",
        supplier_id: "",
        warehouse_id: "",
        currency_id: "",
        quantity: 0,
        price: 0,
        cost: 0,
        reorder_level: 0,
      });
    }
  }, [product]);

  const fetchOptions = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const [categoriesData, suppliersData, warehousesData, currenciesData] =
      await Promise.all([
        supabase.from("categories").select("id, name, code").eq("user_id", session.user.id).eq("is_active", true),
        supabase.from("suppliers").select("id, name, code").eq("user_id", session.user.id).eq("is_active", true),
        supabase.from("warehouses").select("id, name, code").eq("user_id", session.user.id).eq("is_active", true),
        supabase.from("currencies").select("id, name, code, symbol").eq("user_id", session.user.id).eq("is_active", true),
      ]);

    setCategories(categoriesData.data || []);
    setSuppliers(suppliersData.data || []);
    setWarehouses(warehousesData.data || []);
    setCurrencies(currenciesData.data || []);
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
      // Validate form data
      const validatedData = productSchema.parse({
        name: formData.name,
        sku: formData.sku || "",
        barcode: formData.barcode || "",
        description: formData.description || "",
        quantity: Number(formData.quantity),
        price: formData.price ? Number(formData.price) : undefined,
        cost: formData.cost ? Number(formData.cost) : undefined,
        reorder_level: Number(formData.reorder_level),
      });

      const productData = {
        name: validatedData.name,
        description: validatedData.description || null,
        sku: validatedData.sku || null,
        barcode: validatedData.barcode || null,
        category_id: formData.category_id || null,
        supplier_id: formData.supplier_id || null,
        warehouse_id: formData.warehouse_id || null,
        currency_id: formData.currency_id || null,
        quantity: validatedData.quantity,
        price: validatedData.price || null,
        cost: validatedData.cost || null,
        reorder_level: validatedData.reorder_level,
        user_id: session.user.id,
      };

      if (product?.id) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", product.id);

        if (error) throw error;
        toast.success("Product updated successfully");
      } else {
        const { error } = await supabase
          .from("products")
          .insert([productData]);

        if (error) throw error;
        toast.success("Product added successfully");
      }

      onOpenChange(false);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(firstError.message);
      } else {
        toast.error(error.message || "Failed to save product");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? "Edit Product" : "Add New Product"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) =>
                    setFormData({ ...formData, barcode: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Select
                  value={formData.supplier_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, supplier_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((sup) => (
                      <SelectItem key={sup.id} value={sup.id}>
                        {sup.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="warehouse">Warehouse</Label>
                <Select
                  value={formData.warehouse_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, warehouse_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((wh) => (
                      <SelectItem key={wh.id} value={wh.id}>
                        {wh.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, currency_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((cur) => (
                    <SelectItem key={cur.id} value={cur.id}>
                      {cur.symbol} - {cur.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Cost</Label>
                <Input
                  id="cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cost: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reorder_level">Reorder Level</Label>
                <Input
                  id="reorder_level"
                  type="number"
                  min="0"
                  value={formData.reorder_level}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reorder_level: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
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
              {loading ? "Saving..." : product ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
