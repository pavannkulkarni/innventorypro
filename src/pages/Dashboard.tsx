import { DashboardStats } from "@/components/DashboardStats";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingUp } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your inventory management system
        </p>
      </div>

      <DashboardStats />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest inventory updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="font-medium">Wireless Mouse</p>
                  <p className="text-sm text-muted-foreground">Stock added: +50 units</p>
                </div>
                <span className="text-sm text-muted-foreground">2h ago</span>
              </div>
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="font-medium">USB-C Cable</p>
                  <p className="text-sm text-muted-foreground">Stock updated: 8 units</p>
                </div>
                <span className="text-sm text-muted-foreground">5h ago</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Laptop Stand</p>
                  <p className="text-sm text-muted-foreground">Out of stock alert</p>
                </div>
                <span className="text-sm text-muted-foreground">1d ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              Top Products
            </CardTitle>
            <CardDescription>Best performing items</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="font-medium">Monitor 27"</p>
                  <p className="text-sm text-muted-foreground">Electronics</p>
                </div>
                <span className="font-semibold text-success">$8,400</span>
              </div>
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="font-medium">Ergonomic Chair</p>
                  <p className="text-sm text-muted-foreground">Furniture</p>
                </div>
                <span className="font-semibold text-success">$1,250</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Mechanical Keyboard</p>
                  <p className="text-sm text-muted-foreground">Electronics</p>
                </div>
                <span className="font-semibold text-success">$6,750</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
