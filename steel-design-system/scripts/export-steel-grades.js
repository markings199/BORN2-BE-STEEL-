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

/** Optional UI fields not present in Excel — keyed by exact ASTM string from the sheet. */
const EXTRA_BY_ASTM = {
  A36: { imgGroup: "carbon", notes: "General structural shapes, plates, bars" },
  A992: { imgGroup: "wshape", notes: "W-shapes, seismic & wide-flange" },
  "A572 Gr. 42": { imgGroup: "plate", notes: "High-strength low-alloy" },
  "A572 Gr. 50": { imgGroup: "beam", notes: "Common for beams & columns" },
  "A572 Gr. 55": { imgGroup: "heavy", notes: "Higher strength" },
  "A572 Gr. 60": { imgGroup: "bridge", notes: "Bridge & building" },
  "A572 Gr. 65": { imgGroup: "heavy", notes: "Special high-strength" },
  "A53 Gr. B": { imgGroup: "pipe", notes: "Pipe, circular sections" },
  "A500 Gr. B": { imgGroup: "hss", notes: "Cold-formed HSS" },
  "A500 Gr. C": { imgGroup: "hss", notes: "HSS, improved toughness" },
  "A501 Gr. A": { imgGroup: "pipe", notes: "Hot-formed carbon steel pipe" },
  "A501 Gr. B": { imgGroup: "pipe", notes: "Higher strength pipe" },
  "A529 Gr. 50": { imgGroup: "angle", notes: "Structural plates & angles" },
  "A529 Gr. 55": { imgGroup: "angle", notes: "High strength angles" },
  "A709 36": { imgGroup: "bridge", notes: "Bridge steel (Grade 36)" },
  "A1043 36": { imgGroup: "seismic", notes: "Low yield-to-tensile ratio" },
  "A1043 50": { imgGroup: "seismic", notes: "Seismic applications" },
  "A1085 Gr. A": { imgGroup: "hss_modern", notes: "Acceptable for Round HSS · Rectangular HSS" },
  "A618 Gr. I, II": { imgGroup: "hss", notes: "Hot-formed HSS" },
  "A618 Gr. III": { imgGroup: "hss", notes: "Hot-formed HSS" },
  "A709 50": { imgGroup: "bridge", notes: "Bridge steel (Grade 50)" },
  "A709 50S": { imgGroup: "bridge", notes: "Bridge steel — Grade 50S" },
  "A709 50W": { imgGroup: "weather", notes: "Weathering steel for bridges" },
  "A913 50": { imgGroup: "heavy", notes: "Quenched & tempered shapes" },
  "A913 60": { imgGroup: "heavy", notes: "High strength shapes" },
  "A913 65": { imgGroup: "heavy", notes: "Extra high strength" },
  "A913 70": { imgGroup: "heavy", notes: "Ultra-high strength" },
  "A1065 Gr. 50": { imgGroup: "hss", notes: "Cold-formed HSS" },
  A588: { imgGroup: "weather", notes: "Weathering steel (Corten)" },
  A847: { imgGroup: "weather", notes: "Cold-formed weathering" },
};

function parseGradesFromSheet(ws) {
  const rows = XLSX.utils.sheet_to_json(ws, { range: "A1:AI200", header: 1, raw: false });
  let startCol = -1;
  let headerRow = -1;
  for (let r = 0; r < 20; r++) {
    const line = rows[r];
    if (!line) continue;
    const idx = line.findIndex(
      (c) =>
        c &&
        String(c).toLowerCase().replace(/\s+/g, " ").includes("astm designation")
    );
    if (idx !== -1) {
      startCol = idx;
      headerRow = r;
      break;
    }
  }
  if (startCol === -1) throw new Error("Could not find ASTM Designation header row");

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
    const extra = EXTRA_BY_ASTM[astm] || {
      imgGroup: "general",
      notes: "Refer to AISC 360-22 and the governing ASTM standard.",
    };
    grades.push({
      astm,
      fy,
      fu,
      notes: extra.notes,
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
