/**
 * Regression: Bending Analysis vs Born2BeSteel Final (3).xlsx logic (`Bending Analysis` N33/N35 drive pivot FN17).
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
  /** λ_f=7 < λ_pf≈9.15 → Compact (`aisc shapes database (2)`!FN17 vs `Bending Analysis`!N33/N35). */
  assert(r.values.flangeClass === "Compact Flange", "FN17 class");
  assert(r.values.classificationFormulasMatch === true, "FN17 vs nested IF");
  approx(r.values.kc, 0.7352146220938078, 1e-12, "kc pivot");
  approx(r.values.lambdaPfDisplay, 9.151611879882145, 1e-12, "N33 display");
  approx(r.values.lambdaRfDisplay, 24.083188436053018, 1e-6, "N35 display");
  approx(r.values.Mn_kip_ft, (50 * 64.2) / 12, 1e-9, "U33 Mn compact Mp (kip·ft)");
  approx(r.values.Mdesign_kip_ft, ((50 * 64.2) / 12) / 1.67, 1e-9, "U38 Ma");
})();

(function fixtureLRFD() {
  var r = BA.computeBorn2BeSteelAnalysis(secW12X45, {
    E: 29000,
    Fy: 50,
    method: "LRFD",
  });
  assert(r.ok, "LRFD compute ok");
  approx(r.values.Mdesign_kip_ft, r.values.Mn_kip_ft * 0.9, 1e-9, "Mu = 0.9 Mn");
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
  assert(r.values.classificationFormulasMatch === true, "FN17 vs nested IF (design limits echo)");
  approx(r.values.Mn_kip_ft, (50 * 64.2) / 12, 1e-9, "compact Mp kip·ft");
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
  assert(r.values.classificationFormulasMatch === true, "FN17 vs nested IF (fyMp)");
  approx(r.values.Mn_kip_ft, (60 * 64.2) / 12, 1e-9, "FN19 uses Design X10 Fy analog");
})();

/** W6X15 — non-compact flange; U33 matches Excel mixed FN19 (kip·ft) vs 0.7*W10*FN10 (kip·in) interpolation. */
(function fixtureW6X15NonCompactU33() {
  var sec = {
    Zx: 10.8,
    Sx: 9.72,
    bf: 5.99,
    tf: 0.26,
    tw: 0.23,
    d: 5.99,
    lambdaF: 11.5,
    lambdaW: 21.6,
  };
  var r = BA.computeBorn2BeSteelAnalysis(sec, {
    E: 29000,
    Fy: 50,
    fyMp: 50,
    method: "LRFD",
  });
  assert(r.ok, "W6X15 compute ok");
  assert(r.values.flangeClass === "Non-compact Flange", "W6X15 class");
  assert(r.values.classificationFormulasMatch === true, "W6X15 FN17 vs nested IF");
  approx(r.values.Mn_kip_ft, 91.4281, 5e-4, "U33 Mn non-compact (Final (3).xlsx)");
  approx(r.values.Mdesign_kip_ft, 91.4281 * 0.9, 5e-4, "U38 Mu LRFD");
})();

console.log("bending-analysis-regression: all checks passed.");
