import { TrendingUp, Package, Users, Zap } from "lucide-react";

const stats = [
  {
    icon: Package,
    value: "10M+",
    label: "Products Tracked",
    description: "Across all customers",
  },
  {
    icon: TrendingUp,
    value: "99.9%",
    label: "Uptime",
    description: "Enterprise reliability",
  },
  {
    icon: Users,
    value: "500+",
    label: "Businesses",
    description: "Trust our platform",
  },
  {
    icon: Zap,
    value: "<100ms",
    label: "Response Time",
    description: "Lightning fast",
  },
];

export function StatsSection() {
  return (
    <section className="py-20 bg-bg-200 relative">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="container mx-auto px-6 relative">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center group">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                <stat.icon className="h-7 w-7 text-primary" />
              </div>
              <div className="text-4xl md:text-5xl font-bold text-foreground mb-1 tracking-tight">
                {stat.value}
              </div>
              <div className="text-foreground font-medium mb-1">{stat.label}</div>
              <div className="text-sm text-muted-foreground">{stat.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}