import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Eye, CheckCircle, XCircle, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PurchaseOrderDialog } from "@/components/PurchaseOrderDialog";
import { ReceivePODialog } from "@/components/ReceivePODialog";
import { useCurrency } from "@/hooks/useCurrency";
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

export default function PurchaseOrders() {
  const { formatPrice } = useCurrency();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");

  useEffect(() => {
    fetchPurchaseOrders();

    const channel = supabase
      .channel("purchase-orders-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "purchase_orders",
        },
        () => {
          fetchPurchaseOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPurchaseOrders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("purchase_orders")
      .select(`
        *,
        suppliers(name, code),
        warehouses(name, code)
      `)
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch purchase orders");
      console.error(error);
    } else {
      setPurchaseOrders(data || []);
    }
    setLoading(false);
  };

  const handleSubmitForApproval = async (po: any) => {
    const { error } = await supabase
      .from("purchase_orders")
      .update({ status: "PENDING_APPROVAL" })
      .eq("id", po.id);

    if (error) {
      toast.error("Failed to submit for approval");
    } else {
      toast.success("Purchase order submitted for approval");
      fetchPurchaseOrders();
    }
  };

  const handleApprovalAction = async () => {
    if (!selectedPO) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const newStatus = actionType === "approve" ? "APPROVED" : "REJECTED";
    
    const updateData: any = { status: newStatus };
    if (actionType === "approve") {
      updateData.approved_by = session.user.id;
      updateData.approved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("purchase_orders")
      .update(updateData)
      .eq("id", selectedPO.id);

    if (error) {
      toast.error(`Failed to ${actionType} purchase order`);
    } else {
      toast.success(`Purchase order ${actionType === "approve" ? "approved" : "rejected"} successfully`);
      fetchPurchaseOrders();
    }
    
    setApprovalDialogOpen(false);
    setSelectedPO(null);
  };

  const openApprovalDialog = (po: any, action: "approve" | "reject") => {
    setSelectedPO(po);
    setActionType(action);
    setApprovalDialogOpen(true);
  };

  const handleEdit = (po: any) => {
    setSelectedPO(po);
    setDialogOpen(true);
  };

  const handleReceive = (po: any) => {
    setSelectedPO(po);
    setReceiveDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedPO(null);
    setDialogOpen(true);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "neutral";
      case "PENDING_APPROVAL":
        return "warning";
      case "APPROVED":
        return "info";
      case "REJECTED":
      case "CANCELLED":
        return "danger";
      case "PARTIALLY_RECEIVED":
        return "warning";
      case "RECEIVED":
        return "success";
      default:
        return "neutral";
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ");
  };

  const filteredPOs = purchaseOrders.filter((po) => {
    const matchesSearch =
      po.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.suppliers?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Purchase Orders
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage purchase orders and vendor relationships
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          Create PO
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search purchase orders..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="PARTIALLY_RECEIVED">Partially Received</SelectItem>
            <SelectItem value="RECEIVED">Received</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-[var(--border-radius-md)] border border-divider bg-surface-100 shadow-elevation-1 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Number</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPOs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No purchase orders found. Create your first PO to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredPOs.map((po) => (
                <TableRow key={po.id}>
                  <TableCell className="font-medium">{po.po_number}</TableCell>
                  <TableCell>
                    {po.suppliers?.name || "-"}
                    {po.suppliers?.code && (
                      <span className="text-muted-foreground text-sm">
                        {" "}({po.suppliers.code})
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{po.warehouses?.name || "-"}</TableCell>
                  <TableCell>
                    {new Date(po.order_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPrice(po.total_amount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(po.status)}>
                      {formatStatus(po.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {po.status === "DRAFT" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(po)}
                            title="Edit"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSubmitForApproval(po)}
                            title="Submit for Approval"
                          >
                            Submit
                          </Button>
                        </>
                      )}
                      {po.status === "PENDING_APPROVAL" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openApprovalDialog(po, "approve")}
                            title="Approve"
                          >
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openApprovalDialog(po, "reject")}
                            title="Reject"
                          >
                            <XCircle className="h-4 w-4 text-red-600" />
                          </Button>
                        </>
                      )}
                      {(po.status === "APPROVED" || po.status === "PARTIALLY_RECEIVED") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleReceive(po)}
                          title="Receive Goods"
                        >
                          <Package className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PurchaseOrderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        purchaseOrder={selectedPO}
        onSuccess={fetchPurchaseOrders}
      />

      <ReceivePODialog
        open={receiveDialogOpen}
        onOpenChange={setReceiveDialogOpen}
        purchaseOrder={selectedPO}
        onSuccess={fetchPurchaseOrders}
      />

      <AlertDialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "approve" ? "Approve" : "Reject"} Purchase Order
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {actionType} PO {selectedPO?.po_number}?
              {actionType === "approve"
                ? " This will allow the order to be received."
                : " This action will mark the order as rejected."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprovalAction}>
              {actionType === "approve" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
