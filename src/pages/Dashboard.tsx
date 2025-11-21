import { useEffect, useState } from "react";
import { DashboardStats } from "@/components/DashboardStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/hooks/useCurrency";
import { format, isToday } from "date-fns";

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  warehouse: string;
  quantity: number;
  cost?: number;
  price?: number;
  reorderLevel?: number;
  created_at?: string;
}

interface SaleItem {
  id: string;
  product_name: string;
  variant_name?: string;
  warehouse_name: string;
  quantity: number;
  transaction_date: string;
  reference_number?: string;
}

export default function Dashboard() {
  const { formatPrice } = useCurrency();
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [recentProducts, setRecentProducts] = useState<InventoryItem[]>([]);
  const [recentSales, setRecentSales] = useState<SaleItem[]>([]);
  const [todaySales, setTodaySales] = useState<SaleItem[]>([]);
  const [todaySalesTotal, setTodaySalesTotal] = useState({ quantity: 0, count: 0 });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Fetch all products with their cost and reorder level
    const { data: products } = await supabase
      .from("products")
      .select("id, name, sku, cost, reorder_level")
      .eq("user_id", session.user.id);

    // Fetch all variants with their cost and reorder level
    const { data: variants } = await supabase
      .from("product_variants")
      .select("id, product_id, name, sku, cost, reorder_level")
      .eq("user_id", session.user.id);

    // Fetch all stock movements
    const { data: movements } = await supabase
      .from("stock_movements")
      .select(`
        product_id,
        variant_id,
        warehouse_id,
        transaction_type,
        quantity,
        created_at,
        warehouses(name)
      `)
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    // Calculate inventory per product/variant/warehouse
    const inventoryMap = new Map<string, any>();

    movements?.forEach((movement: any) => {
      const key = `${movement.product_id}-${movement.variant_id || "null"}-${movement.warehouse_id}`;
      
      if (!inventoryMap.has(key)) {
        const product = products?.find((p) => p.id === movement.product_id);
        const variant = variants?.find((v) => v.id === movement.variant_id);
        
        inventoryMap.set(key, {
          id: key,
          name: variant?.name || product?.name || "",
          sku: variant?.sku || product?.sku || "",
          warehouse: movement.warehouses?.name || "",
          quantity: 0,
          cost: variant?.cost || product?.cost || 0,
          reorderLevel: variant?.reorder_level || product?.reorder_level || 0,
          lastMovement: movement.created_at,
        });
      }

      const item = inventoryMap.get(key)!;
      const inTypes = ["OPENING_STOCK", "PURCHASE", "RETURN", "TRANSFER_IN"];
      
      if (inTypes.includes(movement.transaction_type)) {
        item.quantity += movement.quantity;
      } else {
        item.quantity -= movement.quantity;
      }
    });

    const allItems = Array.from(inventoryMap.values());
    
    // Get low stock items (quantity <= reorder level or out of stock)
    const lowStock = allItems
      .filter(item => item.quantity <= item.reorderLevel)
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 5);

    // Get recent stock movements (unique products from latest movements)
    const recentMovementsMap = new Map();
    movements?.forEach((movement: any) => {
      const product = products?.find((p) => p.id === movement.product_id);
      const variant = variants?.find((v) => v.id === movement.variant_id);
      const key = movement.product_id + (movement.variant_id || "");
      
      if (!recentMovementsMap.has(key) && recentMovementsMap.size < 5) {
        const invKey = `${movement.product_id}-${movement.variant_id || "null"}-${movement.warehouse_id}`;
        const invItem = inventoryMap.get(invKey);
        
        recentMovementsMap.set(key, {
          id: key,
          name: variant?.name || product?.name || "",
          sku: variant?.sku || product?.sku || "",
          warehouse: movement.warehouses?.name || "",
          quantity: invItem?.quantity || 0,
          price: invItem?.cost || 0,
          created_at: movement.created_at,
        });
      }
    });

    setLowStockItems(lowStock);
    setRecentProducts(Array.from(recentMovementsMap.values()));

    // Fetch sales data
    const { data: salesMovements } = await supabase
      .from("stock_movements")
      .select(`
        id,
        product_id,
        variant_id,
        warehouse_id,
        quantity,
        transaction_date,
        reference_number,
        products(name),
        product_variants(name),
        warehouses(name)
      `)
      .eq("user_id", session.user.id)
      .eq("transaction_type", "SALE")
      .order("transaction_date", { ascending: false })
      .limit(50);

    const formattedSales: SaleItem[] = salesMovements?.map((sale: any) => ({
      id: sale.id,
      product_name: sale.products?.name || "",
      variant_name: sale.product_variants?.name,
      warehouse_name: sale.warehouses?.name || "",
      quantity: sale.quantity,
      transaction_date: sale.transaction_date,
      reference_number: sale.reference_number,
    })) || [];

    setRecentSales(formattedSales.slice(0, 10));

    // Filter today's sales
    const today = formattedSales.filter(sale => isToday(new Date(sale.transaction_date)));
    setTodaySales(today);
    
    const todayTotal = today.reduce((acc, sale) => ({
      quantity: acc.quantity + sale.quantity,
      count: acc.count + 1
    }), { quantity: 0, count: 0 });
    
    setTodaySalesTotal(todayTotal);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Welcome to your inventory overview
        </p>
      </div>

      <DashboardStats />

      {/* Sales Overview Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Today's Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold">{todaySalesTotal.count}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Units Sold</p>
                  <p className="text-2xl font-bold">{todaySalesTotal.quantity}</p>
                </div>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {todaySales.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No sales today yet</p>
                ) : (
                  todaySales.map((sale) => (
                    <div
                      key={sale.id}
                      className="flex items-center justify-between gap-2 border-b border-divider pb-2 last:border-0 last:pb-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {sale.product_name}
                          {sale.variant_name && ` - ${sale.variant_name}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(sale.transaction_date), "HH:mm")} • {sale.warehouse_name}
                        </p>
                      </div>
                      <Badge variant="success" className="flex-shrink-0">
                        {sale.quantity} units
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {recentSales.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sales yet</p>
              ) : (
                recentSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between gap-2 border-b border-divider pb-2 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {sale.product_name}
                        {sale.variant_name && ` - ${sale.variant_name}`}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {format(new Date(sale.transaction_date), "MMM dd, HH:mm")} • {sale.warehouse_name}
                        {sale.reference_number && ` • Ref: ${sale.reference_number}`}
                      </p>
                    </div>
                    <Badge variant="success" className="flex-shrink-0">
                      {sale.quantity} units
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {lowStockItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No low stock items</p>
              ) : (
                lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-divider pb-3 last:border-0 last:pb-0"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.sku} • {item.warehouse}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Badge variant={item.quantity === 0 ? "danger" : "warning"} className="text-xs">
                        {item.quantity} units
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Recent Stock Movements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No products yet</p>
              ) : (
                recentProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-divider pb-3 last:border-0 last:pb-0"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {product.warehouse} • {product.sku}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-medium">{product.quantity} units</p>
                        <p className="text-xs text-muted-foreground">
                          {formatPrice(product.price || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
