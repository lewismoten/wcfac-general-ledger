import * as XLSX from "xlsx";

export type ExportDataType = "number" | "string" | "date" | "currency";
export interface ExportColumn {
  type: ExportDataType,
  width: number,
  pad?: number,
  format?: string
}
export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
export const buildFilenameFromParams = (
  localParams: string,
  prefix: string = "download",
  omitParams: string[] = []
): string => {
  const usp = new URLSearchParams(localParams);
  const omit = new Set(omitParams);

  const entries = Array.from(usp.entries())
    .filter(([k]) => !omit.has(k))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}-${v}`);

  const stamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, "").replace("T", "");
  const base = `${prefix}${entries.length ? "_" + entries.join("_") : ""}[${stamp}]`;

  return base.replace(/[^\]a-z0-9._-]/gi, "_");
}

const parseCsvToAoa = (csv: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const c = csv[i];
    const next = csv[i + 1];

    if (inQuotes) {
      if (c === `"` && next === `"`) {
        cell += `"`;
        i++;
      } else if (c === `"`) {
        inQuotes = false;
      } else {
        cell += c;
      }
    } else {
      if (c === `"`) {
        inQuotes = true;
      } else if (c === ",") {
        row.push(cell);
        cell = "";
      } else if (c === "\r") {
        continue;
      } else if (c === "\n") {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
      } else {
        cell += c;
      }
    }
  }

  row.push(cell);
  rows.push(row);

  if (rows.length && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === "") {
    rows.pop();
  }

  return rows;
}

export async function exportCsvAsXlsx(csvUrl: string, name: string = "Sheet1", xlsxFilename: string, columns: ExportColumn[] = []) {
  const res = await fetch(csvUrl, { credentials: "include" });
  if (!res.ok) throw new Error(`Export failed: ${res.status}`);

  const csvText = await res.text();

  const aoa = parseCsvToAoa(csvText);
  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  if (columns.length !== 0) {
    applyColumnTypes(worksheet, columns, 1);
    worksheet["!cols"] = columns.map(col => ({ wch: col.width ?? 8 }))
  }
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, name);

  const xlsxArrayBuffer = XLSX.write(
    workbook, {
    bookType: "xlsx",
    type: "array",
    cellDates: true
  });

  const blob = new Blob([xlsxArrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  downloadBlob(blob, xlsxFilename);
}

export const parseNumberLike = (input: string): number | null => {
  const s = input.trim();
  if (!s) return null;
  const negative = /^\(.*\)$/.test(s);
  const cleaned = s.replace(/[,$]/g, "").replace(/^\(|\)$/g, "");
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return negative ? -n : n;
}
export const parseDateLike = (input: string): Date | null => {
  const s = input.trim();
  if (!s) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) {
    const y = Number(iso[1]);
    const m = Number(iso[2]) - 1;
    const d = Number(iso[3]);
    const dt = new Date(y, m, d);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  const mmDdYyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s);
  if (mmDdYyyy) {
    const m = Number(mmDdYyyy[1]) - 1;
    const d = Number(mmDdYyyy[2]);
    const y = Number(mmDdYyyy[3]);
    const dt = new Date(y, m, d);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  const yyyyMm = /^(\d{4})\/(\d{2})/.exec(s);
  if (yyyyMm) {
    const m = Number(yyyyMm[1]) - 1;
    const y = Number(yyyyMm[0]);
    const dt = new Date(y, m, 1);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  const dt = new Date(s);
  return Number.isNaN(dt.getTime()) ? null : dt;
}
export const applyColumnTypes = (
  ws: XLSX.WorkSheet,
  columns: ExportColumn[],
  headerRows = 1
) => {
  const ref = ws["!ref"];
  if (!ref) return;

  const range = XLSX.utils.decode_range(ref);

  for (let r = range.s.r + headerRows; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const type = columns[c].type ?? "string";
      const pad = columns[c].pad ?? 0;
      const format = columns[c].format ?? "m/d/yy";
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[addr];
      if (!cell || cell.v == null) continue;

      const raw = String(cell.v);

      if (type === "string") {
        cell.t = "s";
        cell.v = raw;
        continue;
      }

      if (type === "number") {
        const n = parseNumberLike(raw);
        if (n == null) continue;
        cell.t = "n";
        cell.v = n;
        if (pad > 1) {
          cell.z = "0".repeat(pad)
        }
        continue;
      }

      if (type === "currency") {
        const n = parseNumberLike(raw);
        if (n == null) continue;
        cell.t = "n";
        cell.v = n;
        cell.z = '$#,##0.00;[Red]($#,##0.00)';
        continue;
      }

      if (type === "date") {
        const d = parseDateLike(raw);
        if (!d) continue;
        cell.t = "d";
        cell.v = d;
        cell.z = format ?? "m/d/yy";
        continue;
      }
    }
  }
}