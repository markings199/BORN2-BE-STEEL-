/**
 * Verifies `SHEAR DESIGN` / `Shear Capacity no deflection` combined row logic
 * (Born2BeSteel-style workbook).
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

const designDefaults = {
  orderedLabels: labels,
  byUpperLabel: by,
  deflectionMode: "without considering deflection",
  beamWeightMode: "ignore beam weight",
  deflDivisor: 360,
  manualMu: 0,
};

const lrfd = api.computeShearDesign(
  Object.assign(
    {
      method: "LRFD",
      dl: 8,
      ll: 12,
      Lft: 5,
      E: 29000,
      Fy: 50,
    },
    designDefaults
  )
);

check("LRFD V30", lrfd.V30, 28.8);
check("LRFD AA30", lrfd.AA30, 11.2);
check("LRFD O26", lrfd.governingWu, 28.8);
check("LRFD R38 (Mu)", lrfd.Mu_kipft, 90);
check("LRFD Z38 (Vu)", lrfd.Vu_kips, 72);
check("LRFD Y31 Ix req (in4)", lrfd.Y31_ixRequired_in4, 34.91379310344828);
check("LRFD F44 (lightest)", lrfd.lightest && lrfd.lightest.label, "W12X19");
check("LRFD G38 (min weight plf)", lrfd.lightest && lrfd.lightest.weightPlf, 19);
check("LRFD G41 (\u03c6Vn)", lrfd.lightest && lrfd.lightest.phiVnOrAllow, 86.01);

const asd = api.computeShearDesign(
  Object.assign(
    {
      method: "ASD",
      dl: 8,
      ll: 12,
      Lft: 5,
      E: 29000,
      Fy: 50,
    },
    designDefaults
  )
);

check("ASD V30 (DL+LL)", asd.V30, 20);
check("ASD O26 (Wa governing)", asd.governingWu, 20);
check("ASD AA30 (placeholder)", Number.isFinite(asd.AA30), false);
check("ASD R38 (Ma)", asd.Mu_kipft, 62.5);
check("ASD Z38 (Va)", asd.Vu_kips, 50);
check("ASD Y31 Ix req (in4)", asd.Y31_ixRequired_in4, 34.91379310344828);
check("ASD F44 (lightest)", asd.lightest && asd.lightest.label, "W14X22");
check("ASD G38 (min weight plf)", asd.lightest && asd.lightest.weightPlf, 22);
check("ASD G41 (Vn/\u03a9)", asd.lightest && asd.lightest.phiVnOrAllow, 63.02);

const asdDefl = api.computeShearDesign(
  Object.assign(
    {
      method: "ASD",
      dl: 8,
      ll: 12,
      Lft: 5,
      E: 29000,
      Fy: 50,
      deflectionMode: "considering deflection",
    },
    designDefaults
  )
);
check("ASD+defl lightest label", asdDefl.lightest && asdDefl.lightest.label, "W14X22");

if (!ok) process.exit(1);
console.log("shear-design-regression: OK (LRFD + ASD Excel-aligned)");
