/**
 * Regression checks for Bending Design math vs Born2BeSteel Final (2).xlsx snapshots.
 * Run: npm run test:bending-design
 */
"use strict";

var fs = require("fs");
var path = require("path");

var WB = require("../frontend/js/bending-design-workbook.js");
var Bench = require("./extract-bending-capacity-benchmarks.js");

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

var root = path.join(__dirname, "..");
var jsonPath = path.join(root, "frontend", "data", "aisc-sections.json");
var catalog = WB.parseCatalog(JSON.parse(fs.readFileSync(jsonPath, "utf8")));

assert(catalog.length > 100, "catalog should load W-shapes");

/* ── Fixture A: `Bending Design` reference inputs (LRFD, sheet screenshot rows) ── */
(function fixtureWorkbookReferenceLRFD() {
  var method = "LRFD";
  var DL = 8;
  var LL = 12;
  var L_ft = 5;
  var E = 29000;
  var fy = 60;
  var deflDiv = 360;

  approx(1.2 * DL + 1.6 * LL, 28.8, 1e-12, "LRFD combo N31 (1.2DL+1.6LL)");
  approx(1.4 * DL, 11.2, 1e-12, "LRFD combo S31 (1.4DL)");

  var wGov = WB.wuGoverning(method, DL, LL);
  approx(wGov, 28.8, 1e-12, "Governing Wu O24");

  var O39 = WB.muDemandFromW(wGov, L_ft);
  approx(O39, 90, 1e-9, "Mu from Wu O39 (wL^2/8)");

  var ixReq = WB.ixRequiredExcel(LL, L_ft, E, deflDiv);
  approx(ixReq, 34.91379310344828, 1e-12, "Required Ix Y31");

  var sec0 = {
    fy: fy,
    E: E,
    DL: DL,
    LL: LL,
    L_ft: L_ft,
    wGov: wGov,
    O39: O39,
    manualMu: 0,
    ixReq: ixReq,
    manualIx: 0,
    deflectionNorm: "without considering deflection",
    beamWeightNorm: "consider beam weight",
  };

  var pick = WB.pickLightestSection(catalog, method, sec0);
  assert(pick && pick.sec, "pickLightestSection should return a section");
  assert(
    pick.sec.label === "W12X16",
    "Lightest adequate section X41 (no defl): expected W12X16, got " +
      (pick.sec && pick.sec.label)
  );
  approx(pick.sec.weightPlf, 16, 1e-9, "Weight Z45");
  approx(pick.phiMn, 90.45, 5e-2, "phiMn Z47 (LRFD ~90.45)");

  var capRows = WB.capacityAnalysisRowsWithoutDeflection(
    catalog,
    method,
    sec0,
    fy,
    E
  );
  assert(
    capRows.length === catalog.length,
    "capacity table rows should match catalog length"
  );
  var capW12 = capRows.find(function (row) {
    return row.label === "W12X16";
  });
  assert(capW12 && capW12.safe, "capacity row W12X16 should be SAFE!");

  /*
   * Deflection path: workbook Z45 = MINIFS(weight G, REMARKS Ix U, "SAFE!") — moment column T is separate.
   * Lightest W-shape with I_x > Y31 in `aisc-sections.json` is W10X12 (not W12X16).
   */
  var sec0Ix = Object.assign({}, sec0, {
    deflectionNorm: "considering deflection",
  });
  var pickIx = WB.pickLightestSection(catalog, method, sec0Ix);
  assert(pickIx && pickIx.sec, "deflection pick should exist");
  assert(
    pickIx.sec.label === "W10X12",
    "MINIFS(Ix): expected W10X12, got " + (pickIx.sec && pickIx.sec.label)
  );
  approx(pickIx.sec.weightPlf, 12, 1e-9, "deflection pick weight");
  assert(pickIx.sec.Ix > ixReq, "Ix must be strictly greater than Y31");
  assert(pickIx.momentOk === false, "W10X12 phiMn should not exceed O39 (~90 kip·ft)");

  var defCapRows = WB.capacityAnalysisRowsConsideringDeflection(
    catalog,
    method,
    sec0Ix,
    fy,
    E
  );
  assert(
    defCapRows.length === catalog.length,
    "deflection capacity table rows should match catalog length"
  );
  var defW10 = defCapRows.find(function (row) {
    return row.label === "W10X12";
  });
  assert(defW10 && defW10.ixSafe, "deflection capacity row W10X12 Ix REMARK should pass");
  assert(
    defW10 && defW10.momentSafe === false,
    "deflection capacity row W10X12 moment REMARK should fail vs demand"
  );
})();

