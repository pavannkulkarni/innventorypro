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
import { GlobalSearch } from "./components/GlobalSearch";
import { NotificationBell } from "./components/NotificationBell";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import ProductMaster from "./pages/ProductMaster";
import StockMovements from "./pages/StockMovements";
import InventoryView from "./pages/InventoryView";
import ProductVariants from "./pages/ProductVariants";
import Warehouses from "./pages/Warehouses";
import Suppliers from "./pages/Suppliers";
import Categories from "./pages/Categories";
import PurchaseOrders from "./pages/PurchaseOrders";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import POS from "./pages/POS";
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
                        <div className="flex-1 flex flex-col min-w-0">
                          <header className="h-16 border-b border-divider bg-surface-200 flex items-center px-4 md:px-6 gap-2 md:gap-4 flex-shrink-0">
                            <SidebarTrigger className="-ml-2" />
                            
                            <div className="flex-1 max-w-2xl mx-auto w-full">
                              <GlobalSearch />
                            </div>

                            <div className="flex items-center gap-2">
                              <NotificationBell />

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

                              <div className="relative group">
                                <button className="h-9 w-9 rounded-full bg-accent-primary/10 flex items-center justify-center hover:bg-accent-primary/20 transition-colors">
                                  <svg className="h-4 w-4 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </button>
                                
                                <div className="absolute right-0 top-full mt-2 w-48 bg-surface-100 border border-divider rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                  <div className="py-2">
                                    <button
                                      onClick={() => window.location.href = '/settings'}
                                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-primary hover:bg-muted-100 transition-colors"
                                    >
                                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                      Settings
                                    </button>
                                    <button
                                      onClick={() => window.location.href = '/install'}
                                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-primary hover:bg-muted-100 transition-colors"
                                    >
                                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                      </svg>
                                      Install App
                                    </button>
                                    <div className="h-px bg-divider my-1" />
                                    <button
                                      onClick={async () => {
                                        await supabase.auth.signOut();
                                      }}
                                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-danger hover:bg-muted-100 transition-colors"
                                    >
                                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                      </svg>
                                      Sign Out
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </header>
                          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
                            <div className="container mx-auto max-w-7xl">
                              <Routes>
                                <Route path="/" element={<Dashboard />} />
                                <Route path="/product-master" element={<ProductMaster />} />
                                <Route path="/product-master/:productId/variants" element={<ProductVariants />} />
                                <Route path="/stock-movements" element={<StockMovements />} />
                                <Route path="/inventory" element={<InventoryView />} />
                                <Route path="/warehouses" element={<Warehouses />} />
                                <Route path="/suppliers" element={<Suppliers />} />
                                <Route path="/categories" element={<Categories />} />
                                <Route path="/purchase-orders" element={<PurchaseOrders />} />
                                <Route path="/pos" element={<POS />} />
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
