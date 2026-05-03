/**
 * Verifies `SHEAR DESIGN` (Born2BeSteel Final (2) (1).xlsx) outputs against Excel.
 * Covers LRFD defaults (workbook snapshot) and the ASD branch implied by F25 toggle.
 * Run: node scripts/shear-design-regression.js
 */
const fs = require("fs");
const path = require("path");
const api = require("../frontend/js/shear-design-workbook.js");

const order = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../frontend/data/shear-design-order.json"), "utf8")
);
const aisc = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../frontend/data/aisc-sections.json"), "utf8")
);

const by = {};
aisc.sections.forEach(function (s) {
  if (s.type !== "W") return;
  by[String(s.aiscManualLabel).toUpperCase()] = s;
});

const labels = order.labels.map(function (L) {
  return String(L).toUpperCase();
});

const tol = 1e-6;
function approx(a, b) {
  return Math.abs(a - b) < tol;
}

let ok = true;
function check(name, got, expected) {
  if (typeof expected === "number") {
    if (!approx(got, expected)) {
      console.error(name, "expected", expected, "got", got);
      ok = false;
    }
  } else if (got !== expected) {
    console.error(name, "expected", expected, "got", got);
    ok = false;
  }
}

const lrfd = api.computeShearDesign({
  method: "LRFD",
  dl: 8,
  ll: 12,
  Lft: 5,
  E: 29000,
  Fy: 50,
  orderedLabels: labels,
  byUpperLabel: by,
});

check("LRFD V30", lrfd.V30, 28.8);
check("LRFD AA30", lrfd.AA30, 11.2);
check("LRFD O26", lrfd.governingWu, 28.8);
check("LRFD R38 (Mu)", lrfd.Mu_kipft, 90);
check("LRFD Z38 (Vu)", lrfd.Vu_kips, 72);
check("LRFD F44 (lightest)", lrfd.lightest && lrfd.lightest.label, "W12X16");
check("LRFD G38 (min weight plf)", lrfd.lightest && lrfd.lightest.weightPlf, 16);
check("LRFD G41 (\u03c6Vn)", lrfd.lightest && lrfd.lightest.phiVnOrAllow, 79.2);

const asd = api.computeShearDesign({
  method: "ASD",
  dl: 8,
  ll: 12,
  Lft: 5,
  E: 29000,
  Fy: 50,
  orderedLabels: labels,
  byUpperLabel: by,
});

check("ASD V30 (DL+LL)", asd.V30, 20);
check("ASD O26 (Wa governing)", asd.governingWu, 20);
check("ASD AA30 (placeholder)", Number.isFinite(asd.AA30), false);
check("ASD R38 (Ma)", asd.Mu_kipft, 62.5);
check("ASD Z38 (Va)", asd.Vu_kips, 50);
check("ASD F44 (lightest)", asd.lightest && asd.lightest.label, "W12X16");
check("ASD G38 (min weight plf)", asd.lightest && asd.lightest.weightPlf, 16);
check("ASD G41 (Vn/\u03a9)", asd.lightest && asd.lightest.phiVnOrAllow, 52.8);

if (!ok) process.exit(1);
console.log("shear-design-regression: OK (LRFD + ASD Excel-aligned)");
