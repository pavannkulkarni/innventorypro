import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { StockMovementDialog } from "@/components/StockMovementDialog";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export default function StockMovements() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<any>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovements();

    const channel = supabase
      .channel("stock-movements-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stock_movements",
        },
        () => {
          fetchMovements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMovements = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("stock_movements")
      .select(`
        *,
        products(name, sku),
        product_variants(name, sku),
        warehouses(name, code)
      `)
      .eq("user_id", session.user.id)
      .order("transaction_date", { ascending: false });

    if (error) {
      toast.error("Failed to fetch stock movements");
      console.error(error);
    } else {
      setMovements(data || []);
    }
    setLoading(false);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setSelectedMovement(null);
    }
  };

  const handleEdit = (movement: any) => {
    setSelectedMovement(movement);
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedMovement(null);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("stock_movements")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete stock movement");
    } else {
      toast.success("Stock movement deleted successfully");
    }
  };

  const getTransactionBadgeVariant = (type: string) => {
    const inTypes = ["OPENING_STOCK", "PURCHASE", "RETURN", "TRANSFER_IN"];
    return inTypes.includes(type) ? "success" : "danger";
  };

  const formatTransactionType = (type: string) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const filteredMovements = movements.filter(
    (movement) =>
      movement.products?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.product_variants?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.transaction_type?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold tracking-tight">Stock Movements</h1>
          <p className="text-muted-foreground">
            Track all inventory transactions and movements
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          Record Movement
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search movements..."
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
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMovements.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No stock movements found. Record your first movement to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredMovements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      {format(new Date(movement.transaction_date), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell className="font-medium">
                      {movement.products?.name || "-"}
                    </TableCell>
                    <TableCell>
                      {movement.product_variants?.name || "-"}
                    </TableCell>
                    <TableCell>
                      {movement.warehouses?.name || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getTransactionBadgeVariant(
                          movement.transaction_type
                        )}
                      >
                        {formatTransactionType(movement.transaction_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {movement.quantity}
                    </TableCell>
                    <TableCell>{movement.reference_number || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(movement)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(movement.id)}
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

      <StockMovementDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        movement={selectedMovement}
        onSuccess={fetchMovements}
      />
    </div>
  );
}
