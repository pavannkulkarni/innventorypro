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
  ShoppingCart,
  CreditCard,
  UserCircle,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const inventoryItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, color: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400" },
  { title: "Inventory View", url: "/dashboard/inventory", icon: Archive, color: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" },
  { title: "Stock Movements", url: "/dashboard/stock-movements", icon: TrendingUp, color: "bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400" },
];

const purchaseItems = [
  { title: "Purchase Orders", url: "/dashboard/purchase-orders", icon: ShoppingCart, color: "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400" },
];


const configItems = [
  { title: "Product Master", url: "/dashboard/product-master", icon: Package, color: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400" },
  { title: "Warehouses", url: "/dashboard/warehouses", icon: Warehouse, color: "bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400" },
  { title: "Suppliers", url: "/dashboard/suppliers", icon: Users, color: "bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400" },
  { title: "Categories", url: "/dashboard/categories", icon: FolderTree, color: "bg-pink-500/10 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400" },
];

const insightsItems = [
  { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3, color: "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400" },
];

export function AppSidebar() {
  const { open } = useSidebar();

  return (
    <Sidebar className="border-r border-divider bg-surface-200">
      <SidebarHeader className="h-16 px-6 border-b border-divider flex items-center">
        <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
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
          <SidebarGroupLabel className="px-3 text-xs font-semibold text-text-primary mb-2 uppercase tracking-wide">
            Inventory
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {inventoryItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-10">
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-primary hover:bg-muted-100 transition-colors group"
                      activeClassName="bg-accent-primary/10 text-accent-primary font-medium hover:bg-accent-primary/15"
                    >
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${item.color}`}>
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                      </div>
                      {open && <span className="text-sm font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mb-6">
          <SidebarGroupLabel className="px-3 text-xs font-semibold text-text-primary mb-2 uppercase tracking-wide">
            Procurement
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {purchaseItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-10">
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-primary hover:bg-muted-100 transition-colors group"
                      activeClassName="bg-accent-primary/10 text-accent-primary font-medium hover:bg-accent-primary/15"
                    >
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${item.color}`}>
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                      </div>
                      {open && <span className="text-sm font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>


        <Collapsible defaultOpen className="mb-6">
          <SidebarGroup>
            <CollapsibleTrigger className="w-full">
              <SidebarGroupLabel className="px-3 text-xs font-semibold text-text-primary mb-2 uppercase tracking-wide cursor-pointer hover:text-accent-primary transition-colors">
                Configuration
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {configItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild className="h-10">
                        <NavLink
                          to={item.url}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-primary hover:bg-muted-100 transition-colors group"
                          activeClassName="bg-accent-primary/10 text-accent-primary font-medium hover:bg-accent-primary/15"
                        >
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${item.color}`}>
                            <item.icon className="h-4 w-4 flex-shrink-0" />
                          </div>
                          {open && <span className="text-sm font-medium">{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-semibold text-text-primary mb-2 uppercase tracking-wide">
            Insights
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {insightsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-10">
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-primary hover:bg-muted-100 transition-colors group"
                      activeClassName="bg-accent-primary/10 text-accent-primary font-medium hover:bg-accent-primary/15"
                    >
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${item.color}`}>
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                      </div>
                      {open && <span className="text-sm font-medium">{item.title}</span>}
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
