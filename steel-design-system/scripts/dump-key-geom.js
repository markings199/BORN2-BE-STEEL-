const XLSX = require("xlsx");
const path = require("path");
const fp = path.join(__dirname, "..", "Born2BeSteel Final (2).xlsx");
const wb = XLSX.readFile(fp, { cellFormula: true });
const ws = wb.Sheets["Key Geometric Properties"];
console.log("!ref", ws["!ref"]);
const rows = XLSX.utils.sheet_to_json(ws, { range: "A1:Z25", header: 1, raw: false });
rows.forEach((r, i) => console.log(i + 1, JSON.stringify(r)));
