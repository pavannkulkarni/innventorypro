import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Package } from "lucide-react";

interface ProductGridProps {
  products: any[];
  onAddToCart: (product: any, variant?: any) => void;
  formatPrice: (price: number) => string;
}

export function ProductGrid({ products, onAddToCart, formatPrice }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-text-secondary">
        <Package className="h-16 w-16 mb-4 opacity-50" />
        <p>No products available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <div key={product.id}>
          {/* Product Card */}
          <Card className="bg-surface-200 border-divider hover:shadow-elevation-1 transition-shadow cursor-pointer group">
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-text-primary line-clamp-2 mb-1">
                    {product.name}
                  </h3>
                  {product.sku && (
                    <p className="text-xs text-text-secondary">{product.sku}</p>
                  )}
                </div>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <div className="text-lg font-semibold text-accent-primary">
                    {formatPrice(product.price || 0)}
                  </div>
                  <Badge variant="outline" className="mt-1">
                    Stock: {product.quantity}
                  </Badge>
                </div>
                <Button
                  size="icon"
                  onClick={() => onAddToCart(product)}
                  disabled={product.quantity === 0}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Variants */}
          {product.product_variants && product.product_variants.length > 0 && (
            <div className="mt-2 space-y-2">
              {product.product_variants.map((variant: any) => (
                <Card
                  key={variant.id}
                  className="bg-muted-100 border-divider hover:shadow-elevation-1 transition-shadow cursor-pointer group"
                >
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-primary">
                        {variant.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-semibold text-accent-primary">
                          {formatPrice(variant.price || 0)}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {variant.quantity}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onAddToCart(product, variant)}
                      disabled={variant.quantity === 0}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
