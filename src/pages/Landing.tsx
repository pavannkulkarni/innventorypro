import { Helmet } from "react-helmet-async";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { BenefitsSection } from "@/components/landing/BenefitsSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

export default function Landing() {
  const url = "https://innventorypro.lovable.app/";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "InnoventoryPro",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "Multi-warehouse inventory management with barcode scanning, purchase orders, POS, and real-time analytics.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <div className="min-h-screen bg-bg-200">
      <Helmet>
        <title>InnoventoryPro — Smart Inventory & POS Management</title>
        <meta
          name="description"
          content="Run multi-warehouse inventory, barcode scanning, purchase orders, POS sales, and real-time analytics from one modern dashboard."
        />
        <link rel="canonical" href={url} />
        <meta property="og:title" content="InnoventoryPro — Smart Inventory & POS Management" />
        <meta
          property="og:description"
          content="Multi-warehouse stock, barcode scanning, purchase orders, POS, and analytics in one platform."
        />
        <meta property="og:url" content={url} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <Navbar />
      <main className="pt-16">
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <BenefitsSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
