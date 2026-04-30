const XLSX = require("xlsx");
const path = require("path");
const wb = XLSX.readFile(
  path.join(__dirname, "..", "Born2BeSteel Final (2).xlsx")
);
const ws = wb.Sheets["Key Geometric Properties"];
const row = XLSX.utils.sheet_to_json(ws, { range: "A1:ZZ1", header: 1 })[0];
row.forEach((c, i) => {
  if (c) console.log(i, String(c).trim());
});
