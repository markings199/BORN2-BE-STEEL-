/**
 * Regression: Bending Analysis vs Born2BeSteel Final (2).xlsx cached cells (U33, U38, FN17).
 * Run: npm run test:bending-analysis
 */
"use strict";

var BA = require("../frontend/js/bending-analysis-workbook.js");

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
}

function approx(actual, expected, tol, label) {
  var ok = Math.abs(actual - expected) <= tol;
  assert(
    ok,
    label +
      ": expected " +
      expected +
      ", got " +
      actual +
      " (tol " +
      tol +
      ")"
  );
}

var secW12X45 = {
  Zx: 64.2,
  Sx: 57.7,
  bf: 8.05,
  tf: 0.575,
  tw: 0.335,
  d: 12.1,
  lambdaF: 7,
  lambdaW: 29.6,
};

(function fixtureExcelCachedW12X45() {
  var r = BA.computeBorn2BeSteelAnalysis(secW12X45, {
    E: 29000,
    Fy: 50,
    method: "ASD",
  });
  assert(r.ok, "compute ok");
  assert(r.values.flangeClass === "Slender Flange", "FN17 class");
  approx(r.values.kc, 0.7352146220938078, 1e-12, "kc pivot");
  approx(r.values.lambdaPfDisplay, 9.151611879882145, 1e-12, "N33 display");
  approx(r.values.lambdaRfDisplay, 24.083188436053018, 1e-6, "N35 display");
  approx(r.values.Mn_kip_in, 22596.146212951262, 1e-6, "U33 Mn");
  approx(r.values.Mdesign_kip_in, 13530.626474821116, 1e-6, "U38 Ma");
})();

(function fixtureLRFD() {
  var r = BA.computeBorn2BeSteelAnalysis(secW12X45, {
    E: 29000,
    Fy: 50,
    method: "LRFD",
  });
  assert(r.ok, "LRFD compute ok");
  approx(r.values.Mdesign_kip_in, r.values.Mn_kip_in * 0.9, 1e-9, "Mu = 0.9 Mn");
})();

(function fixturePivotCompactWhenDesignLimitsMatchAnalysis() {
  var lp = BA.lambdaPfAnalysis(29000, 50);
  var lr = BA.lambdaRfAnalysis(29000, 50);
  var r = BA.computeBorn2BeSteelAnalysis(secW12X45, {
    E: 29000,
    Fy: 50,
    method: "ASD",
    lpDesign: lp,
    lrDesign: lr,
  });
  assert(r.ok, "coupled compute ok");
  assert(r.values.flangeClass === "Compact Flange", "engineering compact");
  approx(r.values.Mn_kip_in, 50 * 64.2, 1e-9, "compact Mp kip-in");
})();

(function fixtureCompactMpUsesDesignFyAnalog() {
  var lp = BA.lambdaPfAnalysis(29000, 50);
  var lr = BA.lambdaRfAnalysis(29000, 50);
  var r = BA.computeBorn2BeSteelAnalysis(secW12X45, {
    E: 29000,
    Fy: 50,
    fyMp: 60,
    method: "ASD",
    lpDesign: lp,
    lrDesign: lr,
  });
  assert(r.ok, "fyMp compute ok");
  assert(r.values.flangeClass === "Compact Flange", "compact with fyMp");
  approx(r.values.Mn_kip_in, 60 * 64.2, 1e-9, "FN19 uses Design X10 Fy analog");
})();

console.log("bending-analysis-regression: all checks passed.");
