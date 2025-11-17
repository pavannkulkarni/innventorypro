import { useEffect, useState } from "react";
import { DashboardStats } from "@/components/DashboardStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  created_at: string;
  categories?: { name: string };
  warehouses?: { name: string };
}

export default function Dashboard() {
  const [lowStockItems, setLowStockItems] = useState<Product[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Fetch low stock items
    const { data: lowStock } = await supabase
      .from("products")
      .select(`
        *,
        categories(name),
        warehouses(name)
      `)
      .eq("user_id", session.user.id)
      .lt("quantity", 20)
      .order("quantity", { ascending: true })
      .limit(5);

    // Fetch recently added products
    const { data: recent } = await supabase
      .from("products")
      .select(`
        *,
        categories(name),
        warehouses(name)
      `)
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    setLowStockItems(lowStock || []);
    setRecentProducts(recent || []);
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
                        {item.sku} • {item.warehouses?.name || "No warehouse"}
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
            <CardTitle>Recently Added Products</CardTitle>
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
                        {product.categories?.name || "No category"} • {product.sku}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-medium">{product.quantity} units</p>
                        <p className="text-xs text-muted-foreground">
                          ${product.price?.toFixed(2) || "0.00"}
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
