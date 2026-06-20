import { useState } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface BulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: Set<string>;
  itemType: "products" | "variants";
  onSuccess?: () => void;
}

type UpdateMode = "set" | "increase" | "decrease";

export function BulkEditDialog({
  open,
  onOpenChange,
  selectedIds,
  itemType,
  onSuccess,
}: BulkEditDialogProps) {
  const [loading, setLoading] = useState(false);
  const [field, setField] = useState<"price" | "cost" | "quantity">("price");
  const [mode, setMode] = useState<UpdateMode>("set");
  const [value, setValue] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!value || selectedIds.size === 0) {
      toast.error("Please enter a value");
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      toast.error("Please enter a valid positive number");
      return;
    }

    setLoading(true);

    try {
      const tableName = itemType === "products" ? "products" : "product_variants";
      const ids = Array.from(selectedIds);

      // For each selected item, calculate the new value based on mode
      const updates = await Promise.all(
        ids.map(async (id) => {
          // Fetch current value if needed for increase/decrease
          if (mode !== "set") {
            const { data } = await supabase
              .from(tableName)
              .select(field)
              .eq("id", id)
              .single();

            if (!data) return null;

            const currentValue = data[field] || 0;
            let newValue: number;

            if (mode === "increase") {
              newValue = currentValue + numValue;
            } else {
              newValue = Math.max(0, currentValue - numValue);
            }

            return { id, value: newValue };
          }

          return { id, value: numValue };
        })
      );

      // Perform bulk update
      for (const update of updates) {
        if (!update) continue;

        const { error } = await (supabase as any)
          .from(tableName)
          .update({ [field]: update.value })
          .eq("id", update.id);

        if (error) throw error;
      }

      toast.success(
        `Successfully updated ${selectedIds.size} ${itemType === "products" ? "product(s)" : "variant(s)"}`
      );
      
      setValue("");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to update items");
    } finally {
      setLoading(false);
    }
  };

  const getModeLabel = () => {
    switch (mode) {
      case "set":
        return "Set to";
      case "increase":
        return "Increase by";
      case "decrease":
        return "Decrease by";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Edit {itemType === "products" ? "Products" : "Variants"}</DialogTitle>
          <DialogDescription>
            Update {selectedIds.size} selected {itemType === "products" ? "product(s)" : "variant(s)"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label>Field to Update</Label>
              <RadioGroup value={field} onValueChange={(value: any) => setField(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="price" id="price" />
                  <Label htmlFor="price" className="font-normal cursor-pointer">
                    Price
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cost" id="cost" />
                  <Label htmlFor="cost" className="font-normal cursor-pointer">
                    Cost
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="quantity" id="quantity" />
                  <Label htmlFor="quantity" className="font-normal cursor-pointer">
                    Quantity
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Update Mode</Label>
              <RadioGroup value={mode} onValueChange={(value: any) => setMode(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="set" id="set" />
                  <Label htmlFor="set" className="font-normal cursor-pointer">
                    Set to specific value
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="increase" id="increase" />
                  <Label htmlFor="increase" className="font-normal cursor-pointer">
                    Increase by amount
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="decrease" id="decrease" />
                  <Label htmlFor="decrease" className="font-normal cursor-pointer">
                    Decrease by amount
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">{getModeLabel()}</Label>
              <Input
                id="value"
                type="number"
                step={field === "quantity" ? "1" : "0.01"}
                min="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={`Enter ${field} ${mode === "set" ? "value" : "amount"}`}
                required
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
              {loading ? "Updating..." : `Update ${selectedIds.size} Item(s)`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
