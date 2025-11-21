import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, LayoutDashboard, Package, Warehouse, Users, FolderTree, DollarSign, BarChart3, Settings, Moon, Sun, Archive, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { NotificationBell } from "@/components/NotificationBell";

export default function Header() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-divider bg-surface-200 backdrop-blur supports-[backdrop-filter]:bg-surface-200/95">
      <div className="flex h-16 items-center px-6">
        <div className="flex items-center gap-2 font-semibold text-xl">
          <Package className="h-6 w-6 text-primary" />
          <span>Inventory</span>
        </div>

        <nav className="flex items-center gap-1 mx-8 flex-1">
          <NavLink
            to="/"
            end
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted/50"
            activeClassName="bg-muted text-primary"
          >
            <LayoutDashboard className="h-4 w-4 inline-block mr-2" />
            Dashboard
          </NavLink>
          <NavLink
            to="/product-master"
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted/50"
            activeClassName="bg-muted text-primary"
          >
            <Package className="h-4 w-4 inline-block mr-2" />
            Product Master
          </NavLink>
          <NavLink
            to="/stock-movements"
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted/50"
            activeClassName="bg-muted text-primary"
          >
            <TrendingUp className="h-4 w-4 inline-block mr-2" />
            Stock Movements
          </NavLink>
          <NavLink
            to="/inventory"
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted/50"
            activeClassName="bg-muted text-primary"
          >
            <Archive className="h-4 w-4 inline-block mr-2" />
            Inventory View
          </NavLink>
          <NavLink
            to="/warehouses"
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted/50"
            activeClassName="bg-muted text-primary"
          >
            <Warehouse className="h-4 w-4 inline-block mr-2" />
            Warehouses
          </NavLink>
          <NavLink
            to="/suppliers"
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted/50"
            activeClassName="bg-muted text-primary"
          >
            <Users className="h-4 w-4 inline-block mr-2" />
            Suppliers
          </NavLink>
          <NavLink
            to="/categories"
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted/50"
            activeClassName="bg-muted text-primary"
          >
            <FolderTree className="h-4 w-4 inline-block mr-2" />
            Categories
          </NavLink>
          <NavLink
            to="/currencies"
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted/50"
            activeClassName="bg-muted text-primary"
          >
            <DollarSign className="h-4 w-4 inline-block mr-2" />
            Currencies
          </NavLink>
          <NavLink
            to="/analytics"
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted/50"
            activeClassName="bg-muted text-primary"
          >
            <BarChart3 className="h-4 w-4 inline-block mr-2" />
            Analytics
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <NotificationBell />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
