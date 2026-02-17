// cleanAP308.js
// Usage: node cleanAP308.js 26-117
// Reads:  ./data/<folder>/*.csv
// Writes: ./data/<folder>/clean_csv/*.csv

import { readdir, readFile, writeFile, mkdir } from "fs/promises";
import { join, extname, basename, resolve } from "path";
import { parse } from "csv-parse/sync";

function stripUtf8Bom(s) {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

function normalizeText(s) {
  // Remove BOM, normalize line endings, remove null bytes
  return stripUtf8Bom(String(s))
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
}

function isRowEmpty(row) {
  return row.every((cell) => String(cell ?? "").trim() === "");
}

function csvEscape(cell) {
  const s = String(cell ?? "");
  // Quote only if needed
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowsToCsv(rows) {
  return rows.map((row) => row.map(csvEscape).join(",")).join("\n") + "\n";
}

async function cleanFolder(folderName) {
  if (!folderName) {
    throw new Error("Missing folder name. Example: node cleanAP308.js 26-117");
  }

  const baseDir = resolve(process.cwd(), "data", folderName);
  const outDir = join(baseDir, "clean_csv");

  await mkdir(outDir, { recursive: true });

  const files = await readdir(baseDir);
  const csvFiles = files.filter((f) => {
    if (f.startsWith("._")) return false; // macOS metadata files
    if (f === "clean_csv") return false;
    if (extname(f).toLowerCase() !== ".csv") return false;
    return true;
  });

  console.log(`Folder: ${baseDir}`);
  console.log(`Found ${csvFiles.length} CSV file(s).`);
  if (csvFiles.length === 0) return;

  for (const file of csvFiles) {
    const inPath = join(baseDir, file);

    // Avoid re-processing outputs if someone accidentally points at a folder with nested files
    if (inPath.includes(`${join(baseDir, "clean_csv")}`)) continue;

    const raw = await readFile(inPath, "utf8");
    const normalized = normalizeText(raw);

    // Parse -> clean cells -> drop empty rows -> normalize column count -> write
    const rawRows = parse(normalized, {
      relax_column_count: true,
      skip_empty_lines: false, // we’ll handle empties ourselves
    });

    const cleanedRows = rawRows
      .map((row) => (row ?? []).map((cell) => String(cell ?? "").trim()))
      .filter((row) => row.length > 0)
      .filter(row => row[0] !== 'AP308' && row[0] !== '')
      .filter((row) => !isRowEmpty(row));

    // First two rows are a header - combine them into the second row
    cleanedRows[1] = cleanedRows[0].map((cell, i) => [cell, cleanedRows[1][i]].join(' ').trim());
    // remove that first row
    cleanedRows.shift();

    const maxCols = cleanedRows.reduce((m, row) => Math.max(m, row.length), 0);
    const normalizedRows = cleanedRows.map((row) => {
      if (row.length === maxCols) return row;
      return [...row, ...Array(maxCols - row.length).fill("")];
    });

    const outCsv = rowsToCsv(normalizedRows);
    const outPath = join(outDir, basename(file));

    await writeFile(outPath, outCsv, "utf8");
    console.log(`✅ ${file} -> clean_csv/${basename(file)} (${normalizedRows.length} row(s), ${maxCols} col(s))`);
  }

  console.log("Done.");
}

cleanFolder(process.argv[2]).catch((err) => {
  console.error("❌ Error:", err?.message ?? err);
  process.exitCode = 1;
});
