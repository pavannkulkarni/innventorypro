import { useState } from "react";
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
import { Pencil, Trash2, Search } from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  price: number;
  status: "in-stock" | "low-stock" | "out-of-stock";
}

const mockProducts: Product[] = [
  { id: "1", name: "Wireless Mouse", sku: "WM-001", category: "Electronics", quantity: 150, price: 29.99, status: "in-stock" },
  { id: "2", name: "USB-C Cable", sku: "UC-002", category: "Accessories", quantity: 8, price: 12.99, status: "low-stock" },
  { id: "3", name: "Laptop Stand", sku: "LS-003", category: "Furniture", quantity: 0, price: 45.99, status: "out-of-stock" },
  { id: "4", name: "Mechanical Keyboard", sku: "MK-004", category: "Electronics", quantity: 75, price: 89.99, status: "in-stock" },
  { id: "5", name: "Webcam HD", sku: "WC-005", category: "Electronics", quantity: 45, price: 59.99, status: "in-stock" },
  { id: "6", name: "Desk Lamp", sku: "DL-006", category: "Furniture", quantity: 12, price: 34.99, status: "low-stock" },
  { id: "7", name: "Monitor 27\"", sku: "MN-007", category: "Electronics", quantity: 28, price: 299.99, status: "in-stock" },
  { id: "8", name: "Ergonomic Chair", sku: "EC-008", category: "Furniture", quantity: 5, price: 249.99, status: "low-stock" },
];

function getStatusVariant(status: Product["status"]): "default" | "secondary" | "destructive" {
  switch (status) {
    case "in-stock":
      return "default";
    case "low-stock":
      return "secondary";
    case "out-of-stock":
      return "destructive";
  }
}

function getStatusLabel(status: Product["status"]): string {
  switch (status) {
    case "in-stock":
      return "In Stock";
    case "low-stock":
      return "Low Stock";
    case "out-of-stock":
      return "Out of Stock";
  }
}

interface InventoryTableProps {
  onEdit?: (product: Product) => void;
  onDelete?: (id: string) => void;
}

export function InventoryTable({ onEdit, onDelete }: InventoryTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = mockProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.sku}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell className="text-right">{product.quantity}</TableCell>
                <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(product.status)}>
                    {getStatusLabel(product.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit?.(product)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete?.(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
