import Papa from "papaparse";

export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  fields?: string[]
) {
  if (!data || data.length === 0) {
    throw new Error("No data to export");
  }

  // If specific fields are provided, filter the data
  const exportData = fields
    ? data.map((item) =>
        fields.reduce((acc, field) => {
          acc[field] = item[field];
          return acc;
        }, {} as any)
      )
    : data;

  const csv = Papa.unparse(exportData);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
