import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { 
  Package, 
  BarChart3, 
  ShoppingCart, 
  Warehouse, 
  TrendingUp, 
  Shield, 
  Zap,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Package,
      title: "Product Management",
      description: "Track unlimited products with variants, SKUs, barcodes, and multi-warehouse support.",
    },
    {
      icon: ShoppingCart,
      title: "Point of Sale",
      description: "Fast, intuitive POS system with barcode scanning and instant checkout.",
    },
    {
      icon: BarChart3,
      title: "Real-time Analytics",
      description: "Comprehensive dashboards with sales insights and inventory metrics.",
    },
    {
      icon: Warehouse,
      title: "Multi-Warehouse",
      description: "Manage stock across multiple locations with seamless transfers.",
    },
    {
      icon: TrendingUp,
      title: "Low Stock Alerts",
      description: "Automated notifications when inventory falls below reorder levels.",
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with role-based access control.",
    },
  ];

  const benefits = [
    "Real-time stock tracking across all locations",
    "Automated purchase order management",
    "Customer credit management",
    "Comprehensive sales history",
    "Export reports to CSV",
    "Mobile-responsive design",
  ];

  return (
    <div className="min-h-screen bg-bg-200">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        
        <nav className="relative container mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <Package className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">InnoventoryPro</span>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/auth")}
              className="hidden sm:inline-flex"
            >
              Sign In
            </Button>
            <Button onClick={() => navigate("/auth")}>
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </nav>

        <div className="relative container mx-auto px-6 py-24 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <Zap className="h-4 w-4" />
            Powerful Inventory Management
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground max-w-4xl mx-auto leading-tight">
            Streamline Your{" "}
            <span className="text-primary">Inventory</span>{" "}
            Operations
          </h1>
          
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            The complete inventory management solution for modern businesses. 
            Track stock, process sales, and grow your business with real-time insights.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")}
              className="text-lg px-8 py-6"
            >
              Start Free Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate("/auth")}
              className="text-lg px-8 py-6"
            >
              View Demo
            </Button>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-24 bg-surface-100">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Manage Inventory
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Powerful features designed to simplify your inventory operations and boost productivity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card border-divider"
              >
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-bg-200">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Built for Efficiency, Designed for Growth
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Whether you're managing a single store or multiple warehouses, 
                InnoventoryPro scales with your business needs.
              </p>

              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>

              <Button 
                size="lg" 
                onClick={() => navigate("/auth")}
                className="mt-8"
              >
                Get Started Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl p-8">
                <div className="bg-surface-100 rounded-xl shadow-2xl p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-3 w-3 rounded-full bg-danger" />
                    <div className="h-3 w-3 rounded-full bg-warning" />
                    <div className="h-3 w-3 rounded-full bg-success" />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="h-8 bg-muted-100 rounded-lg w-3/4 animate-pulse" />
                    <div className="h-24 bg-muted-100 rounded-lg animate-pulse" />
                    <div className="grid grid-cols-3 gap-3">
                      <div className="h-20 bg-primary/20 rounded-lg" />
                      <div className="h-20 bg-success/20 rounded-lg" />
                      <div className="h-20 bg-warning/20 rounded-lg" />
                    </div>
                    <div className="h-32 bg-muted-100 rounded-lg animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Transform Your Inventory Management?
          </h2>
          <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto mb-8">
            Join businesses that trust InnoventoryPro for their inventory needs.
            Start for free, no credit card required.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => navigate("/auth")}
            className="text-lg px-8 py-6"
          >
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-surface-100 border-t border-divider">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Package className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold text-foreground">InnoventoryPro</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} InnoventoryPro. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}