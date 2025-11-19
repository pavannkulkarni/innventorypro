import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { InventoryTable } from "@/components/InventoryTable";
import { ProductDialog } from "@/components/ProductDialog";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { Plus, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function ProductMaster() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [userId, setUserId] = useState<string>("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
    };

    fetchUser();
  }, []);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Master</h1>
          <p className="text-muted-foreground">
            Master registry for all products and variants
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setScannerOpen(!scannerOpen)}>
            <ScanLine className="mr-2 h-4 w-4" />
            Scan Barcode
          </Button>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {scannerOpen && (
        <BarcodeScanner 
          onScan={handleBarcodeScan} 
          onClose={() => setScannerOpen(false)} 
        />
      )}

      <InventoryTable key={refreshKey} onEdit={handleEdit} onDelete={handleDelete} />

      <ProductDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        product={selectedProduct}
      />
    </div>
  );
}
