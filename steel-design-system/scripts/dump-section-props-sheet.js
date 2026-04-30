const XLSX = require("xlsx");
const path = require("path");
const fp = path.join(__dirname, "..", "Born2BeSteel Final (2).xlsx");
const wb = XLSX.readFile(fp, { cellFormula: true });
const name = "Section Properties";
const ws = wb.Sheets[name];
if (!ws) {
  console.log("Sheets:", wb.SheetNames);
  process.exit(1);
}
console.log("Sheet:", name, "!ref:", ws["!ref"]);
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false });
for (let i = 0; i < Math.min(60, rows.length); i++) {
  const line = rows[i];
  if (!line || !line.some((c) => String(c).trim())) continue;
  console.log(i + 1, JSON.stringify(line.slice(0, 40)));
}
console.log("\n--- Formula cells (first 50) ---");
let n = 0;
for (const [addr, cell] of Object.entries(ws)) {
  if (addr[0] === "!") continue;
  if (cell && cell.f) {
    console.log(addr, cell.f, "v=", cell.v);
    if (++n >= 50) break;
  }
}
