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
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CurrencyDialog } from "@/components/CurrencyDialog";

interface Currency {
  id: string;
  name: string;
  code: string;
  symbol: string;
  exchange_rate: number;
  is_base: boolean;
  is_active: boolean;
}

export default function Currencies() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);

  useEffect(() => {
    fetchCurrencies();

    const channel = supabase
      .channel('currencies-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'currencies'
        },
        () => {
          fetchCurrencies();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCurrencies = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return;

    const { data, error } = await supabase
      .from("currencies")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch currencies");
      console.error(error);
    } else {
      setCurrencies(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("currencies")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete currency");
    } else {
      toast.success("Currency deleted successfully");
    }
  };

  const handleEdit = (currency: Currency) => {
    setSelectedCurrency(currency);
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedCurrency(null);
    setDialogOpen(true);
  };

  const filteredCurrencies = currencies.filter(
    (currency) =>
      currency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      currency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      currency.symbol.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold tracking-tight">Currencies</h1>
          <p className="text-muted-foreground">
            Manage currency settings and exchange rates
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add Currency
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search currencies..."
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
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead className="text-right">Exchange Rate</TableHead>
                <TableHead>Base Currency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCurrencies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No currencies found. Add your first currency to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCurrencies.map((currency) => (
                  <TableRow key={currency.id}>
                    <TableCell className="font-medium">{currency.name}</TableCell>
                    <TableCell>{currency.code}</TableCell>
                    <TableCell>{currency.symbol}</TableCell>
                    <TableCell className="text-right">{currency.exchange_rate}</TableCell>
                    <TableCell>
                      {currency.is_base && <Badge variant="info">Base</Badge>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={currency.is_active ? "success" : "neutral"}>
                        {currency.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(currency)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(currency.id)}
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

      <CurrencyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        currency={selectedCurrency}
      />
    </div>
  );
}
