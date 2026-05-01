/**
 * Reads "Steel Grade" sheet from the Born2BeSteel workbook and writes
 * frontend/data/steel-grades.json (single source of truth from Excel).
 *
 * Usage: node scripts/export-steel-grades.js
 */
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const ROOT = path.join(__dirname, "..");
const XLSX_PATH = path.join(ROOT, "Born2BeSteel Final (2).xlsx");
const OUT = path.join(ROOT, "frontend", "data", "steel-grades.json");

/**
 * Optional imgGroup for bundled PNG assets only — not defined in the Excel table.
 * Steel Grade sheet Table48 provides ASTM / Fy / Fu only (same columns XLOOKUP uses).
 */
const EXTRA_BY_ASTM = {
  A36: { imgGroup: "carbon" },
  A992: { imgGroup: "wshape" },
  "A572 Gr. 42": { imgGroup: "plate" },
  "A572 Gr. 50": { imgGroup: "beam" },
  "A572 Gr. 55": { imgGroup: "heavy" },
  "A572 Gr. 60": { imgGroup: "bridge" },
  "A572 Gr. 65": { imgGroup: "heavy" },
  "A53 Gr. B": { imgGroup: "pipe" },
  "A500 Gr. B": { imgGroup: "hss" },
  "A500 Gr. C": { imgGroup: "hss" },
  "A501 Gr. A": { imgGroup: "pipe" },
  "A501 Gr. B": { imgGroup: "pipe" },
  "A529 Gr. 50": { imgGroup: "angle" },
  "A529 Gr. 55": { imgGroup: "angle" },
  "A709 36": { imgGroup: "bridge" },
  "A1043 36": { imgGroup: "seismic" },
  "A1043 50": { imgGroup: "seismic" },
  "A1085 Gr. A": { imgGroup: "hss_modern" },
  "A618 Gr. I, II": { imgGroup: "hss" },
  "A618 Gr. III": { imgGroup: "hss" },
  "A709 50": { imgGroup: "bridge" },
  "A709 50S": { imgGroup: "bridge" },
  "A709 50W": { imgGroup: "weather" },
  "A913 50": { imgGroup: "heavy" },
  "A913 60": { imgGroup: "heavy" },
  "A913 65": { imgGroup: "heavy" },
  "A913 70": { imgGroup: "heavy" },
  "A1065 Gr. 50": { imgGroup: "hss" },
  A588: { imgGroup: "weather" },
  A847: { imgGroup: "weather" },
};

/** Table48 on "Steel Grade": ASTM in column G, Fy in H, Fu in I (header row 13 in the workbook). Matches XLOOKUP(..., Table48[...]). */
function parseGradesFromSheet(ws) {
  const rows = XLSX.utils.sheet_to_json(ws, { range: "A1:AI200", header: 1, raw: false });
  let startCol = -1;
  let headerRow = -1;
  for (let r = 0; r < rows.length; r++) {
    const line = rows[r];
    if (!line) continue;
    const g = line[6];
    const h = line[7];
    const i = line[8];
    const gOk =
      g &&
      String(g).toLowerCase().replace(/\s+/g, " ").includes("astm designation");
    const hOk =
      h &&
      String(h).toLowerCase().replace(/\s+/g, " ").includes("yield stress") &&
      String(h).toLowerCase().includes("fy");
    const iOk =
      i &&
      String(i).toLowerCase().replace(/\s+/g, " ").includes("tensile stress") &&
      String(i).toLowerCase().includes("fu");
    if (gOk && hOk && iOk) {
      startCol = 6;
      headerRow = r;
      break;
    }
  }
  if (startCol === -1) throw new Error('Could not find Table48 header row (columns G–I: ASTM / Fy / Fu) on "Steel Grade"');

  const grades = [];
  for (let r = headerRow + 1; r < rows.length; r++) {
    const line = rows[r];
    if (!line) continue;
    const astmRaw = line[startCol];
    const fyRaw = line[startCol + 1];
    const fuRaw = line[startCol + 2];
    const astm = astmRaw != null ? String(astmRaw).trim() : "";
    if (!astm) continue;
    const fy = Number(fyRaw);
    const fu = Number(fuRaw);
    if (!Number.isFinite(fy) || !Number.isFinite(fu)) continue;
    const extra = EXTRA_BY_ASTM[astm] || { imgGroup: "general" };
    grades.push({
      astm,
      fy,
      fu,
      notes: "",
      imgGroup: extra.imgGroup,
    });
  }
  return { headerRow: headerRow + 1, startCol, grades };
}

function main() {
  if (!fs.existsSync(XLSX_PATH)) {
    console.error("Missing workbook:", XLSX_PATH);
    process.exit(1);
  }
  const wb = XLSX.readFile(XLSX_PATH);
  const ws = wb.Sheets["Steel Grade"];
  if (!ws) {
    console.error('Sheet "Steel Grade" not found');
    process.exit(1);
  }
  const { grades, headerRow, startCol } = parseGradesFromSheet(ws);
  const payload = {
    meta: {
      sourceFile: "Born2BeSteel Final (2).xlsx",
      sheet: "Steel Grade",
      headerExcelRow: headerRow,
      valueColumnsOffset: startCol,
      exportedAt: new Date().toISOString(),
      rowCount: grades.length,
    },
    grades,
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2), "utf8");
  console.log("Wrote", grades.length, "grades to", OUT);

  const EMBED = path.join(ROOT, "frontend", "js", "steel-grades-embed.js");
  const embedBody =
    "/* Auto-generated from Excel by scripts/export-steel-grades.js — do not edit by hand. */\n" +
    "(function (g) {\n" +
    "  g.__STEEL_GRADES_PAYLOAD__ = " +
    JSON.stringify(payload) +
    ";\n" +
    '})(typeof window !== "undefined" ? window : this);\n';
  fs.writeFileSync(EMBED, embedBody, "utf8");
  console.log("Wrote embed", EMBED);
}

main();
