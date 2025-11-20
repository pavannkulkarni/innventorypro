import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Currency {
  id: string;
  symbol: string;
  code: string;
  is_base: boolean;
}

export function useCurrency() {
  const [baseCurrency, setBaseCurrency] = useState<Currency | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBaseCurrency();
  }, []);

  const fetchBaseCurrency = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("currencies")
      .select("id, symbol, code, is_base")
      .eq("user_id", session.user.id)
      .eq("is_base", true)
      .eq("is_active", true)
      .single();

    if (!error && data) {
      setBaseCurrency(data);
    } else {
      // Fallback to first active currency if no base currency
      const { data: fallbackData } = await supabase
        .from("currencies")
        .select("id, symbol, code, is_base")
        .eq("user_id", session.user.id)
        .eq("is_active", true)
        .limit(1)
        .single();

      if (fallbackData) {
        setBaseCurrency(fallbackData);
      }
    }
    setLoading(false);
  };

  const formatPrice = (price: number | null | undefined, currencySymbol?: string) => {
    if (price === null || price === undefined) return "-";
    
    const symbol = currencySymbol || baseCurrency?.symbol || "$";
    return `${symbol}${price.toFixed(2)}`;
  };

  return { baseCurrency, formatPrice, loading };
}
