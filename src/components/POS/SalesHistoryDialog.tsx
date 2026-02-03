import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/hooks/useCurrency";
import { Search, X, ChevronDown, ChevronRight, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { SaleReturnDialog } from "./SaleReturnDialog";

interface SalesHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
}

interface SaleItem {
  id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  product_id: string;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
}

interface Sale {
  id: string;
  sale_number: string;
  sale_date: string;
  total_amount: number;
  payment_status: string;
  payment_method: string;
  customer_name: string | null;
  items: SaleItem[];
}

export function SalesHistoryDialog({ open, onClose, userId }: SalesHistoryDialogProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedSales, setExpandedSales] = useState<Set<string>>(new Set());
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedSaleForReturn, setSelectedSaleForReturn] = useState<Sale | null>(null);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    if (open && userId) {
      fetchSales();
    }
  }, [open, userId]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      // Fetch sales with customer info
      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select(`
          id,
          sale_number,
          sale_date,
          total_amount,
          payment_status,
          payment_method,
          customers (name)
        `)
        .eq("user_id", userId)
        .order("sale_date", { ascending: false })
        .limit(100);

      if (salesError) throw salesError;

      if (!salesData || salesData.length === 0) {
        setSales([]);
        setLoading(false);
        return;
      }

      // Fetch all sale items for these sales
      const saleIds = salesData.map(s => s.id);
      const { data: itemsData, error: itemsError } = await supabase
        .from("sale_items")
        .select("id, sale_id, product_id, variant_id, quantity, unit_price, line_total")
        .in("sale_id", saleIds);

      if (itemsError) throw itemsError;

      // Fetch all products for these items
      const productIds = [...new Set((itemsData || []).map(i => i.product_id))];
      const variantIds = [...new Set((itemsData || []).filter(i => i.variant_id).map(i => i.variant_id))];

      const [productsResult, variantsResult] = await Promise.all([
        productIds.length > 0 
          ? supabase.from("products").select("id, name").in("id", productIds)
          : { data: [], error: null },
        variantIds.length > 0 
          ? supabase.from("product_variants").select("id, name").in("id", variantIds as string[])
          : { data: [], error: null }
      ]);

      const productsMap = new Map((productsResult.data || []).map(p => [p.id, p.name]));
      const variantsMap = new Map((variantsResult.data || []).map(v => [v.id, v.name]));

      // Build sales with items
      const formattedSales: Sale[] = salesData.map((sale: any) => {
        const saleItems = (itemsData || [])
          .filter(item => item.sale_id === sale.id)
          .map(item => ({
            id: item.id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            line_total: item.line_total,
            product_id: item.product_id,
            variant_id: item.variant_id,
            product_name: productsMap.get(item.product_id) || "Unknown Product",
            variant_name: item.variant_id ? variantsMap.get(item.variant_id) || null : null,
          }));

        return {
          id: sale.id,
          sale_number: sale.sale_number,
          sale_date: sale.sale_date,
          total_amount: sale.total_amount,
          payment_status: sale.payment_status,
          payment_method: sale.payment_method,
          customer_name: sale.customers?.name || null,
          items: saleItems,
        };
      });

      setSales(formattedSales);
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
    sale.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
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
                              {sale.customer_name && (
                                <p className="text-sm text-text-secondary">
                                  {sale.customer_name}
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
                      
                      {isExpanded && sale.items && sale.items.length > 0 && (
                        <div className="px-4 pb-4 pt-2 border-t border-divider bg-bg-200">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-text-secondary font-medium">Items Sold:</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSaleForReturn(sale);
                                setReturnDialogOpen(true);
                              }}
                              className="h-7 text-xs gap-1 text-warning hover:text-warning hover:bg-warning/10"
                            >
                              <RotateCcw className="h-3 w-3" />
                              Return / Refund
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {sale.items.map((item) => {
                              const displayName = item.variant_name 
                                ? `${item.product_name} - ${item.variant_name}`
                                : item.product_name;
                              return (
                                <div key={item.id} className="flex justify-between text-sm py-1">
                                  <span className="text-text-secondary">
                                    {item.quantity}x {displayName}
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

      {/* Return Dialog */}
      <SaleReturnDialog
        open={returnDialogOpen}
        onClose={() => {
          setReturnDialogOpen(false);
          setSelectedSaleForReturn(null);
        }}
        sale={selectedSaleForReturn}
        userId={userId}
        onComplete={() => {
          fetchSales();
        }}
      />
    </Dialog>
  );
}