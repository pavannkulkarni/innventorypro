import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CustomerDialog } from "@/components/CustomerDialog";
import { useCurrency } from "@/hooks/useCurrency";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Edit, Trash2, Users } from "lucide-react";

interface CustomersDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
}

export function CustomersDialog({ open, onClose, userId }: CustomersDialogProps) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const { formatPrice } = useCurrency();
  const { toast } = useToast();

  useEffect(() => {
    if (open && userId) {
      fetchCustomers();
    }
  }, [open, userId]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("user_id", userId)
        .order("name");

      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;

    try {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Customer deleted successfully" });
      fetchCustomers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Customers
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <Users className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              onClick={() => {
                setSelectedCustomer(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </div>

          <ScrollArea className="h-[420px]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-text-secondary">Loading customers...</p>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Users className="h-10 w-10 text-text-faint mb-3" />
                <p className="text-text-secondary">No customers found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCustomers.map((customer) => (
                  <Card key={customer.id} className="p-4 bg-surface-100 border border-divider">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-text-primary">{customer.name}</h3>
                        {customer.email && (
                          <p className="text-sm text-text-secondary">{customer.email}</p>
                        )}
                        {customer.phone && (
                          <p className="text-sm text-text-secondary">{customer.phone}</p>
                        )}
                      </div>
                      {customer.is_active ? (
                        <Badge className="bg-success/20 text-success">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">Credit Balance:</span>
                        <span className={customer.credit_balance > 0 ? "text-danger font-semibold" : "text-text-primary"}>
                          {formatPrice(customer.credit_balance)}
                        </span>
                      </div>
                      {customer.credit_limit > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-text-secondary">Credit Limit:</span>
                          <span className="text-text-primary">{formatPrice(customer.credit_limit)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(customer.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <CustomerDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          customer={selectedCustomer}
          onSuccess={fetchCustomers}
        />
      </DialogContent>
    </Dialog>
  );
}
