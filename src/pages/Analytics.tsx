import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Package, DollarSign, AlertTriangle, Warehouse } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/hooks/useCurrency";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

interface AnalyticsData {
  totalInventoryValue: number;
  totalStockMovements: number;
  stockInValue: number;
  stockOutValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  warehouseCount: number;
  topProducts: Array<{ name: string; value: number; movements: number }>;
  movementsByType: Array<{ type: string; count: number; value: number }>;
}

export default function Analytics() {
  const { formatPrice } = useCurrency();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalInventoryValue: 0,
    totalStockMovements: 0,
    stockInValue: 0,
    stockOutValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    warehouseCount: 0,
    topProducts: [],
    movementsByType: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      // Fetch products, variants, and stock movements
      const { data: products } = await supabase
        .from("products")
        .select("id, name, cost, reorder_level")
        .eq("user_id", session.user.id);

      const { data: variants } = await supabase
        .from("product_variants")
        .select("id, product_id, name, cost, reorder_level")
        .eq("user_id", session.user.id);

      const { data: movements } = await supabase
        .from("stock_movements")
        .select("*")
        .eq("user_id", session.user.id);

      const { count: warehouseCount } = await supabase
        .from("warehouses")
        .select("*", { count: "exact", head: true })
        .eq("user_id", session.user.id)
        .eq("is_active", true);

      // Calculate inventory levels
      const inventoryMap = new Map<string, { quantity: number; cost: number; reorderLevel: number; name: string; movements: number }>();

      movements?.forEach((movement: any) => {
        const key = `${movement.product_id}-${movement.variant_id || "null"}-${movement.warehouse_id}`;
        
        if (!inventoryMap.has(key)) {
          const product = products?.find((p) => p.id === movement.product_id);
          const variant = variants?.find((v) => v.id === movement.variant_id);
          
          inventoryMap.set(key, {
            quantity: 0,
            cost: variant?.cost || product?.cost || 0,
            reorderLevel: variant?.reorder_level || product?.reorder_level || 0,
            name: variant?.name || product?.name || "",
            movements: 0,
          });
        }

        const item = inventoryMap.get(key)!;
        const inTypes = ["OPENING_STOCK", "PURCHASE", "RETURN", "TRANSFER_IN"];
        
        if (inTypes.includes(movement.transaction_type)) {
          item.quantity += movement.quantity;
        } else {
          item.quantity -= movement.quantity;
        }
        item.movements++;
      });

      // Calculate analytics
      const inventoryItems = Array.from(inventoryMap.values());
      const totalInventoryValue = inventoryItems.reduce((sum, item) => sum + (item.quantity * item.cost), 0);
      const lowStockCount = inventoryItems.filter(item => item.quantity > 0 && item.quantity <= item.reorderLevel).length;
      const outOfStockCount = inventoryItems.filter(item => item.quantity === 0).length;

      // Calculate stock in vs stock out
      let stockInValue = 0;
      let stockOutValue = 0;
      const inTypes = ["OPENING_STOCK", "PURCHASE", "RETURN", "TRANSFER_IN"];
      
      movements?.forEach((movement: any) => {
        const product = products?.find((p) => p.id === movement.product_id);
        const variant = variants?.find((v) => v.id === movement.variant_id);
        const cost = variant?.cost || product?.cost || 0;
        
        if (inTypes.includes(movement.transaction_type)) {
          stockInValue += movement.quantity * cost;
        } else {
          stockOutValue += movement.quantity * cost;
        }
      });

      // Top products by movement activity
      const topProducts = inventoryItems
        .sort((a, b) => b.movements - a.movements)
        .slice(0, 5)
        .map(item => ({
          name: item.name,
          value: item.quantity * item.cost,
          movements: item.movements,
        }));

      // Movement breakdown by type
      const movementTypeMap = new Map<string, { count: number; value: number }>();
      movements?.forEach((movement: any) => {
        const product = products?.find((p) => p.id === movement.product_id);
        const variant = variants?.find((v) => v.id === movement.variant_id);
        const cost = variant?.cost || product?.cost || 0;
        
        if (!movementTypeMap.has(movement.transaction_type)) {
          movementTypeMap.set(movement.transaction_type, { count: 0, value: 0 });
        }
        const typeData = movementTypeMap.get(movement.transaction_type)!;
        typeData.count++;
        typeData.value += movement.quantity * cost;
      });

      const movementsByType = Array.from(movementTypeMap.entries()).map(([type, data]) => ({
        type: type.replace(/_/g, " "),
        count: data.count,
        value: data.value,
      }));

      setAnalytics({
        totalInventoryValue,
        totalStockMovements: movements?.length || 0,
        stockInValue,
        stockOutValue,
        lowStockCount,
        outOfStockCount,
        warehouseCount: warehouseCount || 0,
        topProducts,
        movementsByType,
      });
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const chartConfig = {
    value: {
      label: "Value",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig;

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Real-time insights and trends for your inventory
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4 text-primary" />
              Total Inventory Value
            </CardTitle>
            <CardDescription>Current valuation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(analytics.totalInventoryValue)}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {analytics.totalStockMovements} total movements
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-success" />
              Stock Inflow
            </CardTitle>
            <CardDescription>Total received</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(analytics.stockInValue)}</div>
            <p className="text-sm text-success mt-1">
              Purchases, returns, transfers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4 text-danger" />
              Stock Outflow
            </CardTitle>
            <CardDescription>Total dispatched</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(analytics.stockOutValue)}</div>
            <p className="text-sm text-danger mt-1">
              Sales, adjustments, transfers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Stock Alerts
            </CardTitle>
            <CardDescription>Attention needed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.lowStockCount + analytics.outOfStockCount}</div>
            <p className="text-sm text-warning mt-1">
              {analytics.outOfStockCount} out of stock, {analytics.lowStockCount} low
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Movement Activity by Type</CardTitle>
            <CardDescription>Transaction breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.movementsByType.length === 0 ? (
              <p className="text-sm text-muted-foreground">No stock movements recorded yet</p>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px]">
                <BarChart data={analytics.movementsByType}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="type" 
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Active Products</CardTitle>
            <CardDescription>By movement frequency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No product data available</p>
              ) : (
                analytics.topProducts.map((product, index) => {
                  const maxMovements = Math.max(...analytics.topProducts.map(p => p.movements));
                  const percentage = (product.movements / maxMovements) * 100;
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{product.name}</span>
                        <span className="text-muted-foreground">{product.movements} moves</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all" 
                          style={{ width: `${percentage}%` }} 
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Value: {formatPrice(product.value)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            Warehouse Summary
          </CardTitle>
          <CardDescription>Active warehouses overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Active Warehouses</p>
              <p className="text-3xl font-bold">{analytics.warehouseCount}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Net Flow</p>
              <p className="text-3xl font-bold">
                {formatPrice(analytics.stockInValue - analytics.stockOutValue)}
              </p>
              <p className="text-xs text-muted-foreground">
                {analytics.stockInValue > analytics.stockOutValue ? "Positive inflow" : "Negative outflow"}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Avg Movement Value</p>
              <p className="text-3xl font-bold">
                {formatPrice(
                  analytics.totalStockMovements > 0
                    ? (analytics.stockInValue + analytics.stockOutValue) / analytics.totalStockMovements
                    : 0
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
