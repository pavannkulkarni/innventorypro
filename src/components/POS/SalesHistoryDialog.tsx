import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/hooks/useCurrency";
import { Search, X, Eye } from "lucide-react";
import { format } from "date-fns";

interface SalesHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
}

export function SalesHistoryDialog({ open, onClose, userId }: SalesHistoryDialogProps) {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { formatPrice } = useCurrency();

  useEffect(() => {
    if (open && userId) {
      fetchSales();
    }
  }, [open, userId]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sales")
        .select(`
          *,
          customers (name),
          sale_items (*)
        `)
        .eq("user_id", userId)
        .order("sale_date", { ascending: false })
        .limit(100);

      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error("Error fetching sales:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = sales.filter(sale =>
    sale.sale_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-success/20 text-success";
      case "pending": return "bg-warning/20 text-warning";
      case "failed": return "bg-danger/20 text-danger";
      default: return "bg-neutral-badge/20 text-neutral-badge";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Sales History
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
            <Input
              placeholder="Search by sale number or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[500px]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-text-secondary">Loading sales...</p>
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-text-secondary">No sales found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="p-4 rounded-lg bg-surface-100 border border-divider hover:bg-muted-100 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-text-primary">{sale.sale_number}</p>
                        <p className="text-sm text-text-secondary">
                          {format(new Date(sale.sale_date), "PPp")}
                        </p>
                        {sale.customers && (
                          <p className="text-sm text-text-secondary mt-1">
                            Customer: {sale.customers.name}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-accent-primary">
                          {formatPrice(sale.total_amount)}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className={getPaymentStatusColor(sale.payment_status)}>
                            {sale.payment_status}
                          </Badge>
                          <Badge variant="outline">
                            {sale.payment_method}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    {sale.sale_items && sale.sale_items.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-divider">
                        <p className="text-xs text-text-secondary mb-2">Items:</p>
                        <div className="space-y-1">
                          {sale.sale_items.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-text-secondary">
                                {item.quantity}x {item.products?.name}
                              </span>
                              <span className="text-text-primary">
                                {formatPrice(item.line_total)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {sale.notes && (
                      <p className="text-sm text-text-secondary mt-2 italic">
                        Note: {sale.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
