/**
 * Verifies `SHEAR ANALYSIS` formulas (!Q39, !F39, !K39, !Y28, !Y38) vs Born2BeSteel workbook.
 * Run: node scripts/shear-analysis-regression.js
 */
const api = require("../frontend/js/shear-design-workbook.js");

const tol = 1e-4;
function approx(a, b) {
  return Math.abs(a - b) < tol;
}

let ok = true;
function check(name, got, expected) {
  if (typeof expected === "string") {
    if (got !== expected) {
      console.error(name, "expected", expected, "got", got);
      ok = false;
    }
    return;
  }
  if (!approx(got, expected)) {
    console.error(name, "expected", expected, "got", got);
    ok = false;
  }
}

/** Synthetic section matching workbook snapshot (d×tw Aw, h/tw). */
function secSnapshot() {
  return {
    aiscManualLabel: "REGRESSION",
    weightPlf: 0,
    d: 29.7,
    tw: 0.52,
    lambdaW: 51.9,
  };
}

const E = 29000;
const Fy = 36;

check("Default E constant matches workbook N12", api.SHEAR_ANALYSIS_DEFAULT_E_KSI, 29000);

check("Cv Q39 (compact snapshot)", api.shearAnalysisCv(51.9, E, Fy), 1);
check("phi F39 (snapshot)", api.shearAnalysisPhiLRFD(51.9, E, Fy), 1);
check("Omega K39 (snapshot)", api.shearAnalysisOmegaASD(51.9, E, Fy), 1.5);

var snap = api.evaluateShearAnalysisRow(secSnapshot(), E, Fy, "ASD", 0);
check("Vn Y28 (snapshot)", snap.Vn, 333.5904);
/** ASD Y38 = Y28/K39 = Vn/Ωv (`SHEAR ANALYSIS`); Ω=1.5 for this h/tw. */
check("Y38 (ASD snapshot)", snap.designStrength, 333.5904 / 1.5);

var lrfd = api.evaluateShearAnalysisRow(secSnapshot(), E, Fy, "LRFD", 0);
check("Y38 (LRFD snapshot)", lrfd.designStrength, 333.5904);
check(
  "SAFE remark suppressed when VuDemand omitted",
  api.evaluateShearAnalysisRow(secSnapshot(), E, Fy, "ASD", null).remark,
  ""
);

var lim11 = 1.1 * Math.sqrt((5 * E) / Fy);

var midK = 65;
check("Cv mid web", api.shearAnalysisCv(midK, E, Fy), 1);
check("phi mid web", api.shearAnalysisPhiLRFD(midK, E, Fy), 0.9);
check("Omega mid web", api.shearAnalysisOmegaASD(midK, E, Fy), 1.67);

var slenderK = 80;
var cvSl = lim11 / slenderK;
check("Cv slender (branch 2)", api.shearAnalysisCv(slenderK, E, Fy), cvSl);
check("phi slender (zero)", api.shearAnalysisPhiLRFD(slenderK, E, Fy), 0);

/** Branch 3: (1.51*N12*5)/(X10*G32^2) when G32 > 1.37*√(5N12/X10). */
var verySlenderK = 100;
check(
  "Cv very slender (branch 3)",
  api.shearAnalysisCv(verySlenderK, E, Fy),
  (1.51 * E * 5) / (Fy * verySlenderK * verySlenderK)
);

var secSl = {
  aiscManualLabel: "SLENDER",
  weightPlf: 0,
  d: 29.7,
  tw: 0.52,
  lambdaW: slenderK,
};
var vnSl = 0.6 * Fy * 29.7 * 0.52 * cvSl;
var rowSl = api.evaluateShearAnalysisRow(secSl, E, Fy, "LRFD", 0);
check("Vn slender", rowSl.Vn, vnSl);
check("Y38 LRFD slender (phi=0)", rowSl.designStrength, 0);

var rowSlAsd = api.evaluateShearAnalysisRow(secSl, E, Fy, "ASD", 1e9);
check("ASD remark UNSAFE vs huge Vu", rowSlAsd.remark, "UNSAFE");

var rowSafe = api.evaluateShearAnalysisRow(secSnapshot(), E, Fy, "ASD", 100);
check("ASD remark SAFE", rowSafe.remark, "SAFE");

process.exit(ok ? 0 : 1);
