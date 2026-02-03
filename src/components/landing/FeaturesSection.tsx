import { Card, CardContent } from "@/components/ui/card";
import { 
  Package, 
  BarChart3, 
  ShoppingCart, 
  Warehouse, 
  TrendingUp, 
  Shield,
  Zap,
  RefreshCcw,
  Bell,
  Users,
  FileText,
  Smartphone
} from "lucide-react";

const features = [
  {
    icon: Package,
    title: "Smart Product Management",
    description: "Track unlimited products with variants, SKUs, barcodes, and intelligent categorization.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: ShoppingCart,
    title: "Lightning-Fast POS",
    description: "Process sales in seconds with barcode scanning, quick checkout, and instant receipts.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description: "Beautiful dashboards with actionable insights, trends, and performance metrics.",
    gradient: "from-orange-500 to-red-500",
  },
  {
    icon: Warehouse,
    title: "Multi-Warehouse",
    description: "Manage stock across unlimited locations with seamless transfer workflows.",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: TrendingUp,
    title: "Smart Alerts",
    description: "Automated notifications for low stock, reorder points, and critical events.",
    gradient: "from-yellow-500 to-orange-500",
  },
  {
    icon: RefreshCcw,
    title: "Returns & Refunds",
    description: "Process returns effortlessly with automatic stock updates and refund tracking.",
    gradient: "from-teal-500 to-cyan-500",
  },
  {
    icon: Users,
    title: "Customer Management",
    description: "Build relationships with credit management, purchase history, and loyalty tracking.",
    gradient: "from-indigo-500 to-purple-500",
  },
  {
    icon: FileText,
    title: "Purchase Orders",
    description: "Streamlined procurement with supplier management and approval workflows.",
    gradient: "from-rose-500 to-pink-500",
  },
  {
    icon: Smartphone,
    title: "Mobile Ready",
    description: "Full functionality on any device. Install as a PWA for native-like experience.",
    gradient: "from-sky-500 to-blue-500",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 bg-surface-100 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-chart-2/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            Powerful Features
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Everything You Need to
            <br />
            <span className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
              Run Your Business
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Powerful features designed to simplify operations and boost productivity across every aspect of inventory management.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group relative overflow-hidden border-divider bg-card/50 backdrop-blur-sm hover:bg-card transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
            >
              <CardContent className="p-6">
                {/* Icon with gradient background */}
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover gradient line */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}