/* ── Fixture B: ASD governing service load and selection path ── */
(function fixtureASD() {
  var method = "ASD";
  var DL = 8;
  var LL = 12;
  var L_ft = 5;
  var E = 29000;
  var fy = 60;

  var wGov = WB.wuGoverning(method, DL, LL);
  approx(wGov, 20, 1e-12, "ASD allowable w (DL+LL)");

  var O39 = WB.muDemandFromW(wGov, L_ft);
  approx(O39, 62.5, 1e-12, "ASD Ma demand (wL^2/8)");

  var sec0 = {
    fy: fy,
    E: E,
    DL: DL,
    LL: LL,
    L_ft: L_ft,
    wGov: wGov,
    O39: O39,
    manualMu: 0,
    ixReq: WB.ixRequiredExcel(LL, L_ft, E, 360),
    manualIx: 0,
    deflectionNorm: "without considering deflection",
    beamWeightNorm: "consider beam weight",
  };

  var pick = WB.pickLightestSection(catalog, method, sec0);
  assert(pick && pick.sec, "ASD pick should exist");
  assert(pick.phiMn > pick.momentDemand, "ASD Ma capacity should exceed demand");
})();

/* ── Fixture C: beam weight line load matches capacity-sheet R-column pattern ── */
(function fixtureBeamWeightLineLoad() {
  var DL = 8;
  var LL = 12;
  var wPlf = 16;
  var r = WB.lineLoadWithBeam("LRFD", DL, LL, wPlf, "consider beam weight");
  approx(r, 1.2 * (DL + wPlf / 1000) + 1.6 * LL, 1e-12, "LRFD w with beam weight");
  var wGovLrfd = WB.wuGoverning("LRFD", DL, LL);
  approx(
    WB.lineLoadWithBeam("LRFD", DL, LL, wPlf, "ignore beam weight"),
    0,
    1e-12,
    "ignore beam weight LRFD uses zero row load (capacity sheet R)"
  );
  approx(
    WB.lineLoadWithBeam("ASD", DL, LL, wPlf, "ignore beam weight"),
    0,
    1e-12,
    "ignore beam weight ASD uses zero row load (capacity sheet R)"
  );
})();

/* ── Fixture D: Kc per AISC F4.1 (clamped 0.35–0.76) ── */
(function fixtureKcClamp() {
  var hiLwSec = { bf: 12, tf: 0.5, tw: 0.08, d: 50, Zx: 100, Sx: 90 };
  approx(WB.kcWeb(hiLwSec), 0.35, 1e-9, "kc floor at 0.35");
  var lowLwSec = { bf: 8, tf: 2, tw: 0.25, d: 10, Zx: 50, Sx: 45 };
  approx(WB.kcWeb(lowLwSec), 0.76, 1e-9, "kc cap at 0.76");
})();

/* ── Fixture E: Excel-export λf / λw in catalog (Mn/Kc/Mu chain matches workbook) ── */
(function fixtureCatalogSlendernessExport() {
  var sec408 = catalog.find(function (s) {
    return s.label === "W44X408";
  });
  assert(sec408, "W44X408 in catalog");
  approx(sec408.lambdaW, 31.9, 1e-9, "Key Geometric Properties λw");
  approx(WB.webSlendernessRatio(sec408), 31.9, 1e-9, "solver uses catalog λw");
  var lwGeom = (sec408.d - 2 * sec408.tf) / sec408.tw;
  assert(
    Math.abs(lwGeom - sec408.lambdaW) > 0.5,
    "expected geometric h/tw to differ from sheet λw (why JSON export matters)"
  );
})();

