import { 
  LayoutDashboard, 
  Package, 
  BarChart3, 
  Settings, 
  Download,
  Archive,
  TrendingUp,
  Warehouse,
  Users,
  FolderTree,
  DollarSign,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const inventoryItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Product Master", url: "/product-master", icon: Package },
  { title: "Stock Movements", url: "/stock-movements", icon: TrendingUp },
  { title: "Inventory View", url: "/inventory", icon: Archive },
];

const configItems = [
  { title: "Warehouses", url: "/warehouses", icon: Warehouse },
  { title: "Suppliers", url: "/suppliers", icon: Users },
  { title: "Categories", url: "/categories", icon: FolderTree },
  { title: "Currencies", url: "/currencies", icon: DollarSign },
];

const insightsItems = [
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];

const systemItems = [
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Install App", url: "/install", icon: Download },
];

export function AppSidebar() {
  const { open } = useSidebar();

  return (
    <Sidebar className="border-r border-divider bg-surface-200">
      <SidebarHeader className="px-6 py-6 border-b border-divider">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-accent-primary/10 flex items-center justify-center">
            <Package className="h-5 w-5 text-accent-primary" />
          </div>
          {open && (
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Inventory Pro</h2>
              <p className="text-xs text-text-secondary">Manage your stock</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup className="mb-6">
          <SidebarGroupLabel className="px-3 text-xs font-medium text-text-secondary mb-2">
            Inventory
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {inventoryItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-10">
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:bg-muted-100 hover:text-text-primary transition-colors"
                      activeClassName="bg-accent-primary/10 text-accent-primary font-medium hover:bg-accent-primary/15"
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {open && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mb-6">
          <SidebarGroupLabel className="px-3 text-xs font-medium text-text-secondary mb-2">
            Configuration
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {configItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-10">
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:bg-muted-100 hover:text-text-primary transition-colors"
                      activeClassName="bg-accent-primary/10 text-accent-primary font-medium hover:bg-accent-primary/15"
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {open && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mb-6">
          <SidebarGroupLabel className="px-3 text-xs font-medium text-text-secondary mb-2">
            Insights
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {insightsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-10">
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:bg-muted-100 hover:text-text-primary transition-colors"
                      activeClassName="bg-accent-primary/10 text-accent-primary font-medium hover:bg-accent-primary/15"
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {open && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-medium text-text-secondary mb-2">
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {systemItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-10">
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:bg-muted-100 hover:text-text-primary transition-colors"
                      activeClassName="bg-accent-primary/10 text-accent-primary font-medium hover:bg-accent-primary/15"
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {open && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
