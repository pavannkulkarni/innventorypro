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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const warehouseSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  code: z.string().trim().min(1, "Code is required").max(50, "Code must be less than 50 characters"),
  location: z.string().trim().max(200, "Location must be less than 200 characters").optional(),
  description: z.string().trim().max(500, "Description must be less than 500 characters").optional(),
});

interface WarehouseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse?: any;
}

export function WarehouseDialog({
  open,
  onOpenChange,
  warehouse,
}: WarehouseDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    location: "",
    description: "",
    is_active: true,
  });

  useEffect(() => {
    if (warehouse) {
      setFormData({
        name: warehouse.name || "",
        code: warehouse.code || "",
        location: warehouse.location || "",
        description: warehouse.description || "",
        is_active: warehouse.is_active ?? true,
      });
    } else {
      setFormData({
        name: "",
        code: "",
        location: "",
        description: "",
        is_active: true,
      });
    }
  }, [warehouse]);

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
      const validatedData = warehouseSchema.parse(formData);

      const warehouseData = {
        name: validatedData.name,
        code: validatedData.code,
        location: validatedData.location || null,
        description: validatedData.description || null,
        user_id: session.user.id,
        is_active: formData.is_active,
      };

      if (warehouse?.id) {
        const { error } = await supabase
          .from("warehouses")
          .update(warehouseData)
          .eq("id", warehouse.id);

        if (error) throw error;
        toast.success("Warehouse updated successfully");
      } else {
        const { error } = await supabase
          .from("warehouses")
          .insert([warehouseData]);

        if (error) throw error;
        toast.success("Warehouse added successfully");
      }

      onOpenChange(false);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Failed to save warehouse");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {warehouse ? "Edit Warehouse" : "Add New Warehouse"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Warehouse Name *</Label>
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
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />
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

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
              <Label htmlFor="is_active">Active</Label>
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
              {loading ? "Saving..." : warehouse ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