/* ── Fixture F: strict capacity row parity for benchmark sections ── */
(function fixtureCapacityRowParityBenchmarks() {
  var workbookPath = path.join(root, "Born2BeSteel Final (2).xlsx");
  if (!fs.existsSync(workbookPath)) {
    console.warn(
      "bending-design-regression: skipping Excel row parity (missing " +
        path.basename(workbookPath) +
        "). Copy the workbook into steel-design-system/ to run those checks."
    );
    return;
  }

  var sec0 = {
    fy: 60,
    E: 29000,
    DL: 8,
    LL: 12,
    L_ft: 5,
    wGov: WB.wuGoverning("LRFD", 8, 12),
    O39: WB.muDemandFromW(WB.wuGoverning("LRFD", 8, 12), 5),
    manualMu: 0,
    ixReq: WB.ixRequiredExcel(12, 5, 29000, 360),
    manualIx: 0,
    deflectionNorm: "without considering deflection",
    beamWeightNorm: "consider beam weight",
  };

  var expected = Bench.extractBenchmarks(workbookPath, Bench.DEFAULT_LABELS);

  var rowsNo = WB.capacityAnalysisRowsWithoutDeflection(
    catalog,
    "LRFD",
    sec0,
    60,
    29000
  );
  var rowsDef = WB.capacityAnalysisRowsConsideringDeflection(
    catalog,
    "LRFD",
    Object.assign({}, sec0, { deflectionNorm: "considering deflection" }),
    60,
    29000
  );

  function rowByLabel(list, label) {
    return list.find(function (r) {
      return r.label === label;
    });
  }

  Bench.DEFAULT_LABELS.forEach(function (label) {
    var n = rowByLabel(rowsNo, label);
    var en = expected.noDeflection[label];
    assert(n, label + " exists in no-deflection rows");
    approx(n.W, Number(en.G), 1e-12, label + " no-defl W");
    approx(n.lf, Number(en.H), 1e-12, label + " no-defl λf");
    approx(n.lw, Number(en.I), 1e-12, label + " no-defl λw");
    approx(n.Zx, Number(en.J), 1e-12, label + " no-defl Zx");
    approx(n.Sx, Number(en.K), 1e-12, label + " no-defl Sx");
    approx(n.Kc, Number(en.L), 1e-12, label + " no-defl Kc");
    approx(n.lambdaPf, Number(en.M), 1e-12, label + " no-defl λpf");
    approx(n.lambdaRf, Number(en.N), 1e-12, label + " no-defl λrf");
    approx(n.Mp, Number(en.O), 1e-12, label + " no-defl Mp");
    assert(String(n.compactness) === String(en.P), label + " no-defl compactness");
    approx(n.Mn, Number(en.Q), 1e-12, label + " no-defl Mn");
    approx(n.WuBeam, Number(en.R), 1e-12, label + " no-defl Wu");
    approx(n.MuBeam, Number(en.S), 1e-12, label + " no-defl Mu(w/beam)");
    approx(n.phiMn, Number(en.T), 1e-12, label + " no-defl Mu column");
    assert(n.safe === (String(en.U) === "SAFE!"), label + " no-defl REMARK");

    var d = rowByLabel(rowsDef, label);
    var ed = expected.withDeflection[label];
    assert(d, label + " exists in deflection rows");
    approx(d.W, Number(ed.G), 1e-12, label + " defl W");
    approx(d.lf, Number(ed.H), 1e-12, label + " defl λf");
    approx(d.lw, Number(ed.I), 1e-12, label + " defl λw");
    approx(d.Zx, Number(ed.J), 1e-12, label + " defl Zx");
    approx(d.Sx, Number(ed.K), 1e-12, label + " defl Sx");
    approx(d.Kc, Number(ed.L), 1e-12, label + " defl Kc");
    approx(d.lambdaPf, Number(ed.M), 1e-12, label + " defl λpf");
    approx(d.lambdaRf, Number(ed.N), 1e-12, label + " defl λrf");
    approx(d.Mp, Number(ed.O), 1e-12, label + " defl Mp");
    assert(String(d.compactness) === String(ed.P), label + " defl compactness");
    approx(d.Mn, Number(ed.Q), 1e-12, label + " defl Mn");
    approx(
      d.muColumnDesignStrength,
      Number(ed.R),
      1e-12,
      label + " defl Mu column"
    );
    approx(d.Ix, Number(ed.S), 1e-12, label + " defl Ix");
    assert(
      d.momentSafe === (String(ed.T) === "SAFE!"),
      label + " defl REMARK(Mu)"
    );
    assert(d.ixSafe === (String(ed.U) === "SAFE!"), label + " defl REMARK(Ix)");
  });
})();

console.log("bending-design-regression: all checks passed.");
