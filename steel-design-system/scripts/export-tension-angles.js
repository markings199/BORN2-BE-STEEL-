/**
 * Exports angle rows from "Tension(Capacity and Demand )" plus x̄, ȳ from
 * "Key Geometric Properties" — matches Born2BeSteel Excel inputs for the
 * Tension Design Calculator (SAFE scan / MINIFS flow).
 *
 * Usage: node scripts/export-tension-angles.js
 */
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const ROOT = path.join(__dirname, "..");
const XLSX_PATH = path.join(ROOT, "Born2BeSteel Final (2).xlsx");
const OUT = path.join(ROOT, "frontend", "data", "tension-capacity-angles.json");

const CAP_SHEET = "Tension(Capacity and Demand )";
const GEO_SHEET = "Key Geometric Properties";

function cellNum(ws, R, cIdx) {
  const addr = XLSX.utils.encode_cell({ r: R, c: cIdx });
  const cell = ws[addr];
  if (!cell || cell.v === undefined || cell.v === null || cell.v === "") return null;
  const v = cell.v;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = parseFloat(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function cellStr(ws, R, cIdx) {
  const addr = XLSX.utils.encode_cell({ r: R, c: cIdx });
  const cell = ws[addr];
  if (!cell || cell.v === undefined || cell.v === null) return "";
  return String(cell.v).trim();
}

function normLabel(s) {
  return String(s || "")
    .replace(/\s+/g, "")
    .toUpperCase();
}

function main() {
  if (!fs.existsSync(XLSX_PATH)) {
    console.error("Missing:", XLSX_PATH);
    process.exit(1);
  }
  const wb = XLSX.readFile(XLSX_PATH);
  const cap = wb.Sheets[CAP_SHEET];
  const geo = wb.Sheets[GEO_SHEET];
  if (!cap || !cap["!ref"]) {
    console.error("Missing sheet:", CAP_SHEET);
    process.exit(1);
  }

  const xyByLabel = {};
  if (geo && geo["!ref"]) {
    const gr = XLSX.utils.decode_range(geo["!ref"]);
    const COL_LABEL = 4;
    const COL_X = 29;
    const COL_Y = 30;
    for (let R = gr.s.r + 1; R <= gr.e.r; R++) {
      const label = cellStr(geo, R, COL_LABEL);
      if (!label || !/^L/i.test(label)) continue;
      const x = cellNum(geo, R, COL_X);
      const y = cellNum(geo, R, COL_Y);
      if (x != null && y != null) xyByLabel[normLabel(label)] = { xbar: x, ybar: y };
    }
  }

  const range = XLSX.utils.decode_range(cap["!ref"]);
  const COL_H = 7;
  const COL_I = 8;
  const COL_J = 9;
  const COL_K = 10;
  const COL_L = 11;
  const COL_M = 12;
  const COL_N = 13;

  const sections = [];
  for (let R = 11; R <= range.e.r; R++) {
    const designation = cellStr(cap, R, COL_H);
    if (!designation || !/^L/i.test(designation)) continue;
    const Ag = cellNum(cap, R, COL_I);
    const weightLbFt = cellNum(cap, R, COL_J);
    const t = cellNum(cap, R, COL_K);
    const rx = cellNum(cap, R, COL_L);
    const ry = cellNum(cap, R, COL_M);
    let rmin = cellNum(cap, R, COL_N);
    if (rmin == null && rx != null && ry != null) rmin = Math.min(rx, ry);
    if (Ag == null || t == null || rx == null || ry == null) continue;

    const xy = xyByLabel[normLabel(designation)] || {};
    const xbar = xy.xbar != null ? xy.xbar : rx * 0.92;
    const ybar = xy.ybar != null ? xy.ybar : ry * 0.92;

    sections.push({
      designation,
      Ag,
      weightLbFt,
      t,
      rx,
      ry,
      rmin,
      xbar,
      ybar,
    });
  }

  const payload = {
    meta: {
      sourceFile: "Born2BeSteel Final (2).xlsx",
      sheets: [CAP_SHEET, GEO_SHEET],
      exportedAt: new Date().toISOString(),
      rowCount: sections.length,
      notes:
        "Order follows Excel capacity table top-to-bottom (row 12 first). Used with Design sheet formulas for Ahole, An_req, slenderness, and MINIFS lightest SAFE angle.",
    },
    sections,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload), "utf8");
  console.log("Wrote", sections.length, "angles to", OUT);
}

main();
