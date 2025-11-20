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
                          <header className="h-16 border-b border-divider bg-surface-200 flex items-center px-6 gap-4">
                            <SidebarTrigger className="-ml-2" />
                            
                            <div className="flex-1 max-w-2xl mx-auto">
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder="Search products, variants, warehouses..."
                                  className="w-full h-10 px-4 pl-10 bg-surface-100 border border-divider rounded-lg text-sm text-text-primary placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary transition-all"
                                />
                                <svg
                                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                  />
                                </svg>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  const theme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
                                  document.documentElement.classList.toggle('dark');
                                }}
                                className="h-9 w-9 rounded-lg hover:bg-muted-100 flex items-center justify-center transition-colors"
                              >
                                <svg className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                <svg className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                              </button>

                              <div className="h-6 w-px bg-divider" />

                              <div className="flex items-center gap-2">
                                <div className="h-9 w-9 rounded-full bg-accent-primary/10 flex items-center justify-center">
                                  <svg className="h-4 w-4 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                                <button
                                  onClick={async () => {
                                    await supabase.auth.signOut();
                                  }}
                                  className="h-9 w-9 rounded-lg hover:bg-muted-100 flex items-center justify-center transition-colors"
                                  title="Sign out"
                                >
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                  </svg>
                                </button>
                              </div>
                            </div>
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
