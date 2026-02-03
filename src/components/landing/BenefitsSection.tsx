import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  ArrowRight, 
  CheckCircle2,
  BarChart3,
  Clock,
  Shield,
  Layers
} from "lucide-react";

const benefits = [
  "Real-time stock tracking across all locations",
  "Automated purchase order management",
  "Customer credit & loyalty management",
  "Comprehensive sales history & analytics",
  "Export reports to CSV, Excel, PDF",
  "Role-based access control",
  "Multi-currency support",
  "PWA for mobile access",
];

const highlights = [
  {
    icon: Clock,
    title: "Save 10+ Hours Weekly",
    description: "Automate manual inventory tasks and focus on growing your business.",
  },
  {
    icon: BarChart3,
    title: "Reduce Stock-outs by 90%",
    description: "Smart alerts and forecasting ensure you never miss a sale.",
  },
  {
    icon: Shield,
    title: "Enterprise-Grade Security",
    description: "Bank-level encryption and row-level security protect your data.",
  },
  {
    icon: Layers,
    title: "Scales With You",
    description: "From single store to multi-warehouse operations, we grow with you.",
  },
];

export function BenefitsSection() {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-bg-200 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-success/5 rounded-full blur-3xl -translate-y-1/2" />

      <div className="container mx-auto px-6 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left side - Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success text-sm font-medium mb-6">
              <CheckCircle2 className="h-4 w-4" />
              Why Choose Us
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
              Built for Efficiency,
              <br />
              <span className="bg-gradient-to-r from-success to-chart-1 bg-clip-text text-transparent">
                Designed for Growth
              </span>
            </h2>

            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Whether you're managing a single store or multiple warehouses, 
              InnoventoryPro scales with your business needs while keeping things simple.
            </p>

            {/* Benefits checklist */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-3 w-3 text-success" />
                  </div>
                  <span className="text-foreground text-sm">{benefit}</span>
                </li>
              ))}
            </ul>

            <Button 
              size="lg" 
              onClick={() => navigate("/auth")}
              className="h-12 px-6"
            >
              Get Started Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Right side - Highlights grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {highlights.map((highlight, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl bg-surface-100 border border-divider hover:border-primary/30 transition-colors group"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <highlight.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {highlight.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {highlight.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}