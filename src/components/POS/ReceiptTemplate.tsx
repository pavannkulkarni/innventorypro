import { format } from "date-fns";
import { useCurrency } from "@/hooks/useCurrency";

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

interface ReceiptTemplateProps {
  data: ReceiptData;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  showLogo?: boolean;
  footerMessage?: string;
}

export function ReceiptTemplate({
  data,
  businessName = "InnoventoryPro",
  businessAddress = "",
  businessPhone = "",
  businessEmail = "",
  showLogo = true,
  footerMessage = "Thank you for your purchase!",
}: ReceiptTemplateProps) {
  const { formatPrice } = useCurrency();

  return (
    <div 
      id="receipt-content"
      className="bg-white text-black p-6 max-w-[80mm] mx-auto font-mono text-xs"
      style={{ fontFamily: "'Courier New', monospace" }}
    >
      {/* Header */}
      <div className="text-center mb-4">
        {showLogo && (
          <div className="text-2xl font-bold mb-1">{businessName}</div>
        )}
        {businessAddress && <div className="text-xs">{businessAddress}</div>}
        {businessPhone && <div className="text-xs">Tel: {businessPhone}</div>}
        {businessEmail && <div className="text-xs">{businessEmail}</div>}
      </div>

      <div className="border-t border-b border-dashed border-gray-400 py-2 my-2">
        <div className="flex justify-between">
          <span>Receipt #:</span>
          <span className="font-bold">{data.saleNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{format(data.saleDate, "dd/MM/yyyy HH:mm")}</span>
        </div>
        {data.warehouseName && (
          <div className="flex justify-between">
            <span>Store:</span>
            <span>{data.warehouseName}</span>
          </div>
        )}
        {data.cashierName && (
          <div className="flex justify-between">
            <span>Cashier:</span>
            <span>{data.cashierName}</span>
          </div>
        )}
        {data.customerName && (
          <div className="flex justify-between">
            <span>Customer:</span>
            <span>{data.customerName}</span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="py-2">
        <div className="font-bold mb-2 border-b border-gray-300 pb-1">
          <div className="flex justify-between">
            <span className="flex-1">Item</span>
            <span className="w-16 text-right">Amount</span>
          </div>
        </div>
        {data.items.map((item, index) => (
          <div key={index} className="mb-2">
            <div className="flex justify-between">
              <span className="flex-1 truncate pr-2">
                {item.name}
                {item.variant_name && ` (${item.variant_name})`}
              </span>
              <span className="w-16 text-right">{formatPrice(item.line_total)}</span>
            </div>
            <div className="text-gray-500 text-[10px]">
              {item.quantity} x {formatPrice(item.unit_price)}
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-dashed border-gray-400 pt-2 mt-2 space-y-1">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatPrice(data.subtotal)}</span>
        </div>
        {data.tax > 0 && (
          <div className="flex justify-between">
            <span>Tax:</span>
            <span>{formatPrice(data.tax)}</span>
          </div>
        )}
        {data.discount > 0 && (
          <div className="flex justify-between">
            <span>Discount:</span>
            <span>-{formatPrice(data.discount)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-sm border-t border-gray-400 pt-1 mt-1">
          <span>TOTAL:</span>
          <span>{formatPrice(data.total)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Payment:</span>
          <span className="capitalize">{data.paymentMethod}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-4 pt-2 border-t border-dashed border-gray-400">
        <p className="text-xs">{footerMessage}</p>
        <div className="mt-2 text-[10px] text-gray-500">
          Powered by InnoventoryPro
        </div>
      </div>
    </div>
  );
}