import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileSpreadsheet, FileJson, Loader2 } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import Papa from "papaparse";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: any[]) => Promise<void>;
  title: string;
  description: string;
  templateFields: string[];
}

export function ImportDialog({
  open,
  onOpenChange,
  onImport,
  title,
  description,
  templateFields,
}: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const parseExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const parseCSVFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        complete: (results) => resolve(results.data),
        error: reject,
      });
    });
  };

  const parseJSONFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target?.result as string);
          resolve(Array.isArray(jsonData) ? jsonData : [jsonData]);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file to import");
      return;
    }

    setLoading(true);
    try {
      let data: any[] = [];
      const fileExt = file.name.split(".").pop()?.toLowerCase();

      if (fileExt === "xlsx" || fileExt === "xls") {
        data = await parseExcelFile(file);
      } else if (fileExt === "csv") {
        data = await parseCSVFile(file);
      } else if (fileExt === "json") {
        data = await parseJSONFile(file);
      } else {
        throw new Error("Unsupported file format. Please use Excel, CSV, or JSON.");
      }

      if (!data || data.length === 0) {
        throw new Error("No data found in file");
      }

      await onImport(data);
      toast.success(`Successfully imported ${data.length} records`);
      onOpenChange(false);
      setFile(null);
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error(error.message || "Failed to import data");
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [templateFields.reduce((acc, field) => {
      acc[field] = "";
      return acc;
    }, {} as any)];

    const csv = Papa.unparse(templateData);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "_")}_template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Select File</Label>
            <Input
              id="file"
              type="file"
              accept=".xlsx,.xls,.csv,.json"
              onChange={handleFileChange}
              disabled={loading}
            />
            <p className="text-sm text-text-secondary">
              Supported formats: Excel (.xlsx, .xls), CSV (.csv), JSON (.json)
            </p>
          </div>

          {file && (
            <div className="flex items-center gap-2 p-3 bg-surface-200 rounded-lg">
              {file.name.endsWith(".json") ? (
                <FileJson className="h-5 w-5 text-accent-primary" />
              ) : (
                <FileSpreadsheet className="h-5 w-5 text-accent-primary" />
              )}
              <span className="text-sm font-medium truncate">{file.name}</span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={handleImport} disabled={!file || loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Data
                </>
              )}
            </Button>
            <Button variant="outline" onClick={downloadTemplate} disabled={loading} className="w-full">
              Download CSV Template
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
