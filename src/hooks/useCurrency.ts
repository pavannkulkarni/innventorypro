// Default currency is set to Indian Rupee (INR)
interface Currency {
  id: string;
  symbol: string;
  code: string;
  is_base: boolean;
}

const DEFAULT_CURRENCY: Currency = {
  id: "default-inr",
  symbol: "₹",
  code: "INR",
  is_base: true,
};

export function useCurrency() {
  const baseCurrency = DEFAULT_CURRENCY;
  const loading = false;

  const formatPrice = (price: number | null | undefined, currencySymbol?: string) => {
    if (price === null || price === undefined) return "-";
    
    const symbol = currencySymbol || baseCurrency.symbol;
    return `${symbol}${price.toFixed(2)}`;
  };

  return { baseCurrency, formatPrice, loading };
}
