/**
 * Rebuild `frontend/data/compression-capacity.json` from the workbook
 * `Compression-Capacity` sheet (Born2BeSteel Final Excel).
 *
 * Usage (from repo root `steel-design-system/`):
 *   node scripts/export-compression-capacity.js
 *
 * Optional env:
 *   COMPRESSION_CAPACITY_XLSX=path/to/workbook.xlsx
 *
 * Default workbook is the current Born2BeSteel release used as capacity DB source of truth.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const ROOT = path.join(__dirname, "..");
const defaultXlsx = path.join(ROOT, "Born2BeSteel Final (LAST) (1).xlsx");
const xlsxPath = process.env.COMPRESSION_CAPACITY_XLSX || defaultXlsx;
const outPath = path.join(ROOT, "frontend", "data", "compression-capacity.json");

if (!fs.existsSync(xlsxPath)) {
  console.error("Workbook not found:", xlsxPath);
  process.exit(1);
}

const wb = XLSX.readFile(xlsxPath);
const sh = wb.Sheets["Compression-Capacity"];
if (!sh) {
  console.error('Sheet "Compression-Capacity" missing in', xlsxPath);
  process.exit(1);
}

const rows = XLSX.utils.sheet_to_json(sh, { header: 1, defval: null });
const outRows = [];

for (let i = 0; i < rows.length; i += 1) {
  const r = rows[i];
  if (!r) continue;
  const c1 = r[1];
  if (c1 == null || String(c1).trim() === "") continue;
  const sec = String(c1).trim();
  if (sec === "Section") continue;

  const wNum = r[2];
  const isWeight = typeof wNum === "number" && Number.isFinite(wNum);

  // Depth-only group label (e.g. "W44") — column W is not numeric
  if (!isWeight && /^W\d+$/i.test(sec)) {
    outRows.push({ kind: "group", section: sec.toUpperCase() });
    continue;
  }

  if (!isWeight) continue;

  function numOrEmpty(idx) {
    const v = r[idx];
    if (v === null || v === undefined || v === "") return "";
    if (typeof v === "number" && Number.isFinite(v)) return v;
    const n = Number(v);
    return Number.isFinite(n) ? n : "";
  }

  function strOrEmpty(idx) {
    const v = r[idx];
    if (v === null || v === undefined) return "";
    return String(v).trim();
  }

  outRows.push({
    kind: "row",
    section: sec.toUpperCase(),
    W: numOrEmpty(2),
    Ag: numOrEmpty(3),
    rx: numOrEmpty(4),
    ry: numOrEmpty(5),
    bfOver2tf: numOrEmpty(6),
    flangeLambdaR: numOrEmpty(7),
    flangeRemarks: strOrEmpty(8),
    hOverTw: numOrEmpty(9),
    webLambdaR: numOrEmpty(10),
    webRemarks: strOrEmpty(11),
    finalRemarks: strOrEmpty(12),
    KLxOverRx: numOrEmpty(13),
    KLyOverRy: numOrEmpty(14),
    KLOverR: numOrEmpty(15),
    Fe: numOrEmpty(16),
    Fcr: numOrEmpty(17),
    Pn: numOrEmpty(18),
    Pu: numOrEmpty(19),
    PuRemarks: strOrEmpty(20),
    Pa: numOrEmpty(21),
    PaRemarks: strOrEmpty(22),
  });
}

const dataRows = outRows.filter(function (x) {
  return x.kind === "row";
});
const groupRows = outRows.filter(function (x) {
  return x.kind === "group";
});

const payload = {
  sourceWorkbook: path.basename(xlsxPath),
  sheet: "Compression-Capacity",
  generatedAt: new Date().toISOString(),
  rowCount: dataRows.length,
  rows: outRows,
};

fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + "\n");
console.log(
  "Wrote",
  outPath,
  "—",
  String(dataRows.length),
  "member rows,",
  String(groupRows.length),
  "group headers"
);
