import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/hooks/useCurrency";

interface InventoryItem {
  product_id: string;
  product_name: string;
  product_sku: string;
  variant_id: string | null;
  variant_name: string | null;
  warehouse_id: string;
  warehouse_name: string;
  stock_in: number;
  stock_out: number;
  quantity_on_hand: number;
  cost_per_unit: number;
  inventory_value: number;
  reorder_level: number;
}

export default function InventoryView() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    fetchInventory();

    const channel = supabase
      .channel("inventory-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stock_movements",
        },
        () => {
          fetchInventory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchInventory = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      // Fetch all products with their cost
      const { data: products } = await supabase
        .from("products")
        .select("id, name, sku, cost, reorder_level")
        .eq("user_id", session.user.id);

      // Fetch all variants with their cost
      const { data: variants } = await supabase
        .from("product_variants")
        .select("id, product_id, name, sku, cost, reorder_level")
        .eq("user_id", session.user.id);

      // Fetch all stock movements
      const { data: movements } = await supabase
        .from("stock_movements")
        .select(`
          product_id,
          variant_id,
          warehouse_id,
          transaction_type,
          quantity,
          warehouses(name)
        `)
        .eq("user_id", session.user.id);

      // Calculate inventory per product/variant/warehouse
      const inventoryMap = new Map<string, InventoryItem>();

      movements?.forEach((movement: any) => {
        const key = `${movement.product_id}-${movement.variant_id || "null"}-${movement.warehouse_id}`;
        
        if (!inventoryMap.has(key)) {
          const product = products?.find((p) => p.id === movement.product_id);
          const variant = variants?.find((v) => v.id === movement.variant_id);
          
          inventoryMap.set(key, {
            product_id: movement.product_id,
            product_name: product?.name || "",
            product_sku: product?.sku || "",
            variant_id: movement.variant_id,
            variant_name: variant?.name || null,
            warehouse_id: movement.warehouse_id,
            warehouse_name: movement.warehouses?.name || "",
            stock_in: 0,
            stock_out: 0,
            quantity_on_hand: 0,
            cost_per_unit: variant?.cost || product?.cost || 0,
            inventory_value: 0,
            reorder_level: variant?.reorder_level || product?.reorder_level || 0,
          });
        }

        const item = inventoryMap.get(key)!;
        const inTypes = ["OPENING_STOCK", "PURCHASE", "RETURN", "TRANSFER_IN"];
        
        if (inTypes.includes(movement.transaction_type)) {
          item.stock_in += movement.quantity;
          item.quantity_on_hand += movement.quantity;
        } else {
          item.stock_out += movement.quantity;
          item.quantity_on_hand -= movement.quantity;
        }

        item.inventory_value = item.quantity_on_hand * item.cost_per_unit;
      });

      setInventory(Array.from(inventoryMap.values()));
    } catch (error) {
      toast.error("Failed to fetch inventory");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (quantity: number, reorderLevel: number) => {
    if (quantity === 0) return { variant: "danger" as const, label: "Out of Stock" };
    if (quantity <= reorderLevel) return { variant: "warning" as const, label: "Low Stock" };
    return { variant: "success" as const, label: "In Stock" };
  };

  const filteredInventory = inventory.filter(
    (item) =>
      item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.variant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.warehouse_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product_sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory View</h1>
          <p className="text-muted-foreground">
            Real-time calculated inventory levels across all warehouses
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search inventory..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Product</TableHead>
                <TableHead className="whitespace-nowrap">Variant</TableHead>
                <TableHead className="whitespace-nowrap">Warehouse</TableHead>
                <TableHead className="text-right whitespace-nowrap">Stock In</TableHead>
                <TableHead className="text-right whitespace-nowrap">Stock Out</TableHead>
                <TableHead className="text-right whitespace-nowrap">Qty on Hand</TableHead>
                <TableHead className="text-right whitespace-nowrap">Cost/Unit</TableHead>
                <TableHead className="text-right whitespace-nowrap">Inventory Value</TableHead>
                <TableHead className="text-right whitespace-nowrap">Reorder Level</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No inventory data found. Record stock movements to see inventory levels.
                  </TableCell>
                </TableRow>
              ) : (
                filteredInventory.map((item, index) => {
                  const status = getStockStatus(item.quantity_on_hand, item.reorder_level);
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {item.product_name}
                        {item.product_sku && (
                          <span className="text-muted-foreground ml-1">
                            ({item.product_sku})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{item.variant_name || "-"}</TableCell>
                      <TableCell>{item.warehouse_name}</TableCell>
                      <TableCell className="text-right">{item.stock_in}</TableCell>
                      <TableCell className="text-right">{item.stock_out}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {item.quantity_on_hand}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPrice(item.cost_per_unit)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatPrice(item.inventory_value)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.reorder_level}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
