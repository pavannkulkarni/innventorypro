import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Search, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCurrency } from "@/hooks/useCurrency";

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  category_id?: string;
  supplier_id?: string;
  warehouse_id?: string;
  currency_id?: string;
  quantity: number;
  price: number;
  categories?: { name: string };
  suppliers?: { name: string };
  warehouses?: { name: string };
  currencies?: { symbol: string };
}

interface InventoryTableProps {
  onEdit?: (product: Product) => void;
  onDelete?: (id: string) => void;
}

function getStatusVariant(quantity: number): "success" | "warning" | "danger" {
  if (quantity === 0) return "danger";
  if (quantity < 20) return "warning";
  return "success";
}

function getStatusLabel(quantity: number): string {
  if (quantity === 0) return "Out of Stock";
  if (quantity < 20) return "Low Stock";
  return "In Stock";
}

export function InventoryTable({ onEdit, onDelete }: InventoryTableProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    fetchProducts();

    // Subscribe to realtime changes for products
    const channel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        () => {
          fetchProducts();
        }
      )
      .subscribe();

    // Also listen to stock movements for real-time inventory updates
    const movementsChannel = supabase
      .channel('stock-movements-inventory')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stock_movements'
        },
        () => {
          fetchProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(movementsChannel);
    };
  }, []);

  const fetchProducts = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return;

    const { data: productsData, error } = await supabase
      .from("products")
      .select(`
        *,
        categories(name),
        suppliers(name),
        warehouses(name),
        currencies(symbol)
      `)
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch products");
      console.error(error);
      setLoading(false);
      return;
    }

    // Fetch stock movements to calculate actual inventory quantities
    const { data: movements } = await supabase
      .from("stock_movements")
      .select("product_id, transaction_type, quantity")
      .eq("user_id", session.user.id)
      .in("product_id", productsData?.map(p => p.id) || []);

    // Calculate actual quantity on hand for each product from stock movements
    const inventoryMap = new Map<string, number>();
    
    movements?.forEach((movement: any) => {
      const currentQty = inventoryMap.get(movement.product_id) || 0;
      const inTypes = ["OPENING_STOCK", "PURCHASE", "RETURN", "TRANSFER_IN"];
      
      if (inTypes.includes(movement.transaction_type)) {
        inventoryMap.set(movement.product_id, currentQty + movement.quantity);
      } else {
        inventoryMap.set(movement.product_id, currentQty - movement.quantity);
      }
    });

    // Update products with actual inventory quantities from stock movements
    const productsWithInventory = productsData?.map(product => ({
      ...product,
      quantity: inventoryMap.get(product.id) || 0
    })) || [];

    setProducts(productsWithInventory);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete product");
    } else {
      toast.success("Product deleted successfully");
      if (onDelete) onDelete(id);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.categories?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[150px]">Product Name</TableHead>
              <TableHead className="min-w-[100px]">SKU</TableHead>
              <TableHead className="min-w-[120px]">Category</TableHead>
              <TableHead className="min-w-[120px]">Supplier</TableHead>
              <TableHead className="min-w-[120px]">Warehouse</TableHead>
              <TableHead className="text-right min-w-[100px]">Price</TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
              <TableHead className="text-right min-w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No products found. Add your first product to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.sku || "-"}</TableCell>
                  <TableCell>{product.categories?.name || "-"}</TableCell>
                  <TableCell>{product.suppliers?.name || "-"}</TableCell>
                  <TableCell>{product.warehouses?.name || "-"}</TableCell>
                  <TableCell className="text-right">
                    {formatPrice(product.price, product.currencies?.symbol)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(product.quantity)}>
                      {getStatusLabel(product.quantity)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/product-master/${product.id}/variants`)}
                        title="Manage Variants"
                      >
                        <Package className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit && onEdit(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
