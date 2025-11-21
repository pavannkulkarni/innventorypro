import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart as CartIcon, Trash2, Minus, Plus, X } from "lucide-react";

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

interface ShoppingCartProps {
  cart: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  formatPrice: (price: number) => string;
}

export function ShoppingCart({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  formatPrice,
}: ShoppingCartProps) {
  return (
    <>
      {/* Header */}
      <div className="p-4 border-b border-divider">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CartIcon className="h-5 w-5 text-accent-primary" />
            <h2 className="font-semibold text-text-primary">Shopping Cart</h2>
          </div>
          {cart.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearCart}
              className="text-status-danger hover:text-status-danger"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Cart Items */}
      <ScrollArea className="flex-1">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-secondary p-8">
            <CartIcon className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-center">Your cart is empty</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {cart.map((item) => (
              <div
                key={item.id}
                className="bg-surface-200 rounded-lg border border-divider p-3 space-y-2"
              >
                {/* Item Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-text-primary text-sm">
                      {item.name}
                    </h4>
                    {item.variant_name && (
                      <p className="text-xs text-text-secondary mt-0.5">
                        {item.variant_name}
                      </p>
                    )}
                    {item.sku && (
                      <p className="text-xs text-text-faint mt-0.5">{item.sku}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 -mt-1 -mr-1"
                    onClick={() => onRemoveItem(item.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value) || 0)}
                      className="w-16 h-8 text-center"
                      min="1"
                      max={item.available_stock}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.available_stock}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-text-primary">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                    <div className="text-xs text-text-secondary">
                      {formatPrice(item.price)} each
                    </div>
                  </div>
                </div>

                {/* Stock Warning */}
                {item.quantity >= item.available_stock && (
                  <div className="text-xs text-warning bg-warning/10 px-2 py-1 rounded">
                    Max stock reached
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </>
  );
}
