import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    quote: "InnoventoryPro transformed how we manage our three warehouse locations. Stock discrepancies dropped by 95% in the first month.",
    author: "Sarah Chen",
    role: "Operations Director",
    company: "TechMart Retail",
    rating: 5,
  },
  {
    quote: "The POS system is incredibly fast. Our checkout times improved by 40%, and customers love the instant receipts.",
    author: "Michael Okonkwo",
    role: "Store Manager",
    company: "Fresh Foods Co.",
    rating: 5,
  },
  {
    quote: "Finally, an inventory system that doesn't require a PhD to use. Our team was up and running in less than a day.",
    author: "Priya Sharma",
    role: "Business Owner",
    company: "Sharma Electronics",
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-24 bg-surface-100 relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-1/2 right-0 w-72 h-72 bg-chart-2/5 rounded-full blur-3xl -translate-y-1/2" />

      <div className="container mx-auto px-6 relative">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-chart-2/10 text-chart-2 text-sm font-medium mb-6">
            <Star className="h-4 w-4 fill-current" />
            Customer Stories
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Loved by Businesses
            <br />
            <span className="bg-gradient-to-r from-chart-2 to-chart-3 bg-clip-text text-transparent">
              Worldwide
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            See how businesses like yours are transforming their operations with InnoventoryPro.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index}
              className="bg-card border-divider hover:border-chart-2/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <CardContent className="p-6">
                {/* Quote icon */}
                <Quote className="h-8 w-8 text-chart-2/30 mb-4" />

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-warning fill-warning" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-foreground mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-chart-2/40 to-chart-3/40 flex items-center justify-center text-sm font-semibold text-foreground">
                    {testimonial.author.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">
                      {testimonial.author}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {testimonial.role}, {testimonial.company}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}