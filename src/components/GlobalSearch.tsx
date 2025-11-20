import { useState, useEffect, useRef } from "react";
import { Search, Package, Warehouse, Building2, Tag, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface SearchResult {
  id: string;
  type: "product" | "variant" | "warehouse" | "supplier" | "category" | "movement";
  title: string;
  subtitle?: string;
  route: string;
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchData = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const searchTerm = `%${query.trim()}%`;
      const allResults: SearchResult[] = [];

      try {
        // Search products
        const { data: products } = await supabase
          .from("products")
          .select("id, name, sku, barcode")
          .eq("user_id", session.user.id)
          .or(`name.ilike.${searchTerm},sku.ilike.${searchTerm},barcode.ilike.${searchTerm}`)
          .limit(5);

        if (products) {
          allResults.push(
            ...products.map((p) => ({
              id: p.id,
              type: "product" as const,
              title: p.name,
              subtitle: p.sku || p.barcode || undefined,
              route: "/inventory",
            }))
          );
        }

        // Search product variants
        const { data: variants } = await supabase
          .from("product_variants")
          .select("id, name, sku, barcode")
          .eq("user_id", session.user.id)
          .or(`name.ilike.${searchTerm},sku.ilike.${searchTerm},barcode.ilike.${searchTerm}`)
          .limit(5);

        if (variants) {
          allResults.push(
            ...variants.map((v) => ({
              id: v.id,
              type: "variant" as const,
              title: v.name,
              subtitle: v.sku || v.barcode || "Variant",
              route: "/product-variants",
            }))
          );
        }

        // Search warehouses
        const { data: warehouses } = await supabase
          .from("warehouses")
          .select("id, name, code, location")
          .eq("user_id", session.user.id)
          .or(`name.ilike.${searchTerm},code.ilike.${searchTerm},location.ilike.${searchTerm}`)
          .limit(5);

        if (warehouses) {
          allResults.push(
            ...warehouses.map((w) => ({
              id: w.id,
              type: "warehouse" as const,
              title: w.name,
              subtitle: w.location || w.code,
              route: "/warehouses",
            }))
          );
        }

        // Search suppliers
        const { data: suppliers } = await supabase
          .from("suppliers")
          .select("id, name, code, contact_person")
          .eq("user_id", session.user.id)
          .or(`name.ilike.${searchTerm},code.ilike.${searchTerm},contact_person.ilike.${searchTerm}`)
          .limit(5);

        if (suppliers) {
          allResults.push(
            ...suppliers.map((s) => ({
              id: s.id,
              type: "supplier" as const,
              title: s.name,
              subtitle: s.contact_person || s.code,
              route: "/suppliers",
            }))
          );
        }

        // Search categories
        const { data: categories } = await supabase
          .from("categories")
          .select("id, name, code, description")
          .eq("user_id", session.user.id)
          .or(`name.ilike.${searchTerm},code.ilike.${searchTerm},description.ilike.${searchTerm}`)
          .limit(5);

        if (categories) {
          allResults.push(
            ...categories.map((c) => ({
              id: c.id,
              type: "category" as const,
              title: c.name,
              subtitle: c.code || c.description?.substring(0, 50),
              route: "/categories",
            }))
          );
        }

        setResults(allResults);
        setIsOpen(allResults.length > 0);
        setSelectedIndex(0);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchData, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
        break;
      case "Enter":
        e.preventDefault();
        if (results[selectedIndex]) {
          handleResultClick(results[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.route);
    setQuery("");
    setIsOpen(false);
  };

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "product":
        return <Package className="h-4 w-4" />;
      case "variant":
        return <Package className="h-4 w-4 opacity-70" />;
      case "warehouse":
        return <Warehouse className="h-4 w-4" />;
      case "supplier":
        return <Building2 className="h-4 w-4" />;
      case "category":
        return <Tag className="h-4 w-4" />;
      case "movement":
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: SearchResult["type"]) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search products, warehouses, suppliers..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          className="pl-10 bg-surface-100 border-divider text-sm h-9"
        />
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-surface-100 border border-divider rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {loading && (
            <div className="p-4 text-center text-sm text-text-secondary">
              Searching...
            </div>
          )}
          {results.map((result, index) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => handleResultClick(result)}
              className={`w-full text-left px-4 py-3 hover:bg-muted-100 transition-colors border-b border-divider last:border-b-0 flex items-start gap-3 ${
                index === selectedIndex ? "bg-muted-100" : ""
              }`}
            >
              <div className="mt-1 text-text-secondary">{getIcon(result.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text-primary truncate">
                    {result.title}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-surface-200 text-text-secondary shrink-0">
                    {getTypeLabel(result.type)}
                  </span>
                </div>
                {result.subtitle && (
                  <p className="text-xs text-text-secondary mt-0.5 truncate">
                    {result.subtitle}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.trim().length >= 2 && results.length === 0 && !loading && (
        <div className="absolute top-full mt-2 w-full bg-surface-100 border border-divider rounded-lg shadow-lg z-50 p-4 text-center text-sm text-text-secondary">
          No results found for "{query}"
        </div>
      )}
    </div>
  );
}
