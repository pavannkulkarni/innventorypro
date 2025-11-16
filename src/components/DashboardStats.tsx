import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertCircle, TrendingUp, DollarSign } from "lucide-react";

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
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Products"
        value="1,284"
        icon={<Package className="h-4 w-4 text-muted-foreground" />}
        trend="+12% from last month"
      />
      <StatCard
        title="Low Stock Items"
        value="23"
        icon={<AlertCircle className="h-4 w-4 text-warning" />}
        trend="Needs attention"
      />
      <StatCard
        title="Total Categories"
        value="12"
        icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
      />
      <StatCard
        title="Inventory Value"
        value="$45,231"
        icon={<DollarSign className="h-4 w-4 text-success" />}
        trend="+8% from last month"
      />
    </div>
  );
}
