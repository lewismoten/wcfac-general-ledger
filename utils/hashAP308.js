// hashAP308.js
// Usage: node hashAP308.js 26-117
// Reads:  ./data/<folder>/clean_csv/*.csv
// Writes: ./data/<folder>/hashed/*.json

import { readdir, readFile, writeFile, mkdir } from "fs/promises";
import { join, extname, basename, resolve } from "path";
import { parse } from "csv-parse/sync";
import crypto from "crypto";

const CSV_INVOICE_NO = "INVOICE NO.";
const CSV_CHECK_NO = "CHECK NO.";
const CSV_VENDOR_NO = "VEND. NO.";
const CSV_BATCH = "BATCH";

function sha256Hex(input) {
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}

function stripUtf8Bom(s) {
  return s && s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

function normalizeText(s) {
  return stripUtf8Bom(String(s ?? ""))
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
}

function normCell(v) {
  // Conservative normalization (keeps meaning, removes noise)
  let s = String(v ?? "").trim();
  // collapse internal whitespace
  s = s.replace(/\s+/g, " ");
  return s;
}

function normKeyCell(v) {
  // For anchor fields: slightly stronger normalization
  // (uppercasing avoids case-induced key changes)
  return normCell(v).toUpperCase();
}

function getIndexMap(headers) {
  const map = new Map();
  headers.forEach((h, idx) => {
    map.set(normCell(h).toUpperCase(), idx);
  });
  return map;
}

function safeGet(row, idx) {
  if (idx === undefined || idx === null) return "";
  return row[idx] ?? "";
}

function canonicalRowString(headers, row) {
  // Canonicalize all columns in header order: "HEADER=VALUE" joined with unit separator
  // Using a low-collision delimiter to avoid ambiguity.
  const US = "\u001f";
  const parts = headers.map((h, i) => `${normCell(h)}=${normCell(row[i])}`);
  return parts.join(US);
}

async function hashFolder(folderName) {
  if (!folderName) {
    throw new Error("Missing folder name. Example: node hashAP308.js 26-117");
  }

  const baseDir = resolve(process.cwd(), "data", folderName);
  const inDir = join(baseDir, "clean_csv");
  const outDir = join(baseDir, "hashed");

  await mkdir(outDir, { recursive: true });

  const files = await readdir(inDir);
  const csvFiles = files.filter((f) => {
    if (f.startsWith("._")) return false;
    return extname(f).toLowerCase() === ".csv";
  });

  console.log(`Input:  ${inDir}`);
  console.log(`Output: ${outDir}`);
  console.log(`Found ${csvFiles.length} CSV file(s).`);
  if (csvFiles.length === 0) return;

  for (const file of csvFiles) {
    const inPath = join(inDir, file);
    const raw = await readFile(inPath, "utf8");
    const normalized = normalizeText(raw);

    // Parse as rows (arrays) so we can control header mapping.
    const rows = parse(normalized, {
      relax_column_count: true,
      skip_empty_lines: true,
    });

    if (!rows.length) {
      console.log(`⚠️  ${file}: empty, skipping.`);
      continue;
    }

    const headers = rows[0].map((h) => normCell(h));
    const idxMap = getIndexMap(headers);

    // Anchor field names (case-insensitive).
    const idxVendor = idxMap.get(CSV_VENDOR_NO);
    const idxInvoice = idxMap.get(CSV_INVOICE_NO);
    const idxCheck = idxMap.get(CSV_CHECK_NO);
    const idxBatch = idxMap.get(CSV_BATCH);

    const dataRows = rows.slice(1);

    const out = {
      source_folder: folderName,
      source_file: file,
      generated_at: new Date().toISOString(),
      anchor_fields: [CSV_VENDOR_NO, CSV_INVOICE_NO, CSV_CHECK_NO, CSV_BATCH],
      missing_anchor_columns: [],
      rows: [],
    };

    if (idxVendor === undefined) out.missing_anchor_columns.push(CSV_VENDOR_NO);
    if (idxInvoice === undefined) out.missing_anchor_columns.push(CSV_INVOICE_NO);
    if (idxCheck === undefined) out.missing_anchor_columns.push(CSV_CHECK_NO);
    if (idxBatch === undefined) out.missing_anchor_columns.push(CSV_BATCH);

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];

      const vendorNo = normKeyCell(safeGet(row, idxVendor));
      const invoiceNo = normKeyCell(safeGet(row, idxInvoice));
      const checkNo = normKeyCell(safeGet(row, idxCheck));
      const batch = normKeyCell(safeGet(row, idxBatch));

      // Anchor is exactly the fields you specified, in a fixed order.
      // Use an unambiguous delimiter so concatenation cannot collide.
      const US = "\u001f";
      const anchorString = [vendorNo, invoiceNo, checkNo, batch].join(US);
      const anchorHash = sha256Hex(anchorString);

      // Content hash: canonicalize entire row with headers in order
      const contentString = canonicalRowString(headers, row);
      const contentHash = sha256Hex(contentString);

      out.rows.push({
        source_row_num: i + 2, // +2 because row 1 is header, and humans count from 1
        anchor: {
          VENDOR_NO: vendorNo,
          INVOICE_NO: invoiceNo,
          CHECK_NO: checkNo,
          BATCH: batch,
        },
        anchor_hash: anchorHash,
        content_hash: contentHash,
      });
    }

    const outPath = join(outDir, `${basename(file, ".csv")}.json`);
    await writeFile(outPath, JSON.stringify(out, null, 2), "utf8");
    console.log(`✅ ${file} -> hashed/${basename(outPath)} (${out.rows.length} row(s))`);
  }

  console.log("Done.");
}

hashFolder(process.argv[2]).catch((err) => {
  console.error("❌ Error:", err?.message ?? err);
  process.exitCode = 1;
});
