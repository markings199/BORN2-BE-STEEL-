/**
 * Reads "Key Geometric Properties" from Born2BeSteel workbook — same source as Excel
 * Section Properties / XLOOKUP flows — and writes frontend/data/aisc-sections.json
 *
 * Usage: node scripts/export-aisc-sections.js
 */
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const ROOT = path.join(__dirname, "..");
const XLSX_PATH = path.join(ROOT, "Born2BeSteel Final (2).xlsx");
const OUT = path.join(ROOT, "frontend", "data", "aisc-sections.json");

/** Column indices from row 1 of Key Geometric Properties (0-based). */
const COL = {
  type: 2,
  aiscManualLabel: 4,
  W: 6,
  A: 7,
  d: 8,
  bf: 13,
  tw: 18,
  tf: 21,
  Ix: 40,
  Zx: 41,
  Sx: 42,
  rx: 43,
  Iy: 44,
  Zy: 45,
  Sy: 46,
  ry: 47,
  Iz: 48,
  /** Excel/pivot-style slenderness (same as `bf/2tf` and `h/tw` on Key Geometric Properties). */
  bf2tf: 34,
  hTw: 37,
};

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

function main() {
  if (!fs.existsSync(XLSX_PATH)) {
    console.error("Missing:", XLSX_PATH);
    process.exit(1);
  }
  const wb = XLSX.readFile(XLSX_PATH);
  const ws = wb.Sheets["Key Geometric Properties"];
  if (!ws || !ws["!ref"]) {
    console.error("Missing Key Geometric Properties sheet");
    process.exit(1);
  }
  const range = XLSX.utils.decode_range(ws["!ref"]);
  const sections = [];
  for (let R = 2; R <= range.e.r; R++) {
    const designation = cellStr(ws, R, COL.aiscManualLabel);
    if (!designation || designation === "–" || designation === "-") continue;
    const row = {
      designation,
      type: cellStr(ws, R, COL.type) || null,
      aiscManualLabel: designation,
      weightPlf: cellNum(ws, R, COL.W),
      Ag: cellNum(ws, R, COL.A),
      d: cellNum(ws, R, COL.d),
      bf: cellNum(ws, R, COL.bf),
      tw: cellNum(ws, R, COL.tw),
      tf: cellNum(ws, R, COL.tf),
      Ix: cellNum(ws, R, COL.Ix),
      Iy: cellNum(ws, R, COL.Iy),
      Iz: cellNum(ws, R, COL.Iz),
      Sx: cellNum(ws, R, COL.Sx),
      Sy: cellNum(ws, R, COL.Sy),
      Zx: cellNum(ws, R, COL.Zx),
      Zy: cellNum(ws, R, COL.Zy),
      rx: cellNum(ws, R, COL.rx),
      ry: cellNum(ws, R, COL.ry),
      lambdaF: cellNum(ws, R, COL.bf2tf),
      lambdaW: cellNum(ws, R, COL.hTw),
    };
    if (!row.d && !row.Ag && !row.Ix) continue;
    sections.push(row);
  }

  const payload = {
    meta: {
      sourceFile: "Born2BeSteel Final (2).xlsx",
      sheet: "Key Geometric Properties",
      exportedAt: new Date().toISOString(),
      rowCount: sections.length,
      notes:
        "Properties match Excel table lookup (XLOOKUP-style) from Key Geometric Properties; no closed-form recreation of AISC rolling equations.",
    },
    sections,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload), "utf8");
  console.log("Wrote", sections.length, "sections to", OUT);
}

main();
