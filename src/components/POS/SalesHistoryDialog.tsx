import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/hooks/useCurrency";
import { Search, X, ChevronDown, ChevronRight } from "lucide-react";
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
  const [expandedSales, setExpandedSales] = useState<Set<string>>(new Set());
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
          sale_items (
            *,
            products (name),
            product_variants (name)
          )
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

  const toggleSaleExpansion = (saleId: string) => {
    setExpandedSales(prev => {
      const newSet = new Set(prev);
      if (newSet.has(saleId)) {
        newSet.delete(saleId);
      } else {
        newSet.add(saleId);
      }
      return newSet;
    });
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
                {filteredSales.map((sale) => {
                  const isExpanded = expandedSales.has(sale.id);
                  return (
                    <div
                      key={sale.id}
                      className="rounded-lg bg-surface-100 border border-divider overflow-hidden"
                    >
                      <div className="p-4 flex items-center justify-between hover:bg-muted-100 transition-colors">
                        <button
                          onClick={() => toggleSaleExpansion(sale.id)}
                          className="flex items-center gap-3 flex-1 text-left"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-accent-primary flex-shrink-0" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-text-secondary flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                              <p className="font-semibold text-text-primary">{sale.sale_number}</p>
                              <p className="text-sm text-text-secondary">
                                {format(new Date(sale.sale_date), "PPp")}
                              </p>
                              {sale.customers && (
                                <p className="text-sm text-text-secondary">
                                  {sale.customers.name}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                        <div className="flex items-center gap-3 ml-4">
                          <p className="text-xl font-bold text-accent-primary whitespace-nowrap">
                            {formatPrice(sale.total_amount)}
                          </p>
                          <div className="flex gap-2">
                            <Badge variant="outline" className={getPaymentStatusColor(sale.payment_status)}>
                              {sale.payment_status}
                            </Badge>
                            <Badge variant="outline">
                              {sale.payment_method}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      {isExpanded && sale.sale_items && sale.sale_items.length > 0 && (
                        <div className="px-4 pb-4 pt-2 border-t border-divider bg-bg-200">
                          <p className="text-xs text-text-secondary mb-2 font-medium">Items Sold:</p>
                          <div className="space-y-2">
                            {sale.sale_items.map((item: any, idx: number) => {
                              const productName = item.variant_id 
                                ? `${item.products?.name} - ${item.product_variants?.name}`
                                : item.products?.name;
                              return (
                                <div key={idx} className="flex justify-between text-sm py-1">
                                  <span className="text-text-secondary">
                                    {item.quantity}x {productName}
                                  </span>
                                  <span className="text-text-primary font-medium">
                                    {formatPrice(item.line_total)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
