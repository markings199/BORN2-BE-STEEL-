/**
 * Born2BeSteel `Bending Analysis` sheet math (U33, U38, pivot FN14/FN17 semantics).
 * Exported Mn_kip_ft / Mdesign_kip_ft match workbook U33 and U38 (kip·ft after FN19 × 1/12).
 * FN17 (`aisc shapes database (2)`): compares pivot FN7 (λ_f) to Bending Analysis N33/N35
 * (`0.38√(O12/W10)` and `√(O12/W10)` — Final (3).xlsx), not Design limits.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  /** Always expose on `globalThis` so browser UI sees `BendingAnalysisWorkbook` even when `module` exists. */
  root.BendingAnalysisWorkbook = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function clamp(n, a, b) {
    if (!Number.isFinite(n)) return n;
    return Math.min(b, Math.max(a, n));
  }

  /** Same as `Bending Analysis`!N33 — λ_pf = 0.38√(E/Fy). */
  function lambdaPfAnalysis(E_ksi, fy_ksi) {
    return 0.38 * Math.sqrt(E_ksi / fy_ksi);
  }

  /** Same as `Bending Analysis`!N35 — λ_rf = 1.0√(E/Fy). */
  function lambdaRfAnalysis(E_ksi, fy_ksi) {
    return 1 * Math.sqrt(E_ksi / fy_ksi);
  }

  /**
   * **`='aisc shapes database (2)'!FN17`** — pivot flange class (`Born2BeSteel Final (3).xlsx`).
   * Same numeric result as the nested-IF below when both FN7 comparands equal **λ_f** for the active row.
   */
  function flangeClassPivot(lambdaF, lpAnalysis, lrAnalysis) {
    var lp = Number.isFinite(lpAnalysis) ? lpAnalysis : 0;
    var lr = Number.isFinite(lrAnalysis) ? lrAnalysis : 0;
    if (lambdaF < lp) return "Compact Flange";
    if (lambdaF < lr) return "Non-compact Flange";
    return "Slender Flange";
  }

  /**
   * Explicit nested IF from the workbook (same sheet semantics as Final (3).xlsx):
   * `IF(FN7<'Bending Analysis'!$N$33,"Compact Flange",IF('aisc shapes database (2)'!FN7<'Bending Analysis'!$N$35,"Non-compact Flange","Slender Flange"))`.
   * FN7 (local) and aisc-shapes FN7 are both the row flange slenderness lambda_f; N33 and N35 are Analysis lambda_pf and lambda_rf.
   * Pass the same lambda_f twice unless a caller has two distinct inputs (Excel quirk / future use).
   */
  function flangeClassNestedIf(fn7Local, fn7ShapesDb, lpN33, lrN35) {
    var lp = Number.isFinite(lpN33) ? lpN33 : 0;
    var lr = Number.isFinite(lrN35) ? lrN35 : 0;
    if (fn7Local < lp) return "Compact Flange";
    if (fn7ShapesDb < lr) return "Non-compact Flange";
    return "Slender Flange";
  }

  /** Pivot FN14: k_c = 4 / √λ_w (Born2BeSteel does not clamp here). */
  function kcPivot(lambdaW) {
    if (!(lambdaW > 0)) return null;
    return 4 / Math.sqrt(lambdaW);
  }

  /**
   * `Bending Analysis`!U33 — nominal moment.
   * **Compact / slender:** intermediate math in **kip·in**; caller converts compact/slender to kip·ft via ÷12.
   * **Non-compact:** Excel evaluates
   * `FN19 - (FN19 - 0.7*W10*FN10) * t` where **FN19** = `Bending Design`!X10×FN9÷12 is **kip·ft** and **0.7*W10*FN10** is **kip·in**
   * (no ÷12 on the Mr term in the workbook). Return **12×U33_ft** so `computeBorn2BeSteelAnalysis` still does ÷12 once.
   */
  function nominalMomentKipIn(sec, E_ksi, fyAnalysis_ksi, fyMp_ksi, flangeClass, lpAnalysis, lrAnalysis) {
    var lf = sec.lambdaF;
    var Zx = sec.Zx;
    var Sx = sec.Sx;
    var lw = sec.lambdaW;

    var Mp = fyMp_ksi * Zx;
    var Mr = 0.7 * fyAnalysis_ksi * Sx;

    if (flangeClass === "Compact Flange") {
      return Mp;
    }
    if (flangeClass === "Non-compact Flange") {
      /** `Bending Design`!FN19 (kip·ft) — same X10×Zx/12 as compact branch display scale. */
      var fn19KipFt = (fyMp_ksi * Zx) / 12;
      /** Workbook `0.7*Bending Analysis!W10*FN10` — kip·in (Excel mixes with FN19 in U33). */
      var mrKipIn = Mr;
      var denom = lrAnalysis - lpAnalysis;
      var t = denom > 0 ? (lf - lpAnalysis) / denom : 0;
      t = clamp(t, 0, 1);
      var mnKipFt = fn19KipFt - (fn19KipFt - mrKipIn) * t;
      return mnKipFt * 12;
    }

    var kc = kcPivot(lw);
    if (!Number.isFinite(kc)) return null;
    return (0.9 * E_ksi * kc * Sx) / (lf * lf);
  }

  /** `Bending Analysis`!U38 — LRFD: U33×0.9; ASD: U33/1.67 (Mn and output in **kip·ft**, matching U33). */
  function designMomentKipFt(Mn_kip_ft, method) {
    if (!Number.isFinite(Mn_kip_ft)) return null;
    if (method === "LRFD") return 0.9 * Mn_kip_ft;
    return Mn_kip_ft / 1.67;
  }

  function computeBorn2BeSteelAnalysis(sec, opts) {
    var E = opts.E;
    var fy = opts.Fy;
    /** Design **X10** (Mp / FN19); defaults to Analysis **W10** when omitted. */
    var fyMp = Number.isFinite(opts.fyMp) ? opts.fyMp : fy;
    var method = opts.method === "LRFD" ? "LRFD" : "ASD";
    var lpDesign = opts.lpDesign;
    var lrDesign = opts.lrDesign;

    if (
      !sec ||
      ![E, fy, sec.Zx, sec.Sx, sec.lambdaF].every(Number.isFinite) ||
      E <= 0 ||
      fy <= 0
    ) {
      return { ok: false, error: "Invalid section or material inputs." };
    }

    var lfGeom = sec.bf / (2 * sec.tf);
    var lwGeom =
      sec.d > 2 * sec.tf && sec.tw > 0 ? (sec.d - 2 * sec.tf) / sec.tw : null;

    var lambdaF = Number.isFinite(sec.lambdaF) ? sec.lambdaF : lfGeom;
    var lambdaW = Number.isFinite(sec.lambdaW) ? sec.lambdaW : lwGeom;

    if (!(lambdaF > 0)) {
      return { ok: false, error: "Invalid flange slenderness λ_f." };
    }

    var lp = lambdaPfAnalysis(E, fy);
    var lr = lambdaRfAnalysis(E, fy);

    var lpD = Number.isFinite(lpDesign) ? lpDesign : 0;
    var lrD = Number.isFinite(lrDesign) ? lrDesign : 0;
    /** `='aisc shapes database (2)'!FN17` — retained for U33 / nominal moment branch selection. */
    var flangeClassFn17 = flangeClassPivot(lambdaF, lp, lr);
    /** Explicit nested IF (two FN7 slots); for this app both comparands are **λ_f** from the selected section. */
    var classFromNestedIf = flangeClassNestedIf(lambdaF, lambdaF, lp, lr);
    var classificationFormulasMatch = flangeClassFn17 === classFromNestedIf;
    /** Public `flangeClass` remains the FN17 result for backward compatibility. */
    var flangeClass = flangeClassFn17;

    var sec2 = {
      lambdaF: lambdaF,
      lambdaW: lambdaW,
      Zx: sec.Zx,
      Sx: sec.Sx,
      bf: sec.bf,
      tf: sec.tf,
      tw: sec.tw,
      d: sec.d,
    };

    var MnKipIn = nominalMomentKipIn(sec2, E, fy, fyMp, flangeClass, lp, lr);
    if (!Number.isFinite(MnKipIn)) {
      return { ok: false, error: "Cannot compute nominal moment." };
    }

    /** Excel `Bending Analysis`!U33 is **kip·ft** (FN19 × 1/12); convert once here. */
    var MnKipFt = MnKipIn / 12;
    var Mdesign = designMomentKipFt(MnKipFt, method);

    return {
      ok: true,
      values: {
        lambdaF: lambdaF,
        lambdaW: lambdaW,
        lambdaPfDisplay: lp,
        lambdaRfDisplay: lr,
        kc: kcPivot(lambdaW),
        flangeClass: flangeClass,
        flangeClassFn17: flangeClassFn17,
        flangeClassNestedIf: classFromNestedIf,
        classificationFormulasMatch: classificationFormulasMatch,
        Mn_kip_ft: MnKipFt,
        Mdesign_kip_ft: Mdesign,
        method: method,
        /** Limits driving pivot FN17 (`Bending Design`!N33 / N35); blank workbook → 0. */
        /** Design-sheet λ_pf / λ_rf when caller passes `lpDesign`/`lrDesign` (optional UI mirror); not used for FN17. */
        lambdaPfFn17: lpD > 0 ? lpD : NaN,
        lambdaRfFn17: lrD > 0 ? lrD : NaN,
        fyMpUsed: fyMp,
      },
    };
  }

  return {
    lambdaPfAnalysis: lambdaPfAnalysis,
    lambdaRfAnalysis: lambdaRfAnalysis,
    flangeClassPivot: flangeClassPivot,
    flangeClassNestedIf: flangeClassNestedIf,
    kcPivot: kcPivot,
    nominalMomentKipIn: nominalMomentKipIn,
    designMomentKipFt: designMomentKipFt,
    computeBorn2BeSteelAnalysis: computeBorn2BeSteelAnalysis,
  };
});
