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
      const productData = {
        ...formData,
        user_id: session.user.id,
        category_id: formData.category_id || null,
        supplier_id: formData.supplier_id || null,
        warehouse_id: formData.warehouse_id || null,
        currency_id: formData.currency_id || null,
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
      toast.error(error.message || "Failed to save product");
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantity: parseInt(e.target.value) || 0,
                    })
                  }
                  required
                />
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
            </div>

            <div className="grid grid-cols-2 gap-4">
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
