import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/useCurrency";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { ShoppingCart } from "@/components/POS/ShoppingCart";
import { ProductGrid } from "@/components/POS/ProductGrid";
import { CheckoutDialog } from "@/components/POS/CheckoutDialog";
import { SalesHistoryDialog } from "@/components/POS/SalesHistoryDialog";
import { Search, Scan, ShoppingBag, LogOut, History } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.svg";

interface CartItem {
  id: string;
  product_id: string;
  variant_id?: string;
  name: string;
  variant_name?: string;
  sku?: string;
  price: number;
  quantity: number;
  available_stock: number;
}

export default function POS() {
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [salesHistoryOpen, setSalesHistoryOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchUserAndData();
  }, []);

  useEffect(() => {
    if (userId && selectedWarehouse) {
      fetchProducts();
    }
  }, [userId, selectedWarehouse]);

  const fetchUserAndData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      await fetchWarehouses(user.id);
    }
    setLoading(false);
  };

  const fetchWarehouses = async (uid: string) => {
    const { data, error } = await supabase
      .from("warehouses")
      .select("*")
      .eq("user_id", uid)
      .eq("is_active", true)
      .order("name");

    if (data && data.length > 0) {
      setWarehouses(data);
      setSelectedWarehouse(data[0].id);
    }
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        product_variants (*)
      `)
      .eq("user_id", userId)
      .eq("warehouse_id", selectedWarehouse)
      .gt("quantity", 0)
      .order("name");

    if (data) {
      setProducts(data);
    }
  };

  const addToCart = (product: any, variant?: any) => {
    const itemId = variant ? `${product.id}-${variant.id}` : product.id;
    const existingItem = cart.find(item => item.id === itemId);
    
    const price = variant?.price || product.price || 0;
    const availableStock = variant?.quantity || product.quantity || 0;
    
    if (existingItem) {
      if (existingItem.quantity >= availableStock) {
        toast({
          title: "Stock Limit",
          description: "Cannot add more items than available in stock",
          variant: "destructive",
        });
        return;
      }
      
      setCart(cart.map(item => 
        item.id === itemId 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      const newItem: CartItem = {
        id: itemId,
        product_id: product.id,
        variant_id: variant?.id,
        name: product.name,
        variant_name: variant?.name,
        sku: variant?.sku || product.sku,
        price,
        quantity: 1,
        available_stock: availableStock,
      };
      setCart([...cart, newItem]);
    }

    toast({
      title: "Added to Cart",
      description: `${product.name}${variant ? ` - ${variant.name}` : ""} added to cart`,
    });
  };

  const updateCartItem = (itemId: string, quantity: number) => {
    const item = cart.find(i => i.id === itemId);
    if (!item) return;

    if (quantity > item.available_stock) {
      toast({
        title: "Stock Limit",
        description: "Cannot exceed available stock",
        variant: "destructive",
      });
      return;
    }

    if (quantity <= 0) {
      removeCartItem(itemId);
      return;
    }

    setCart(cart.map(i => 
      i.id === itemId ? { ...i, quantity } : i
    ));
  };

  const removeCartItem = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
    toast({
      title: "Item Removed",
      description: "Item removed from cart",
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const handleBarcodeScan = async (code: string) => {
    try {
      setScannerOpen(false);

      // Search for product by barcode
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", userId)
        .eq("warehouse_id", selectedWarehouse)
        .eq("barcode", code)
        .gt("quantity", 0)
        .single();

      if (productData) {
        addToCart(productData);
        return;
      }

      // Search for variant by barcode
      const { data: variantData, error: variantError } = await supabase
        .from("product_variants")
        .select(`
          *,
          products (*)
        `)
        .eq("user_id", userId)
        .eq("barcode", code)
        .gt("quantity", 0)
        .single();

      if (variantData && variantData.products) {
        addToCart(variantData.products, variantData);
        return;
      }

      toast({
        title: "Not Found",
        description: "No product found with this barcode",
        variant: "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to cart before checkout",
        variant: "destructive",
      });
      return;
    }

    if (!selectedWarehouse) {
      toast({
        title: "Select Warehouse",
        description: "Please select a warehouse before checkout",
        variant: "destructive",
      });
      return;
    }

    setCheckoutOpen(true);
  };

  const handleCheckoutComplete = () => {
    setCheckoutOpen(false);
    clearCart();
    toast({
      title: "Sale Completed",
      description: "Sale has been successfully processed",
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-bg-200">
      {/* POS Header */}
      <header className="h-16 border-b border-divider bg-surface-200 flex items-center px-4 md:px-6 justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="POS" className="h-8 w-8" />
          <h1 className="text-xl font-semibold text-text-primary">Point of Sale</h1>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="h-10 px-3 rounded-lg bg-surface-100 border border-divider text-text-primary text-sm"
          >
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSalesHistoryOpen(true)}
            className="gap-2"
          >
            <History className="h-4 w-4" />
            Sales History
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Products Section */}
        <div className="flex-1 flex flex-col">
          {/* Search Bar */}
          <div className="bg-surface-100 border-b border-divider p-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search products or scan barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setScannerOpen(true)}
              >
                <Scan className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Product Grid */}
          <ScrollArea className="flex-1 p-4">
            <ProductGrid
              products={filteredProducts}
              onAddToCart={addToCart}
              formatPrice={formatPrice}
            />
          </ScrollArea>
        </div>

        {/* Cart Section */}
        <div className="w-80 lg:w-96 border-l border-divider bg-surface-100 flex flex-col">
          <ShoppingCart
            cart={cart}
            onUpdateQuantity={updateCartItem}
            onRemoveItem={removeCartItem}
            onClearCart={clearCart}
            formatPrice={formatPrice}
          />

          {/* Cart Footer */}
          <div className="p-4 border-t border-divider mt-auto bg-surface-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold text-text-primary">Total:</span>
              <span className="text-2xl font-bold text-accent-primary">
                {formatPrice(cartTotal)}
              </span>
            </div>
            <Button
              className="w-full"
              size="lg"
              onClick={handleCheckout}
              disabled={cart.length === 0}
            >
              <ShoppingBag className="mr-2 h-5 w-5" />
              Checkout
            </Button>
          </div>
        </div>
      </div>

      {/* Barcode Scanner */}
      {scannerOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <BarcodeScanner
              onScan={handleBarcodeScan}
              onClose={() => setScannerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Checkout Dialog */}
      <CheckoutDialog
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cart={cart}
        warehouseId={selectedWarehouse}
        userId={userId}
        onComplete={handleCheckoutComplete}
        formatPrice={formatPrice}
      />

      {/* Sales History Dialog */}
      <SalesHistoryDialog
        open={salesHistoryOpen}
        onClose={() => setSalesHistoryOpen(false)}
        userId={userId}
      />
    </div>
  );
}
