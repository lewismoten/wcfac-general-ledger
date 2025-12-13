import { useMemo, type MouseEventHandler } from "react";
import { buildFilenameFromParams, downloadBlob, exportCsvAsXlsx, type ExportColumn } from "./exportUtils";


interface ExportDataProps {
  total: number,
  localParams: string
}
const LedgerTypes: ExportColumn[] = [
  { type: "number", width: 8, pad: 7 }, // po no
  { type: "number", width: 8, pad: 6 }, // vend no
  { type: "string", width: 27 }, // vend name
  { type: "string", width: 16 }, // invoice no
  { type: "date", width: 13, format: 'mm/dd/yyyyyy' }, // invoice date
  { type: "string", width: 22 }, // account no
  { type: "date", width: 12, format: 'yyyyyy/mm' }, // account pd
  { type: "currency", width: 12 }, // net amount
  { type: "number", width: 10, pad: 6 }, // check no
  { type: "date", width: 11, format: 'mm/dd/yyyyyy' }, // check date
  { type: "string", width: 27 }, // description
  { type: "number", width: 7, pad: 5 }, // batch
]

export const ExportData = ({ total, localParams }: ExportDataProps) => {
  const csvUrl = useMemo(() => `/api/export-csv.php?${localParams}`, [localParams]);
  const base = buildFilenameFromParams(localParams, 'ledger', ["pg", "ps", "series"]);

  const handleCsvClick: MouseEventHandler<HTMLButtonElement> = useMemo(() => async (_event) => {
    const res = await fetch(csvUrl, { credentials: "include" });
    if (!res.ok) throw new Error(`CSV download failed: ${res.status}`);
    const blob = await res.blob();
    downloadBlob(blob, `${base}.csv`);
  }, [csvUrl]);

  const handleXlsxClick: MouseEventHandler<HTMLButtonElement> = useMemo(() => async (_event) => {
    return exportCsvAsXlsx(csvUrl, "Ledger", `${base}.xlsx`, LedgerTypes)
      .catch(err => {
        console.error(err);
        alert('Export failed');
      });
  }, [csvUrl]);

  return (
    <>
      Entries: {total}.
      Download
      <button onClick={handleCsvClick}>CSV</button>
      or
      <button onClick={handleXlsxClick}>XLSX</button>
    </>
  );
}