#!/usr/bin/env node
/**
 * upload_ap308_folder.mjs
 *
 * Reads config.json (sibling to this script) for:
 *   { "api": "https://example.com/api/" }
 *
 * Then scans:
 *   ./data/<sourceFolder>/clean_csv/*.csv
 *
 * For each CSV file:
 *  - Parses with csv-parse
 *  - Normalizes fields (trim, date -> YYYY-MM-DD, money -> fixed 2 decimals)
 *  - Deterministically sorts rows so stable_row_num is reproducible
 *  - Computes:
 *      anchor_hash   = sha256(vend_no|invoice_no|check_no|batch)
 *      content_hash  = sha256(all normalized columns in fixed order)
 *      source_row_key= sha256(source_folder|source_file|stable_row_num)
 *  - Uploads in chunks to:
 *      POST /import/ap308/check
 *      POST /import/ap308/lines/upsert
 *
 * Usage:
 *   node upload_ap308_folder.mjs --folder 26-117
 *
 * Optional:
 *   --chunk 1000        rows per API call (default 1000)
 *   --sort none         disable deterministic sort (default "default")
 *   --dry-run           no HTTP calls
 *   --continue-on-error keep going if one file fails
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";

// ------------------------- Resolve config.json -------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.resolve(__dirname, "../config.json");
if (!fs.existsSync(configPath)) {
  console.error(`config.json not found at: ${configPath}`);
  process.exit(1);
}

let config;
try {
  config = JSON.parse(fs.readFileSync(configPath, "utf8"));
} catch (e) {
  console.error(`Failed to parse config.json: ${e?.message || e}`);
  process.exit(1);
}

if (!config.api || typeof config.api !== "string") {
  console.error('config.json must contain: { "api": "https://example.com/api/" }');
  process.exit(1);
}

const API_BASE = config.api.replace(/\/+$/, "") + "/";

const CHECK_URL = API_BASE + "import/ap308/check.php";
const LINES_URL = API_BASE + "import/ap308/lines/upsert.php";

// ------------------------- CLI -------------------------

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const k = a.slice(2);
    const v = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
    out[k] = v;
  }
  return out;
}

const args = parseArgs(process.argv);

const sourceFolder = String(args.folder || "").trim();
const chunkSize = Number(args.chunk || 1000);
const sortMode = String(args.sort || "default"); // default|none
const dryRun = !!args["dry-run"];
const continueOnError = !!args["continue-on-error"];

if (!sourceFolder) {
  console.error("Missing --folder (e.g. 26-117)");
  process.exit(1);
}

// ------------------------- Helpers -------------------------

function sha256hex(s) {
  return crypto.createHash("sha256").update(s, "utf8").digest("hex");
}

function normStr(v) {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function normMoney(v) {
  const s = normStr(v);
  if (!s) return "";
  const cleaned = s.replace(/,/g, "");
  const num = Number(cleaned);
  if (Number.isNaN(num)) return cleaned;
  return num.toFixed(2);
}

// Convert M/D/YYYY or MM/DD/YYYY => YYYY-MM-DD
function normDateMDY(v) {
  const s = normStr(v);
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return s; // keep stable even if unexpected
  return `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function postJson(url, body) {
  if (dryRun) return { ok: true, dry_run: true, counts: { received: body.rows?.length ?? 0 } };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response from ${url}: ${text.slice(0, 500)}`);
  }

  if (!res.ok || data?.ok === false) {
    throw new Error(`${data?.error || `HTTP ${res.status}`} (url=${url})`);
  }

  return data;
}

// ------------------------- Normalization -------------------------
// Expected headers:
// P/O NO.,VEND. NO.,VENDOR NAME,INVOICE NO.,INVOICE DATE,ACCOUNT NO.,ACCT PD,NET AMOUNT,CHECK NO.,CHECK DATE,DESCRIPTION,BATCH

function normalizeRow(rec) {
  const po_no = normStr(rec["P/O NO."]);
  const vend_no = normStr(rec["VEND. NO."]);
  const vendor_name = normStr(rec["VENDOR NAME"]);
  const invoice_no = normStr(rec["INVOICE NO."]);
  const invoice_date = normDateMDY(rec["INVOICE DATE"]);
  const account_no = normStr(rec["ACCOUNT NO."]);
  const acct_pd = normStr(rec["ACCT PD"]);
  const net_amount = normMoney(rec["NET AMOUNT"]);
  const check_no = normStr(rec["CHECK NO."]);
  const check_date = normDateMDY(rec["CHECK DATE"]);
  const description = normStr(rec["DESCRIPTION"]);
  const batch = normStr(rec["BATCH"]);

  // Anchor hash: vend_no|invoice_no|check_no|batch
  const anchor_hash = sha256hex([vend_no, invoice_no, check_no, batch].join("|"));

  // Content hash: fixed order of normalized columns
  const content_hash = sha256hex(
    [
      po_no,
      vend_no,
      vendor_name,
      invoice_no,
      invoice_date,
      account_no,
      acct_pd,
      net_amount,
      check_no,
      check_date,
      description,
      batch,
    ].join("|")
  );

  return {
    anchor_hash,
    content_hash,
    data: {
      po_no,
      vend_no,
      vendor_name,
      invoice_no,
      invoice_date: invoice_date || null,
      account_no,
      acct_pd,
      net_amount: net_amount ? Number(net_amount) : null,
      check_no,
      check_date: check_date || null,
      description,
      batch,
    },
  };
}

function sortRows(rows) {
  if (sortMode === "none") return rows;

  return rows.slice().sort((a, b) => {
    // Deterministic ordering for stable_row_num
    const keys = ["batch", "check_no", "vend_no", "invoice_no", "account_no"];
    for (const k of keys) {
      const av = a.data[k] || "";
      const bv = b.data[k] || "";
      if (av !== bv) return av.localeCompare(bv, undefined, { numeric: true });
    }

    // Tie-breakers (handles your "only differs by account/amount/desc" case)
    const an = a.data.net_amount ?? 0;
    const bn = b.data.net_amount ?? 0;
    if (an !== bn) return an < bn ? -1 : 1;

    const ad = a.data.description || "";
    const bd = b.data.description || "";
    if (ad !== bd) return ad.localeCompare(bd);

    return a.content_hash.localeCompare(b.content_hash);
  });
}

// ------------------------- Main -------------------------

async function processOneFile(dataDir, filename, sourceFolder) {
  const fullPath = path.join(dataDir, filename);
  const csvText = fs.readFileSync(fullPath, "utf8");

  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    relax_column_count: true,
  });

  let rows = records.map(normalizeRow);
  rows = sortRows(rows);

  const finalRows = rows.map((r, idx) => {
    const stable_row_num = idx + 1;
    const source_row_key = sha256hex(`${sourceFolder}|${filename}|${stable_row_num}`);
    return { ...r, stable_row_num, source_row_key };
  });

  const batches = chunk(finalRows, chunkSize);

  // Per-file totals (helpful when debugging)
  const totals = {
    file: filename,
    rows: finalRows.length,
    check: { inserted: 0, changed: 0, unchanged: 0, observed_new: 0, observed_already_seen: 0 },
    lines: { upserted: 0, skipped_missing_observed: 0 },
  };

  for (let i = 0; i < batches.length; i++) {
    const chunkRows = batches[i];

    // 1) hashes/manifest
    const checkRes = await postJson(CHECK_URL, {
      source_folder: sourceFolder,
      source_file: filename,
      return_rows: false,
      rows: chunkRows.map((r) => ({
        stable_row_num: r.stable_row_num,
        source_row_key: r.source_row_key,
        anchor_hash: r.anchor_hash,
        content_hash: r.content_hash,
      })),
    });

    if (checkRes?.counts) {
      totals.check.inserted += checkRes.counts.inserted || 0;
      totals.check.changed += checkRes.counts.changed || 0;
      totals.check.unchanged += checkRes.counts.unchanged || 0;
      totals.check.observed_new += checkRes.counts.observed_new || 0;
      totals.check.observed_already_seen += checkRes.counts.observed_already_seen || 0;
    }

    // 2) materialized lines
    const linesRes = await postJson(LINES_URL, {
      return_rows: false,
      rows: chunkRows.map((r) => ({
        anchor_hash: r.anchor_hash,
        content_hash: r.content_hash,
        data: r.data,
      })),
    });

    if (linesRes?.counts) {
      totals.lines.upserted += linesRes.counts.upserted || 0;
      totals.lines.skipped_missing_observed += linesRes.counts.skipped_missing_observed || 0;
    }
  }

  return totals;
}

async function main() {
  const dataDir = path.resolve(process.cwd(), "data", sourceFolder, "clean_csv");

  if (!fs.existsSync(dataDir)) {
    console.error(`Folder not found: ${dataDir}`);
    process.exit(1);
  }

  const csvFiles = fs
    .readdirSync(dataDir)
    .filter((f) => f.toLowerCase().endsWith(".csv"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  if (csvFiles.length === 0) {
    console.log(`No CSV files found in: ${dataDir}`);
    process.exit(0);
  }

  console.log(`Using API base: ${API_BASE}`);
  console.log(`Source folder: ${sourceFolder}`);
  console.log(`Scanning: ${dataDir}`);
  console.log(`Found ${csvFiles.length} CSV files`);
  console.log(`Chunk size: ${chunkSize}`);
  console.log(`Sort: ${sortMode}`);
  if (dryRun) console.log("DRY RUN enabled (no HTTP calls)");

  const grand = {
    files: csvFiles.length,
    rows: 0,
    check: { inserted: 0, changed: 0, unchanged: 0, observed_new: 0, observed_already_seen: 0 },
    lines: { upserted: 0, skipped_missing_observed: 0 },
    failed_files: [],
  };

  for (let idx = 0; idx < csvFiles.length; idx++) {
    const file = csvFiles[idx];
    console.log(`\n[${idx + 1}/${csvFiles.length}] Processing: ${file}`);

    try {
      const totals = await processOneFile(dataDir, file, sourceFolder);

      grand.rows += totals.rows;
      grand.check.inserted += totals.check.inserted;
      grand.check.changed += totals.check.changed;
      grand.check.unchanged += totals.check.unchanged;
      grand.check.observed_new += totals.check.observed_new;
      grand.check.observed_already_seen += totals.check.observed_already_seen;

      grand.lines.upserted += totals.lines.upserted;
      grand.lines.skipped_missing_observed += totals.lines.skipped_missing_observed;

      console.log(
        `Finished ${file}: rows=${totals.rows}, inserted=${totals.check.inserted}, changed=${totals.check.changed}, unchanged=${totals.check.unchanged}, observed_new=${totals.check.observed_new}`
      );
    } catch (e) {
      console.error(`FAILED ${file}: ${e?.message || e}`);
      grand.failed_files.push({ file, error: e?.message || String(e) });
      if (!continueOnError) process.exit(1);
    }
  }

  console.log("\nDONE (folder)");
  console.log("Grand totals:", grand);
}

main().catch((e) => {
  console.error("ERROR:", e?.message || e);
  process.exit(1);
});
