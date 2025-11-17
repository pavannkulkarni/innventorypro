import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertCircle, TrendingUp, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
}

function StatCard({ title, value, icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className="text-xs text-muted-foreground mt-1">{trend}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardStats() {
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

    // Fetch total products
    const { count: productsCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("user_id", session.user.id);

    // Fetch low stock items (quantity < 20)
    const { count: lowStockCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("user_id", session.user.id)
      .lt("quantity", 20);

    // Fetch total categories
    const { count: categoriesCount } = await supabase
      .from("categories")
      .select("*", { count: "exact", head: true })
      .eq("user_id", session.user.id);

    // Fetch inventory value
    const { data: products } = await supabase
      .from("products")
      .select("quantity, price")
      .eq("user_id", session.user.id);

    const totalValue = products?.reduce(
      (sum, product) => sum + (product.quantity * (product.price || 0)),
      0
    ) || 0;

    setStats({
      totalProducts: productsCount || 0,
      lowStockItems: lowStockCount || 0,
      totalCategories: categoriesCount || 0,
      inventoryValue: totalValue,
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Products"
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
        title="Total Categories"
        value={stats.totalCategories}
        icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
      />
      <StatCard
        title="Inventory Value"
        value={`$${stats.inventoryValue.toFixed(2)}`}
        icon={<DollarSign className="h-4 w-4 text-success" />}
      />
    </div>
  );
}
