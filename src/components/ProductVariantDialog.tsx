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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const variantSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200, "Name must be less than 200 characters"),
  sku: z.string().trim().max(100, "SKU must be less than 100 characters").optional(),
  barcode: z.string().trim().max(100, "Barcode must be less than 100 characters").optional(),
  quantity: z.number().int().min(0, "Quantity must be 0 or greater"),
  price: z.number().min(0, "Price must be 0 or greater").optional(),
  cost: z.number().min(0, "Cost must be 0 or greater").optional(),
  attributes: z.record(z.string(), z.string()).optional(),
});

interface ProductVariantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  variant?: any;
  onSuccess?: () => void;
}

export function ProductVariantDialog({
  open,
  onOpenChange,
  productId,
  variant,
  onSuccess,
}: ProductVariantDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    barcode: "",
    quantity: 0,
    price: "",
    cost: "",
    reorder_level: "",
    is_active: true,
    attributes: {} as Record<string, string>,
  });
  const [attributeKey, setAttributeKey] = useState("");
  const [attributeValue, setAttributeValue] = useState("");

  useEffect(() => {
    if (variant) {
      setFormData({
        name: variant.name || "",
        sku: variant.sku || "",
        barcode: variant.barcode || "",
        quantity: variant.quantity || 0,
        price: variant.price !== null && variant.price !== undefined ? variant.price : "",
        cost: variant.cost !== null && variant.cost !== undefined ? variant.cost : "",
        reorder_level: variant.reorder_level !== null && variant.reorder_level !== undefined ? variant.reorder_level : "",
        is_active: variant.is_active ?? true,
        attributes: variant.attributes || {},
      });
    } else {
      setFormData({
        name: "",
        sku: "",
        barcode: "",
        quantity: 0,
        price: "",
        cost: "",
        reorder_level: "",
        is_active: true,
        attributes: {},
      });
    }
  }, [variant, open]);

  const handleAddAttribute = () => {
    if (attributeKey.trim() && attributeValue.trim()) {
      if (attributeKey.length > 50) {
        toast.error("Attribute key must be less than 50 characters");
        return;
      }
      if (attributeValue.length > 100) {
        toast.error("Attribute value must be less than 100 characters");
        return;
      }
      setFormData({
        ...formData,
        attributes: {
          ...formData.attributes,
          [attributeKey.trim()]: attributeValue.trim(),
        },
      });
      setAttributeKey("");
      setAttributeValue("");
    }
  };

  const handleRemoveAttribute = (key: string) => {
    const newAttributes = { ...formData.attributes };
    delete newAttributes[key];
    setFormData({ ...formData, attributes: newAttributes });
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
      const validatedData = variantSchema.parse({
        name: formData.name,
        sku: formData.sku || undefined,
        barcode: formData.barcode || undefined,
        quantity: formData.quantity,
        price: formData.price !== "" ? Number(formData.price) : undefined,
        cost: formData.cost !== "" ? Number(formData.cost) : undefined,
        attributes: Object.keys(formData.attributes).length > 0 ? formData.attributes : undefined,
      });

      const variantData = {
        product_id: productId,
        user_id: session.user.id,
        name: validatedData.name,
        sku: validatedData.sku || null,
        barcode: validatedData.barcode || null,
        quantity: validatedData.quantity,
        price: validatedData.price || null,
        cost: validatedData.cost || null,
        attributes: validatedData.attributes || null,
        is_active: formData.is_active,
      };

      if (variant?.id) {
        const { error } = await supabase
          .from("product_variants")
          .update(variantData)
          .eq("id", variant.id);

        if (error) throw error;
        toast.success("Variant updated successfully");
      } else {
        const { error } = await supabase
          .from("product_variants")
          .insert([variantData]);

        if (error) throw error;
        toast.success("Variant added successfully");
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Failed to save variant");
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
            {variant ? "Edit Variant" : "Add New Variant"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="variant-name">Variant Name *</Label>
              <Input
                id="variant-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Large - Red"
                required
                maxLength={200}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="variant-sku">SKU</Label>
                <Input
                  id="variant-sku"
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="variant-barcode">Barcode</Label>
                <Input
                  id="variant-barcode"
                  value={formData.barcode}
                  onChange={(e) =>
                    setFormData({ ...formData, barcode: e.target.value })
                  }
                  maxLength={100}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="variant-quantity">Quantity *</Label>
                <Input
                  id="variant-quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="variant-price">Price</Label>
                <Input
                  id="variant-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="variant-cost">Cost</Label>
                <Input
                  id="variant-cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost}
                  onChange={(e) =>
                    setFormData({ ...formData, cost: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="variant-reorder-level">Reorder Level</Label>
                <Input
                  id="variant-reorder-level"
                  type="number"
                  min="0"
                  value={formData.reorder_level}
                  onChange={(e) =>
                    setFormData({ ...formData, reorder_level: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Attributes (e.g., Size, Color)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Attribute (e.g., Size)"
                  value={attributeKey}
                  onChange={(e) => setAttributeKey(e.target.value)}
                  maxLength={50}
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="Value (e.g., Large)"
                    value={attributeValue}
                    onChange={(e) => setAttributeValue(e.target.value)}
                    maxLength={100}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAddAttribute}
                  >
                    Add
                  </Button>
                </div>
              </div>
              {Object.keys(formData.attributes).length > 0 && (
                <div className="mt-2 space-y-1">
                  {Object.entries(formData.attributes).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <span className="text-sm">
                        <strong>{key}:</strong> {value}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAttribute(key)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="variant-active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
              <Label htmlFor="variant-active">Active</Label>
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
              {loading ? "Saving..." : variant ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
