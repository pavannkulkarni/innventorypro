import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCurrency } from "@/hooks/useCurrency";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Search, FileText, TrendingUp, DollarSign, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SalesHistory() {
  const { formatPrice } = useCurrency();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [paymentMethod, setPaymentMethod] = useState<string>("all");

  const { data: sales, isLoading } = useQuery({
    queryKey: ["sales", dateFrom, dateTo, paymentMethod],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let query = supabase
        .from("sales")
        .select(`
          *,
          sale_items (
            id,
            quantity,
            unit_price,
            line_total,
            product_id,
            variant_id
          )
        `)
        .eq("user_id", user.id)
        .order("sale_date", { ascending: false });

      if (dateFrom) {
        query = query.gte("sale_date", dateFrom.toISOString());
      }
      if (dateTo) {
        query = query.lte("sale_date", dateTo.toISOString());
      }
      if (paymentMethod !== "all") {
        query = query.eq("payment_method", paymentMethod);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: dailySummary } = useQuery({
    queryKey: ["sales-summary", dateFrom, dateTo],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let query = supabase
        .from("sales")
        .select("total_amount, sale_date, payment_method")
        .eq("user_id", user.id);

      if (dateFrom) {
        query = query.gte("sale_date", dateFrom.toISOString());
      }
      if (dateTo) {
        query = query.lte("sale_date", dateTo.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      const totalSales = data?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
      const totalTransactions = data?.length || 0;
      const avgTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;

      const paymentBreakdown = data?.reduce((acc, sale) => {
        acc[sale.payment_method] = (acc[sale.payment_method] || 0) + Number(sale.total_amount);
        return acc;
      }, {} as Record<string, number>);

      return {
        totalSales,
        totalTransactions,
        avgTransaction,
        paymentBreakdown,
      };
    },
  });

  const filteredSales = sales?.filter((sale) =>
    sale.sale_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.cashier_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text-primary mb-6">Sales History & Reports</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-surface-100 border-divider">
            <CardHeader className="pb-2">
              <CardDescription className="text-text-secondary">Total Sales</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-success" />
                <p className="text-2xl font-semibold text-text-primary">
                  {formatPrice(dailySummary?.totalSales || 0)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-surface-100 border-divider">
            <CardHeader className="pb-2">
              <CardDescription className="text-text-secondary">Transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-accent-primary" />
                <p className="text-2xl font-semibold text-text-primary">
                  {dailySummary?.totalTransactions || 0}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-surface-100 border-divider">
            <CardHeader className="pb-2">
              <CardDescription className="text-text-secondary">Avg Transaction</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-info" />
                <p className="text-2xl font-semibold text-text-primary">
                  {formatPrice(dailySummary?.avgTransaction || 0)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-surface-100 border-divider">
            <CardHeader className="pb-2">
              <CardDescription className="text-text-secondary">Payment Methods</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                {dailySummary?.paymentBreakdown && Object.entries(dailySummary.paymentBreakdown).map(([method, amount]) => (
                  <div key={method} className="flex justify-between">
                    <span className="text-text-secondary capitalize">{method}:</span>
                    <span className="text-text-primary font-medium">{formatPrice(amount)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-surface-100 border-divider">
          <CardHeader>
            <CardTitle className="text-text-primary">Filter Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-text-secondary" />
                <Input
                  placeholder="Search by sale number or cashier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-surface-200 border-divider text-text-primary"
                />
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal bg-surface-200 border-divider",
                      !dateFrom && "text-text-secondary"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "PPP") : "From date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal bg-surface-200 border-divider",
                      !dateTo && "text-text-secondary"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "PPP") : "To date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} />
                </PopoverContent>
              </Popover>

              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="bg-surface-200 border-divider text-text-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Sales Table */}
        <Card className="bg-surface-100 border-divider">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-text-primary">Sales Transactions</CardTitle>
                <CardDescription className="text-text-secondary">
                  {filteredSales?.length || 0} transactions found
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-divider">
              <Table>
                <TableHeader>
                  <TableRow className="border-divider hover:bg-muted-100">
                    <TableHead className="text-text-secondary">Sale #</TableHead>
                    <TableHead className="text-text-secondary">Date</TableHead>
                    <TableHead className="text-text-secondary">Items</TableHead>
                    <TableHead className="text-text-secondary">Payment</TableHead>
                    <TableHead className="text-text-secondary">Cashier</TableHead>
                    <TableHead className="text-text-secondary text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-text-secondary">
                        Loading sales...
                      </TableCell>
                    </TableRow>
                  ) : filteredSales?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-text-secondary">
                        No sales found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSales?.map((sale) => (
                      <TableRow key={sale.id} className="border-divider hover:bg-muted-100">
                        <TableCell className="font-medium text-text-primary">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-text-secondary" />
                            {sale.sale_number}
                          </div>
                        </TableCell>
                        <TableCell className="text-text-secondary">
                          {format(new Date(sale.sale_date), "PPp")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-text-secondary border-divider">
                            {sale.sale_items?.length || 0} items
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "capitalize border-divider",
                              sale.payment_method === "cash" && "text-success",
                              sale.payment_method === "card" && "text-info",
                              sale.payment_method === "upi" && "text-warning"
                            )}
                          >
                            {sale.payment_method}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-text-secondary">
                          {sale.cashier_name || "-"}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-text-primary">
                          {formatPrice(sale.total_amount)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
