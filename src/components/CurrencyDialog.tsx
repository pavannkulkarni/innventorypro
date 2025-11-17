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

const currencySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  code: z.string().trim().min(1, "Code is required").max(10, "Code must be less than 10 characters"),
  symbol: z.string().trim().min(1, "Symbol is required").max(5, "Symbol must be less than 5 characters"),
  exchange_rate: z.number().min(0.000001, "Exchange rate must be greater than 0"),
});

interface CurrencyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency?: any;
}

export function CurrencyDialog({
  open,
  onOpenChange,
  currency,
}: CurrencyDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    symbol: "",
    exchange_rate: 1.0,
    is_base: false,
    is_active: true,
  });

  useEffect(() => {
    if (currency) {
      setFormData({
        name: currency.name || "",
        code: currency.code || "",
        symbol: currency.symbol || "",
        exchange_rate: currency.exchange_rate || 1.0,
        is_base: currency.is_base ?? false,
        is_active: currency.is_active ?? true,
      });
    } else {
      setFormData({
        name: "",
        code: "",
        symbol: "",
        exchange_rate: 1.0,
        is_base: false,
        is_active: true,
      });
    }
  }, [currency]);

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
      const validatedData = currencySchema.parse(formData);

      const currencyData = {
        name: validatedData.name,
        code: validatedData.code,
        symbol: validatedData.symbol,
        exchange_rate: validatedData.exchange_rate,
        user_id: session.user.id,
        is_base: formData.is_base,
        is_active: formData.is_active,
      };

      if (currency?.id) {
        const { error } = await supabase
          .from("currencies")
          .update(currencyData)
          .eq("id", currency.id);

        if (error) throw error;
        toast.success("Currency updated successfully");
      } else {
        const { error } = await supabase
          .from("currencies")
          .insert([currencyData]);

        if (error) throw error;
        toast.success("Currency added successfully");
      }

      onOpenChange(false);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Failed to save currency");
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
            {currency ? "Edit Currency" : "Add New Currency"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Currency Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="US Dollar"
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
                  placeholder="USD"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="symbol">Symbol *</Label>
                <Input
                  id="symbol"
                  value={formData.symbol}
                  onChange={(e) =>
                    setFormData({ ...formData, symbol: e.target.value })
                  }
                  placeholder="$"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exchange_rate">Exchange Rate *</Label>
                <Input
                  id="exchange_rate"
                  type="number"
                  step="0.000001"
                  min="0.000001"
                  value={formData.exchange_rate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      exchange_rate: parseFloat(e.target.value) || 1.0,
                    })
                  }
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_base"
                checked={formData.is_base}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_base: checked })
                }
              />
              <Label htmlFor="is_base">Base Currency</Label>
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
              {loading ? "Saving..." : currency ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
