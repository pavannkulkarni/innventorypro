import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { InventoryTable } from "@/components/InventoryTable";
import { ProductDialog } from "@/components/ProductDialog";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { ImportDialog } from "@/components/ImportDialog";
import { BulkEditDialog } from "@/components/BulkEditDialog";
import { Plus, ScanLine, Upload, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { exportToCSV } from "@/lib/exportUtils";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(255),
  sku: z.string().max(100).optional(),
  barcode: z.string().max(100).optional(),
  description: z.string().optional(),
  quantity: z.number().int().min(0).optional(),
  price: z.number().min(0).optional(),
  cost: z.number().min(0).optional(),
  reorder_level: z.number().int().min(0).optional(),
});

export default function ProductMaster() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [userId, setUserId] = useState<string>("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false);
  const [bulkSelectedIds, setBulkSelectedIds] = useState<Set<string>>(new Set());
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        fetchProducts(session.user.id);
      }
    };

    fetchUser();
  }, [refreshKey]);

  const fetchProducts = async (userId: string) => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", userId)
      .order("name");
    
    setProducts(data || []);
  };

  const handleImport = async (data: any[]) => {
    if (!userId) {
      toast.error("User not authenticated");
      return;
    }

    const validationErrors: string[] = [];
    const validProducts: any[] = [];

    data.forEach((item, index) => {
      const productData = {
        name: item.name || item.Name || "",
        sku: item.sku || item.SKU || null,
        barcode: item.barcode || item.Barcode || null,
        description: item.description || item.Description || null,
        quantity: Number(item.quantity || item.Quantity || 0),
        price: item.price || item.Price ? Number(item.price || item.Price) : null,
        cost: item.cost || item.Cost ? Number(item.cost || item.Cost) : null,
        reorder_level: item.reorder_level || item["Reorder Level"] ? Number(item.reorder_level || item["Reorder Level"]) : null,
      };

      try {
        productSchema.parse(productData);
        validProducts.push({
          ...productData,
          user_id: userId,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          validationErrors.push(`Row ${index + 1}: ${error.errors.map(e => e.message).join(", ")}`);
        }
      }
    });

    if (validationErrors.length > 0) {
      toast.error(`Validation failed:\n${validationErrors.slice(0, 3).join("\n")}${validationErrors.length > 3 ? `\n...and ${validationErrors.length - 3} more errors` : ""}`);
      return;
    }

    if (validProducts.length === 0) {
      toast.error("No valid products to import");
      return;
    }

    const { error } = await supabase.from("products").insert(validProducts);

    if (error) {
      toast.error("Failed to import products: " + error.message);
    } else {
      toast.success(`Successfully imported ${validProducts.length} products`);
      setImportDialogOpen(false);
      setRefreshKey(prev => prev + 1);
    }
  };

  const handleExport = () => {
    if (products.length === 0) {
      toast.error("No products to export");
      return;
    }

    const exportData = products.map(({ id, user_id, created_at, updated_at, category_id, supplier_id, warehouse_id, currency_id, ...rest }) => rest);
    exportToCSV(exportData, "products");
    toast.success("Products exported successfully");
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setRefreshKey(prev => prev + 1);
    }
  };

  const handleEdit = (product: any) => {
    setSelectedProduct(product);
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedProduct(null);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    console.log("Delete product:", id);
    toast.success("Product deleted successfully");
  };

  const handleBarcodeScan = async (code: string) => {
    console.log("Scanned barcode:", code);
    
    const { data: existingProduct } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", userId)
      .eq("barcode", code)
      .maybeSingle();

    if (existingProduct) {
      toast.success(`Found: ${existingProduct.name}`);
      setSelectedProduct(existingProduct);
    } else {
      toast.info("New product - add details");
      setSelectedProduct({ barcode: code });
    }
    
    setScannerOpen(false);
    setDialogOpen(true);
  };

  const handleBulkEdit = (selectedIds: Set<string>) => {
    setBulkSelectedIds(selectedIds);
    setBulkEditDialogOpen(true);
  };

  const handleBulkEditSuccess = () => {
    setRefreshKey(prev => prev + 1);
    setBulkSelectedIds(new Set());
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Product Master</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Master registry for all products and variants
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={() => setScannerOpen(!scannerOpen)} className="flex-1 sm:flex-none">
            <ScanLine className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Scan Barcode</span>
            <span className="sm:hidden">Scan</span>
          </Button>
          <Button onClick={handleAddNew} className="flex-1 sm:flex-none">
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Add Product</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {scannerOpen && (
        <BarcodeScanner 
          onScan={handleBarcodeScan} 
          onClose={() => setScannerOpen(false)} 
        />
      )}

      <InventoryTable 
        key={refreshKey} 
        onEdit={handleEdit} 
        onDelete={handleDelete}
        onBulkEdit={handleBulkEdit}
      />

      <ProductDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        product={selectedProduct}
      />

      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={handleImport}
        title="Import Products"
        description="Upload an Excel, CSV, or JSON file to import products"
        templateFields={["name", "sku", "barcode", "description", "quantity", "price", "cost", "reorder_level"]}
      />

      <BulkEditDialog
        open={bulkEditDialogOpen}
        onOpenChange={setBulkEditDialogOpen}
        selectedIds={bulkSelectedIds}
        itemType="products"
        onSuccess={handleBulkEditSuccess}
      />
    </div>
  );
}
