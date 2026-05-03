/**
 * Extract `Shear-Capacity !F8:F296` row order (Born2BeSteel Final workbook).
 * Used by the Design Calculator to break ties on MIN(W | SAFE) like XLOOKUP.
 */
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const ROOT = path.join(__dirname, "..");
const XLSX_PATH = path.join(ROOT, "Born2BeSteel Final (2) (1).xlsx");
const OUT = path.join(ROOT, "frontend", "data", "shear-design-order.json");

function main() {
  const wb = XLSX.readFile(XLSX_PATH);
  const ws = wb.Sheets["Shear-Capacity "];
  if (!ws || !ws["!ref"]) {
    throw new Error("Shear-Capacity sheet missing");
  }
  const range = XLSX.utils.decode_range(ws["!ref"]);
  const labels = [];
  for (let R = 7; R <= Math.min(range.e.r, 295); R++) {
    const addr = XLSX.utils.encode_cell({ r: R, c: 5 });
    const cell = ws[addr];
    if (!cell || cell.v === undefined || cell.v === null || cell.v === "") continue;
    labels.push(String(cell.v).trim());
  }
  fs.writeFileSync(
    OUT,
    JSON.stringify(
      {
        meta: {
          sourceFile: path.basename(XLSX_PATH),
          sheet: "Shear-Capacity ",
          column: "F",
          rowRange: [8, 296],
          exportedAt: new Date().toISOString(),
          count: labels.length,
        },
        labels,
      },
      null,
      2
    ),
    "utf8"
  );
  console.log("Wrote", OUT, "labels:", labels.length);
}

main();
