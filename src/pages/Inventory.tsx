import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InventoryTable } from "@/components/InventoryTable";
import { ProductDialog } from "@/components/ProductDialog";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { Plus, ScanLine } from "lucide-react";
import { toast } from "sonner";

export default function Inventory() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

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

  const handleBarcodeScan = (code: string) => {
    console.log("Scanned barcode:", code);
    // In a real app, you would look up the product by barcode
    // For now, we'll just show a toast and open the add product dialog
    toast.info(`Looking up product with barcode: ${code}`);
    
    // Simulate product lookup
    setTimeout(() => {
      setSelectedProduct({
        id: "",
        name: "",
        sku: code,
        category: "",
        quantity: 0,
        price: 0,
      });
      setScannerOpen(false);
      setDialogOpen(true);
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            Manage your product inventory
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

      <InventoryTable onEdit={handleEdit} onDelete={handleDelete} />

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={selectedProduct}
      />
    </div>
  );
}
