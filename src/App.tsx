import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
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
                  <div className="min-h-screen flex flex-col bg-bg-200">
                    <Header />
                    <main className="flex-1 p-6 container mx-auto">
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/inventory" element={<Inventory />} />
                        <Route path="/warehouses" element={<Warehouses />} />
                        <Route path="/suppliers" element={<Suppliers />} />
                        <Route path="/categories" element={<Categories />} />
                        <Route path="/currencies" element={<Currencies />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/install" element={<InstallPWA />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                  </div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
