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
/** Workbook that owns `Key Geometric Properties` + `aisc shapes database (2)` for this export. */
const XLSX_PATH = path.join(ROOT, "Born2BeSteel Final (8).xlsx");
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

/**
 * `Bending Analysis` formulas reference `aisc shapes database (2)` (FN7, FN8, FN10, FN14, FN17…).
 * Export Type **W** (full I-shape geometry) + Type **L** (angles listed in workbook picker UI) in **sheet row order**.
 * Fn-branch bending math in this app remains W-only; L rows support Excel-aligned section lists.
 */
function extractBendingAnalysisCatalog(wb) {
  const wsDb = wb.Sheets["aisc shapes database (2)"];
  if (!wsDb || !wsDb["!ref"]) return null;
  const range = XLSX.utils.decode_range(wsDb["!ref"]);
  const hdr = [];
  for (let c = 0; c <= range.e.c; c++) {
    hdr.push(cellStr(wsDb, 0, c));
  }
  const idx = (name) => hdr.indexOf(name);
  const COL = {
    shapes: idx("Shapes"),
    type: idx("Type"),
    aiscManualLabel: idx("AISC_Manual_Label"),
    W: idx("W"),
    A: idx("A"),
    d: idx("d"),
    bf: idx("bf"),
    tw: idx("tw"),
    tf: idx("tf"),
    Ix: idx("Ix"),
    Zx: idx("Zx"),
    Sx: idx("Sx"),
    rx: idx("rx"),
    Iy: idx("Iy"),
    Zy: idx("Zy"),
    Sy: idx("Sy"),
    ry: idx("ry"),
    Iz: idx("Iz"),
    bf2tf: idx("bf/2tf"),
    hTw: idx("h/tw"),
  };
  if (COL.type < 0 || COL.aiscManualLabel < 0) return null;

  const sections = [];
  const shapeSymbols = new Set();
  const types = new Set();

  for (let R = 1; R <= range.e.r; R++) {
    const typ = cellStr(wsDb, R, COL.type);
    if (typ !== "W" && typ !== "L") continue;

    const designation = cellStr(wsDb, R, COL.aiscManualLabel);
    if (!designation || designation === "–" || designation === "-") continue;

    const shSym = COL.shapes >= 0 ? cellStr(wsDb, R, COL.shapes) : "";
    if (shSym) shapeSymbols.add(shSym);

    types.add(typ);

    const row = {
      designation,
      /** Excel `aisc shapes database (2)` column **Shapes** (e.g. ⌶ wide-flange, ⎿ angle). */
      shapeSymbol: shSym || "",
      type: typ || null,
      aiscManualLabel: designation,
      weightPlf: cellNum(wsDb, R, COL.W),
      Ag: cellNum(wsDb, R, COL.A),
      d: cellNum(wsDb, R, COL.d),
      bf: cellNum(wsDb, R, COL.bf),
      tw: cellNum(wsDb, R, COL.tw),
      tf: cellNum(wsDb, R, COL.tf),
      Ix: cellNum(wsDb, R, COL.Ix),
      Iy: cellNum(wsDb, R, COL.Iy),
      Iz: cellNum(wsDb, R, COL.Iz),
      Sx: cellNum(wsDb, R, COL.Sx),
      Sy: cellNum(wsDb, R, COL.Sy),
      Zx: cellNum(wsDb, R, COL.Zx),
      Zy: cellNum(wsDb, R, COL.Zy),
      rx: cellNum(wsDb, R, COL.rx),
      ry: cellNum(wsDb, R, COL.ry),
      lambdaF: cellNum(wsDb, R, COL.bf2tf),
      lambdaW: cellNum(wsDb, R, COL.hTw),
    };

    let geomOk = false;
    if (typ === "W") {
      geomOk = [row.Zx, row.Sx, row.bf, row.tf, row.tw, row.d, row.lambdaF, row.lambdaW].every(
        (n) => typeof n === "number" && Number.isFinite(n)
      );
    } else {
      geomOk =
        typeof row.Zx === "number" &&
        Number.isFinite(row.Zx) &&
        typeof row.Sx === "number" &&
        Number.isFinite(row.Sx) &&
        (typeof row.d === "number" && Number.isFinite(row.d) ||
          typeof row.Ag === "number" && Number.isFinite(row.Ag));
    }
    if (!geomOk) continue;

    sections.push(row);
  }

  const typesDistinct = [...types].sort();

  /** Symbols appearing under **Shapes** for each **Type** value (strict Excel columns). */
  const shapeSymbolsByType = { W: new Set(), L: new Set() };
  for (const sec of sections) {
    const sy = String(sec.shapeSymbol || "").trim();
    if (!sy) continue;
    const t = String(sec.type || "").toUpperCase();
    if (t === "W") shapeSymbolsByType.W.add(sy);
    else if (t === "L") shapeSymbolsByType.L.add(sy);
  }
  const symW = [...shapeSymbolsByType.W];
  const symL = [...shapeSymbolsByType.L];

  return {
    meta: {
      sourceSheet: "aisc shapes database (2)",
      sourceFile: "Born2BeSteel Final (8).xlsx",
      exportedAt: new Date().toISOString(),
      rowCount: sections.length,
      shapeSymbolsDistinct: [...shapeSymbols],
      typesDistinct,
      /**
       * Shapes row filters by column **Shapes**; chip ids are UI-only (`I`/`L` labels).
       * `matchShapeSymbols` lists every distinct symbol from Excel for that family.
       */
      shapePickerLabels: [
        { id: "i", label: "I", matchShapeSymbols: symW },
        { id: "l", label: "L", matchShapeSymbols: symL },
      ],
      typePickerLabels: [
        { id: "W", label: "W", excelColumn: "Type" },
        { id: "L", label: "L", excelColumn: "Type" },
      ],
      notes:
        "Picker filters mirror Excel `aisc shapes database (2)` columns **Shapes** and **Type** (AND). Row order is sheet order.",
    },
    sections,
  };
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

  const bendingAnalysisCatalog = extractBendingAnalysisCatalog(wb);

  const payload = {
    meta: {
      sourceFile: "Born2BeSteel Final (8).xlsx",
      sheet: "Key Geometric Properties",
      exportedAt: new Date().toISOString(),
      rowCount: sections.length,
      notes:
        "Properties match Excel table lookup (XLOOKUP-style) from Key Geometric Properties; no closed-form recreation of AISC rolling equations.",
    },
    sections,
    ...(bendingAnalysisCatalog ? { bendingAnalysisCatalog } : {}),
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload), "utf8");
  console.log("Wrote", sections.length, "sections to", OUT);
  if (bendingAnalysisCatalog) {
    console.log(
      "  + bendingAnalysisCatalog:",
      bendingAnalysisCatalog.sections.length,
      "rows from",
      bendingAnalysisCatalog.meta.sourceSheet,
      "| types",
      bendingAnalysisCatalog.meta.typesDistinct.join(", ")
    );
  }
}

main();
