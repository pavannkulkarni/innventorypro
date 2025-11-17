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

const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  code: z.string().trim().min(1, "Code is required").max(50, "Code must be less than 50 characters"),
  description: z.string().trim().max(500, "Description must be less than 500 characters").optional(),
});

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: any;
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
}: CategoryDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    is_active: true,
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || "",
        code: category.code || "",
        description: category.description || "",
        is_active: category.is_active ?? true,
      });
    } else {
      setFormData({
        name: "",
        code: "",
        description: "",
        is_active: true,
      });
    }
  }, [category]);

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
      const validatedData = categorySchema.parse(formData);

      const categoryData = {
        name: validatedData.name,
        code: validatedData.code,
        description: validatedData.description || null,
        user_id: session.user.id,
        is_active: formData.is_active,
      };

      if (category?.id) {
        const { error } = await supabase
          .from("categories")
          .update(categoryData)
          .eq("id", category.id);

        if (error) throw error;
        toast.success("Category updated successfully");
      } else {
        const { error } = await supabase
          .from("categories")
          .insert([categoryData]);

        if (error) throw error;
        toast.success("Category added successfully");
      }

      onOpenChange(false);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Failed to save category");
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
            {category ? "Edit Category" : "Add New Category"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name *</Label>
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
              {loading ? "Saving..." : category ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
