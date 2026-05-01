/**
 * Born2BeSteel `Bending Analysis` sheet math (U33, U38, pivot FN14/FN17 semantics).
 * Matches cached values in Born2BeSteel Final (2).xlsx for shipped workbook state.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.BendingAnalysisWorkbook = factory();
  }
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
   * Pivot FN17 (`aisc shapes database (2)`): Excel implements
   * IF(FN7<'Bending Design'!$N$33,"Compact", IF(FN7<'Bending Design'!$N$35,"Non-compact","Slender")).
   * Shipped workbook leaves Design λ limits blank → comparisons vs 0 → slender branch (parity).
   * Pass finite lpDesign/lrDesign when coupling to populated Design N33/N35.
   */
  function flangeClassPivot(lambdaF, lpDesign, lrDesign) {
    var lp = Number.isFinite(lpDesign) ? lpDesign : 0;
    var lr = Number.isFinite(lrDesign) ? lrDesign : 0;
    if (lambdaF < lp) return "Compact Flange";
    if (lambdaF < lr) return "Non-compact Flange";
    return "Slender Flange";
  }

  /** Pivot FN14: k_c = 4 / √λ_w (Born2BeSteel does not clamp here). */
  function kcPivot(lambdaW) {
    if (!(lambdaW > 0)) return null;
    return 4 / Math.sqrt(lambdaW);
  }

  /**
   * `Bending Analysis`!U33 — nominal moment (kip·inch). Branches match workbook IF structure.
   * Compact branch uses pivot **FN19** = `Bending Design`!X10 × FN9 (Mp ∝ **Design** Fy).
   * Non-compact **Mr** term uses **Analysis** `W10` × FN10 per Excel (0.7 × `Bending Analysis`!W10 × FN10).
   * Denominators (N33, N35) use Analysis λ_pf / λ_rf (`lpAnalysis`, `lrAnalysis`).
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
      var denom = lrAnalysis - lpAnalysis;
      var t = denom > 0 ? (lf - lpAnalysis) / denom : 0;
      t = clamp(t, 0, 1);
      var Mn = Mp - (Mp - Mr) * t;
      return clamp(Mn, Math.min(Mp, Mr), Math.max(Mp, Mr));
    }

    var kc = kcPivot(lw);
    if (!Number.isFinite(kc)) return null;
    return (0.9 * E_ksi * kc * Sx) / (lf * lf);
  }

  /** `Bending Analysis`!U38 — LRFD: U33×0.9; ASD: U33/1.67 (same numeric meaning as Excel). */
  function designMomentKipIn(Mn_kip_in, method) {
    if (!Number.isFinite(Mn_kip_in)) return null;
    if (method === "LRFD") return 0.9 * Mn_kip_in;
    return Mn_kip_in / 1.67;
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
    var flangeClass = flangeClassPivot(lambdaF, lpD, lrD);

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

    var Mn = nominalMomentKipIn(sec2, E, fy, fyMp, flangeClass, lp, lr);
    if (!Number.isFinite(Mn)) {
      return { ok: false, error: "Cannot compute nominal moment." };
    }

    var Mdesign = designMomentKipIn(Mn, method);

    return {
      ok: true,
      values: {
        lambdaF: lambdaF,
        lambdaW: lambdaW,
        lambdaPfDisplay: lp,
        lambdaRfDisplay: lr,
        kc: kcPivot(lambdaW),
        flangeClass: flangeClass,
        Mn_kip_in: Mn,
        Mdesign_kip_in: Mdesign,
        method: method,
        /** Limits driving pivot FN17 (`Bending Design`!N33 / N35); blank workbook → 0. */
        lambdaPfFn17: lpD,
        lambdaRfFn17: lrD,
        fyMpUsed: fyMp,
      },
    };
  }

  return {
    lambdaPfAnalysis: lambdaPfAnalysis,
    lambdaRfAnalysis: lambdaRfAnalysis,
    flangeClassPivot: flangeClassPivot,
    kcPivot: kcPivot,
    nominalMomentKipIn: nominalMomentKipIn,
    designMomentKipIn: designMomentKipIn,
    computeBorn2BeSteelAnalysis: computeBorn2BeSteelAnalysis,
  };
});
