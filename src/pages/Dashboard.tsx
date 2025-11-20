import { useEffect, useState } from "react";
import { DashboardStats } from "@/components/DashboardStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/hooks/useCurrency";

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

export default function Dashboard() {
  const { formatPrice } = useCurrency();
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [recentProducts, setRecentProducts] = useState<InventoryItem[]>([]);

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
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your inventory overview
        </p>
      </div>

      <DashboardStats />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No low stock items</p>
              ) : (
                lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b border-divider pb-3 last:border-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.sku} • {item.warehouse}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={item.quantity === 0 ? "danger" : "warning"}>
                        {item.quantity} units
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Stock Movements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No products yet</p>
              ) : (
                recentProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between border-b border-divider pb-3 last:border-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.warehouse} • {product.sku}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
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
