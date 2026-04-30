const fs = require("fs");
const path = require("path");
const p = path.join(__dirname, "../frontend/js/main.js");
let s = fs.readFileSync(p, "utf8");
const b = s.length;
s = s.replace(/\n[ \t]*\/\/ #region agent log\n[\s\S]*?\n[ \t]*\/\/ #endregion/g, "");
fs.writeFileSync(p, s);
console.log("removed", b - s.length, "chars");
