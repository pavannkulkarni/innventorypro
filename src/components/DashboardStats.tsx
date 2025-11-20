import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertCircle, TrendingUp, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/hooks/useCurrency";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
}

function StatCard({ title, value, icon, trend }: StatCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium truncate">{title}</CardTitle>
        <div className="flex-shrink-0">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-xl md:text-2xl font-bold break-words">{value}</div>
        {trend && (
          <p className="text-xs text-muted-foreground mt-1 truncate">{trend}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardStats() {
  const { formatPrice } = useCurrency();
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockItems: 0,
    totalCategories: 0,
    inventoryValue: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
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
        quantity
      `)
      .eq("user_id", session.user.id);

    // Calculate inventory per product/variant/warehouse
    const inventoryMap = new Map<string, { quantity: number; cost: number; reorderLevel: number }>();

    movements?.forEach((movement: any) => {
      const key = `${movement.product_id}-${movement.variant_id || "null"}-${movement.warehouse_id}`;
      
      if (!inventoryMap.has(key)) {
        const product = products?.find((p) => p.id === movement.product_id);
        const variant = variants?.find((v) => v.id === movement.variant_id);
        
        inventoryMap.set(key, {
          quantity: 0,
          cost: variant?.cost || product?.cost || 0,
          reorderLevel: variant?.reorder_level || product?.reorder_level || 0,
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

    // Calculate stats from real inventory
    const inventoryItems = Array.from(inventoryMap.values());
    const lowStockCount = inventoryItems.filter(item => 
      item.quantity > 0 && item.quantity <= item.reorderLevel
    ).length;
    
    const outOfStockCount = inventoryItems.filter(item => item.quantity === 0).length;
    
    const totalValue = inventoryItems.reduce(
      (sum, item) => sum + (item.quantity * item.cost),
      0
    );

    // Fetch total warehouses
    const { count: warehousesCount } = await supabase
      .from("warehouses")
      .select("*", { count: "exact", head: true })
      .eq("user_id", session.user.id)
      .eq("is_active", true);

    setStats({
      totalProducts: inventoryItems.length,
      lowStockItems: lowStockCount + outOfStockCount,
      totalCategories: warehousesCount || 0,
      inventoryValue: totalValue,
    });
  };

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Stock Items"
        value={stats.totalProducts}
        icon={<Package className="h-4 w-4 text-muted-foreground" />}
      />
      <StatCard
        title="Low Stock Items"
        value={stats.lowStockItems}
        icon={<AlertCircle className="h-4 w-4 text-warning" />}
        trend="Needs attention"
      />
      <StatCard
        title="Active Warehouses"
        value={stats.totalCategories}
        icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
      />
      <StatCard
        title="Inventory Value"
        value={formatPrice(stats.inventoryValue)}
        icon={<DollarSign className="h-4 w-4 text-success" />}
      />
    </div>
  );
}
