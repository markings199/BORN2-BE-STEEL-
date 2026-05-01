/**
 * Extract benchmark rows from Born2BeSteel capacity sheets.
 *
 * - Import as a helper from regression tests.
 * - Or run directly to print/write JSON snapshot.
 */
"use strict";

var fs = require("fs");
var path = require("path");
var XLSX = require("xlsx");

var DEFAULT_LABELS = ["W44X408", "W12X16", "W10X12"];
var DEFAULT_BOOK_PATH = path.join(
  __dirname,
  "..",
  "Born2BeSteel Final (2).xlsx"
);

function cellValue(ws, addr) {
  var c = ws[addr];
  return c ? c.v : null;
}

function findLabelRow(ws, label) {
  for (var r = 8; r <= 320; r++) {
    var v = cellValue(ws, "F" + r);
    if (String(v == null ? "" : v).trim() === label) return r;
  }
  return null;
}

function pickCols(ws, row, cols) {
  var out = {};
  for (var i = 0; i < cols.length; i++) {
    var col = cols[i];
    out[col] = cellValue(ws, col + row);
  }
  return out;
}

function extractBenchmarks(workbookPath, labels) {
  var wbPath = workbookPath || DEFAULT_BOOK_PATH;
  var useLabels = Array.isArray(labels) && labels.length ? labels : DEFAULT_LABELS;
  var wb = XLSX.readFile(wbPath, { cellFormula: true });
  var wsNo = wb.Sheets["Bending Capacity no deflection"];
  var wsDef = wb.Sheets["Bending Capacity w deflection"];
  if (!wsNo || !wsDef) {
    throw new Error("Capacity sheets missing in workbook: " + wbPath);
  }

  var out = {
    sourceFile: path.basename(wbPath),
    labels: useLabels.slice(),
    noDeflection: {},
    withDeflection: {},
  };

  useLabels.forEach(function (label) {
    var rNo = findLabelRow(wsNo, label);
    var rDef = findLabelRow(wsDef, label);
    if (!rNo || !rDef) {
      throw new Error("Benchmark label not found in capacity sheets: " + label);
    }
    out.noDeflection[label] = pickCols(wsNo, rNo, [
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
      "M",
      "N",
      "O",
      "P",
      "Q",
      "R",
      "S",
      "T",
      "U",
    ]);
    out.withDeflection[label] = pickCols(wsDef, rDef, [
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
      "M",
      "N",
      "O",
      "P",
      "Q",
      "R",
      "S",
      "T",
      "U",
    ]);
  });

  return out;
}

module.exports = {
  extractBenchmarks: extractBenchmarks,
  DEFAULT_LABELS: DEFAULT_LABELS,
  DEFAULT_BOOK_PATH: DEFAULT_BOOK_PATH,
};

if (require.main === module) {
  var outPathArg = process.argv[2];
  var data = extractBenchmarks(DEFAULT_BOOK_PATH, DEFAULT_LABELS);
  if (outPathArg) {
    var abs = path.resolve(process.cwd(), outPathArg);
    fs.writeFileSync(abs, JSON.stringify(data, null, 2), "utf8");
    console.log("Wrote benchmark snapshot:", abs);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}
