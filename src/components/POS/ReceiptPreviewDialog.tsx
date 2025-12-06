import { useRef, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReceiptTemplate } from "./ReceiptTemplate";
import { Printer, Settings2 } from "lucide-react";

interface ReceiptItem {
  name: string;
  variant_name?: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface ReceiptData {
  saleNumber: string;
  saleDate: Date;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  customerName?: string;
  cashierName?: string;
  warehouseName?: string;
}

interface ReceiptPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  receiptData: ReceiptData;
}

const RECEIPT_SETTINGS_KEY = "pos_receipt_settings";

interface ReceiptSettings {
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  showLogo: boolean;
  footerMessage: string;
}

const defaultSettings: ReceiptSettings = {
  businessName: "InnoventoryPro",
  businessAddress: "",
  businessPhone: "",
  businessEmail: "",
  showLogo: true,
  footerMessage: "Thank you for your purchase!",
};

export function ReceiptPreviewDialog({
  open,
  onClose,
  receiptData,
}: ReceiptPreviewDialogProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<ReceiptSettings>(defaultSettings);

  useEffect(() => {
    const savedSettings = localStorage.getItem(RECEIPT_SETTINGS_KEY);
    if (savedSettings) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
      } catch (e) {
        console.error("Failed to parse receipt settings", e);
      }
    }
  }, []);

  const saveSettings = (newSettings: ReceiptSettings) => {
    setSettings(newSettings);
    localStorage.setItem(RECEIPT_SETTINGS_KEY, JSON.stringify(newSettings));
  };

  const handlePrint = () => {
    const printContent = document.getElementById("receipt-content");
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups to print the receipt");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${receiptData.saleNumber}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              width: 80mm;
              padding: 10px;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .font-bold { font-weight: bold; }
            .border-t { border-top: 1px dashed #999; }
            .border-b { border-bottom: 1px dashed #999; }
            .py-2 { padding-top: 8px; padding-bottom: 8px; }
            .my-2 { margin-top: 8px; margin-bottom: 8px; }
            .mb-1 { margin-bottom: 4px; }
            .mb-2 { margin-bottom: 8px; }
            .mt-2 { margin-top: 8px; }
            .mt-4 { margin-top: 16px; }
            .pt-1 { padding-top: 4px; }
            .pt-2 { padding-top: 8px; }
            .pb-1 { padding-bottom: 4px; }
            .space-y-1 > * + * { margin-top: 4px; }
            .text-xs { font-size: 10px; }
            .text-sm { font-size: 12px; }
            .text-2xl { font-size: 20px; }
            .text-gray-500 { color: #6b7280; }
            .text-gray-600 { color: #4b5563; }
            .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .capitalize { text-transform: capitalize; }
            .w-16 { width: 64px; }
            .flex-1 { flex: 1; }
            .pr-2 { padding-right: 8px; }
            @media print {
              body { width: 80mm; margin: 0; }
            }
          </style>
        </head>
        <body>
          ${printContent.outerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Receipt Preview
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1">
              <Settings2 className="h-4 w-4" />
              Customize
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="mt-4">
            <div 
              ref={receiptRef}
              className="bg-white rounded-lg shadow-lg overflow-y-auto max-h-[60vh]"
            >
              <ReceiptTemplate
                data={receiptData}
                businessName={settings.businessName}
                businessAddress={settings.businessAddress}
                businessPhone={settings.businessPhone}
                businessEmail={settings.businessEmail}
                showLogo={settings.showLogo}
                footerMessage={settings.footerMessage}
              />
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Business Name</Label>
                <Input
                  value={settings.businessName}
                  onChange={(e) => saveSettings({ ...settings, businessName: e.target.value })}
                  placeholder="Your Business Name"
                />
              </div>

              <div className="space-y-2">
                <Label>Business Address</Label>
                <Textarea
                  value={settings.businessAddress}
                  onChange={(e) => saveSettings({ ...settings, businessAddress: e.target.value })}
                  placeholder="123 Main Street, City, Country"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    value={settings.businessPhone}
                    onChange={(e) => saveSettings({ ...settings, businessPhone: e.target.value })}
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={settings.businessEmail}
                    onChange={(e) => saveSettings({ ...settings, businessEmail: e.target.value })}
                    placeholder="store@example.com"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label>Show Business Name</Label>
                <Switch
                  checked={settings.showLogo}
                  onCheckedChange={(checked) => saveSettings({ ...settings, showLogo: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label>Footer Message</Label>
                <Textarea
                  value={settings.footerMessage}
                  onChange={(e) => saveSettings({ ...settings, footerMessage: e.target.value })}
                  placeholder="Thank you for your purchase!"
                  rows={2}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="border-t border-divider pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Print Receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}