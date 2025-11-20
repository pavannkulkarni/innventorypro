import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { ThemeProvider } from "next-themes";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/AppSidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import ProductMaster from "./pages/ProductMaster";
import StockMovements from "./pages/StockMovements";
import InventoryView from "./pages/InventoryView";
import ProductVariants from "./pages/ProductVariants";
import Warehouses from "./pages/Warehouses";
import Suppliers from "./pages/Suppliers";
import Categories from "./pages/Categories";
import Currencies from "./pages/Currencies";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import InstallPWA from "./pages/InstallPWA";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={session ? <Navigate to="/" replace /> : <Auth />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <SidebarProvider defaultOpen={true}>
                      <div className="min-h-screen flex w-full bg-bg-200">
                        <AppSidebar />
                        <div className="flex-1 flex flex-col">
                          <header className="h-14 border-b border-divider bg-surface-200 flex items-center px-6">
                            <SidebarTrigger className="-ml-2" />
                          </header>
                          <main className="flex-1 p-6 overflow-auto">
                            <div className="container mx-auto">
                              <Routes>
                                <Route path="/" element={<Dashboard />} />
                                <Route path="/product-master" element={<ProductMaster />} />
                                <Route path="/product-master/:productId/variants" element={<ProductVariants />} />
                                <Route path="/stock-movements" element={<StockMovements />} />
                                <Route path="/inventory" element={<InventoryView />} />
                                <Route path="/warehouses" element={<Warehouses />} />
                                <Route path="/suppliers" element={<Suppliers />} />
                                <Route path="/categories" element={<Categories />} />
                                <Route path="/currencies" element={<Currencies />} />
                                <Route path="/analytics" element={<Analytics />} />
                                <Route path="/settings" element={<Settings />} />
                                <Route path="/install" element={<InstallPWA />} />
                                <Route path="*" element={<NotFound />} />
                              </Routes>
                            </div>
                          </main>
                        </div>
                      </div>
                    </SidebarProvider>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
