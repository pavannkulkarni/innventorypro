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
  LogOut,
  Moon,
  Sun,
  User
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

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

      <SidebarFooter className="p-4 border-t border-divider">
        <div className="flex items-center gap-2 mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex-1 h-9"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            {open && <span className="ml-2 text-sm">Toggle theme</span>}
          </Button>
        </div>
        
        <Separator className="mb-3" />
        
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border-2 border-divider">
            <AvatarFallback className="bg-accent-primary/10 text-accent-primary font-medium">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          
          {open && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">User</p>
              <p className="text-xs text-text-secondary truncate">Inventory Manager</p>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="h-9 w-9 flex-shrink-0"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
