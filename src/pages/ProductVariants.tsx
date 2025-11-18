import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { Search, Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProductVariantDialog } from "@/components/ProductVariantDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Variant {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  quantity: number;
  price: number | null;
  cost: number | null;
  attributes: any;
  is_active: boolean;
}

interface Product {
  id: string;
  name: string;
}

export default function ProductVariants() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [variants, setVariants] = useState<Variant[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [variantToDelete, setVariantToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (productId) {
      fetchProduct();
      fetchVariants();

      const channel = supabase
        .channel("variants-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "product_variants",
            filter: `product_id=eq.${productId}`,
          },
          () => {
            fetchVariants();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [productId]);

  const fetchProduct = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !productId) return;

    const { data, error } = await supabase
      .from("products")
      .select("id, name")
      .eq("id", productId)
      .eq("user_id", session.user.id)
      .single();

    if (error) {
      toast.error("Failed to fetch product");
      navigate("/inventory");
    } else {
      setProduct(data);
    }
  };

  const fetchVariants = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !productId) return;

    const { data, error } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", productId)
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch variants");
      console.error(error);
    } else {
      setVariants(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!variantToDelete) return;

    const { error } = await supabase
      .from("product_variants")
      .delete()
      .eq("id", variantToDelete);

    if (error) {
      toast.error("Failed to delete variant");
    } else {
      toast.success("Variant deleted successfully");
      setVariants(variants.filter((v) => v.id !== variantToDelete));
    }
    setDeleteDialogOpen(false);
    setVariantToDelete(null);
  };

  const handleEdit = (variant: Variant) => {
    setSelectedVariant(variant);
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedVariant(null);
    setDialogOpen(true);
  };

  const confirmDelete = (id: string) => {
    setVariantToDelete(id);
    setDeleteDialogOpen(true);
  };

  const filteredVariants = variants.filter(
    (variant) =>
      variant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      variant.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      variant.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/inventory")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">
              Product Variants
            </h1>
          </div>
          {product && (
            <p className="text-muted-foreground">
              Manage variants for: {product.name}
            </p>
          )}
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add Variant
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search variants..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-[var(--border-radius-md)] border border-divider bg-surface-100 shadow-elevation-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>Attributes</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVariants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No variants found. Add your first variant to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredVariants.map((variant) => (
                  <TableRow key={variant.id}>
                    <TableCell className="font-medium">{variant.name}</TableCell>
                    <TableCell>{variant.sku || "-"}</TableCell>
                    <TableCell>{variant.barcode || "-"}</TableCell>
                    <TableCell>
                      {variant.attributes && typeof variant.attributes === 'object' && Object.keys(variant.attributes).length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(variant.attributes as Record<string, string>).map(([key, value]) => (
                            <Badge key={key} variant="outline" className="text-xs">
                              {key}: {value}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right">{variant.quantity}</TableCell>
                    <TableCell className="text-right">
                      {variant.price ? `$${variant.price.toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {variant.cost ? `$${variant.cost.toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={variant.is_active ? "success" : "neutral"}>
                        {variant.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(variant)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => confirmDelete(variant.id)}
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

      {productId && (
        <ProductVariantDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          productId={productId}
          variant={selectedVariant}
          onSuccess={fetchVariants}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this variant. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
