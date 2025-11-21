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
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.svg";

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
  { title: "Inventory View", url: "/inventory", icon: Archive },
  { title: "Stock Movements", url: "/stock-movements", icon: TrendingUp },
];

const configItems = [
  { title: "Product Master", url: "/product-master", icon: Package },
  { title: "Warehouses", url: "/warehouses", icon: Warehouse },
  { title: "Suppliers", url: "/suppliers", icon: Users },
  { title: "Categories", url: "/categories", icon: FolderTree },
];

const insightsItems = [
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];

export function AppSidebar() {
  const { open } = useSidebar();

  return (
    <Sidebar className="border-r border-divider bg-surface-200">
      <SidebarHeader className="h-16 px-6 border-b border-divider flex items-center">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img src={logo} alt="InnoventoryPro Logo" className="h-10 w-10" />
          {open && (
            <div>
              <h2 className="text-lg font-semibold text-text-primary">InnoventoryPro</h2>
              <p className="text-xs text-text-secondary">Manage your stock</p>
            </div>
          )}
        </Link>
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

        <SidebarGroup>
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
      </SidebarContent>
    </Sidebar>
  );
}
