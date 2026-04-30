const XLSX = require("xlsx");
const path = require("path");
const wb = XLSX.readFile(
  path.join(__dirname, "..", "Born2BeSteel Final (2).xlsx")
);
const ws = wb.Sheets["Steel Grade"];
const rows = XLSX.utils.sheet_to_json(ws, { range: "A1:AI80", header: 1, raw: false });
let startCol = -1;
let headerRow = -1;
for (let r = 0; r < 15; r++) {
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
    console.log("Found header at excel row", r + 1, "col index", idx, line[idx]);
    break;
  }
}
for (let r = headerRow + 1; r < rows.length; r++) {
  const line = rows[r];
  if (!line) continue;
  const a = line[startCol];
  const b = line[startCol + 1];
  const c = line[startCol + 2];
  const astm = a != null ? String(a).trim() : "";
  if (!astm) continue;
  console.log(r + 1, astm, b, c);
}
