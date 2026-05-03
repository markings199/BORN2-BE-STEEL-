/**
 * Born2BeSteel workbook formulas (Excel-accurate).
 * References:
 * - SHEAR DESIGN !I10:AA30, !O26, !R38, !Z38, !F38:G41
 * - Shear-Capacity !L:N, !O:P, !Q:S
 * - SHEAR ANALYSIS !Q39 (Cv), !F39 (LRFD φv), !K39 (ASD Ωv), !Y28 (Vn), !Y38 (design strength row)
 */
(function (global) {
  "use strict";

  /**
   * @typedef {Object} ShearSectionProps
   * @property {string} aiscManualLabel
   * @property {number} weightPlf
   * @property {number} d
   * @property {number} tw
   * @property {number|null} lambdaW h/tw from Key Geometric Properties (Excel column K)
   */

  /**
   * LRFD factored uniform load (kip/ft) combinations — Excel `V30`, `AA30`, `O26`.
   * @param {"LRFD"|"ASD"} method
   * @param {number} dl
   * @param {number} ll
   */
  function governingUniformLoad(method, dl, ll) {
    var V30 =
      method === "LRFD"
        ? 1.2 * dl + 1.6 * ll
        : dl + ll;
    var AA30 = method === "LRFD" ? 1.4 * dl : NaN;
    var O26 =
      method === "LRFD"
        ? Math.max(V30, AA30)
        : V30;
    return { V30: V30, AA30: AA30, O26: O26 };
  }

  /** Excel `R38` — moment demand (kip·ft) with Wu in kip/ft, L in ft. */
  function momentDemand_kipft(Wu, Lft) {
    return (Wu * Lft * Lft) / 8;
  }

  /** Excel `Z38` — shear demand (kips). */
  function shearDemand_kips(Wu, Lft) {
    return (Wu * Lft) / 2;
  }

  /**
   * Excel `L` and `M` factors (Shear-Capacity column L, M) — numeric in calculations.
   * L is Cv1-style multiplier 1 or 0.9; M is 1.5 or 1.67 (ASD Ω).
   */
  function excelLM(K, E, Fy) {
    var lim = 2.24 * Math.sqrt(E / Fy);
    var L = K <= lim ? 1 : 0.9;
    var M = K <= lim ? 1.5 : 1.67;
    return { L: L, M: M, lim_224sqrtEFy: lim };
  }

  /** Excel column `N` — Cv2 piecewise (Shear-Capacity). */
  function excelNcv(K, E, Fy) {
    var root = Math.sqrt((5 * E) / Fy);
    var a = 1.1 * root;
    var b = 1.37 * root;
    if (K <= a) return 1;
    if (K <= b) return a / K;
    return 1;
  }

  /**
   * Excel `SHEAR ANALYSIS` !Q39 — web shear coefficient Cv (numeric).
   * IF(K≤2.24√(E/Fy),1, IF(K≤1.1√(5E/Fy),1, 1.1√(5E/Fy)/K))
   */
  function shearAnalysisCv(K, E, Fy) {
    if (!Number.isFinite(K) || !Number.isFinite(E) || !Number.isFinite(Fy) || K <= 0 || E <= 0 || Fy <= 0)
      return NaN;
    var lim224 = 2.24 * Math.sqrt(E / Fy);
    var lim110 = 1.1 * Math.sqrt((5 * E) / Fy);
    if (K <= lim224) return 1;
    if (K <= lim110) return 1;
    return lim110 / K;
  }

  /**
   * Excel `SHEAR ANALYSIS` !F39 — LRFD φv.
   * IF(K≤2.24√(E/Fy),1, IF(K≤1.1√(5E/Fy),0.9,0))
   */
  function shearAnalysisPhiLRFD(K, E, Fy) {
    if (!Number.isFinite(K) || !Number.isFinite(E) || !Number.isFinite(Fy) || K <= 0 || E <= 0 || Fy <= 0)
      return NaN;
    var lim224 = 2.24 * Math.sqrt(E / Fy);
    var lim110 = 1.1 * Math.sqrt((5 * E) / Fy);
    if (K <= lim224) return 1;
    if (K <= lim110) return 0.9;
    return 0;
  }

  /**
   * Excel `SHEAR ANALYSIS` !K39 — ASD Ωv (numeric; workbook stores strings "1.5"/"1.67").
   * IF(K≤2.24√(E/Fy),1.5, IF(K≤1.1√(5E/Fy),1.67,1.67))
   */
  function shearAnalysisOmegaASD(K, E, Fy) {
    if (!Number.isFinite(K) || !Number.isFinite(E) || !Number.isFinite(Fy) || K <= 0 || E <= 0 || Fy <= 0)
      return NaN;
    var lim224 = 2.24 * Math.sqrt(E / Fy);
    var lim110 = 1.1 * Math.sqrt((5 * E) / Fy);
    if (K <= lim224) return 1.5;
    if (K <= lim110) return 1.67;
    return 1.67;
  }

  /** Excel `SHEAR ANALYSIS` !Y28 — nominal shear Vn (kips): 0.6·Fy·Aw·Cv */
  function shearAnalysisVn_kips(Fy, Aw, Cv) {
    return 0.6 * Fy * Aw * Cv;
  }

  /**
   * Excel `SHEAR ANALYSIS` !Y38 — strength shown on analysis row.
   * LRFD: F39·Y28; ASD: K39·Y28 (workbook multiplies Ω×Vn).
   */
  function shearAnalysisDesignStrength_kips(method, phiLRFD, omegaASD, Vn) {
    if (!Number.isFinite(Vn)) return NaN;
    if (method === "ASD") {
      return Number.isFinite(omegaASD) ? omegaASD * Vn : NaN;
    }
    return Number.isFinite(phiLRFD) ? phiLRFD * Vn : NaN;
  }

  /**
   * Demand check vs workbook capacity (strict >).
   * Pass VuDemand as null/undefined to skip (matches Excel row showing only Y38 capacity).
   */
  function shearAnalysisSafeRemark(designStrength, VuDemand) {
    if (!Number.isFinite(designStrength)) return "";
    if (VuDemand == null || !Number.isFinite(Number(VuDemand))) return "";
    return designStrength > Number(VuDemand) ? "SAFE" : "UNSAFE";
  }

  /**
   * One shear analysis row matching `SHEAR ANALYSIS` main calculator chain.
   * @param {ShearSectionProps} sec
   * @param {number} E ksi (workbook N12)
   * @param {number} Fy ksi (workbook X10)
   * @param {"LRFD"|"ASD"} method (workbook F9)
   * @param {number|null|undefined} VuDemand optional demand (kips) for SAFE check vs !Y38; omit for capacity-only
   */
  function evaluateShearAnalysisRow(sec, E, Fy, method, VuDemand) {
    var Aw = sec.d * sec.tw;
    var K =
      sec.lambdaW != null && Number.isFinite(Number(sec.lambdaW)) ? Number(sec.lambdaW) : NaN;
    if (!Number.isFinite(K) || !Number.isFinite(Aw) || Aw <= 0 || K <= 0) {
      return {
        valid: false,
        K: K,
        Aw: Aw,
        Cv: NaN,
        Vn: NaN,
        phiLRFD: NaN,
        omegaASD: NaN,
        designStrength: NaN,
        remark: "",
      };
    }
    var Cv = shearAnalysisCv(K, E, Fy);
    var Vn = shearAnalysisVn_kips(Fy, Aw, Cv);
    var phiLRFD = shearAnalysisPhiLRFD(K, E, Fy);
    var omegaASD = shearAnalysisOmegaASD(K, E, Fy);
    var designStrength = shearAnalysisDesignStrength_kips(method, phiLRFD, omegaASD, Vn);
    var remark = shearAnalysisSafeRemark(designStrength, VuDemand);
    return {
      valid: true,
      K: K,
      Aw: Aw,
      Cv: Cv,
      Vn: Vn,
      phiLRFD: phiLRFD,
      omegaASD: omegaASD,
      designStrength: designStrength,
      remark: remark,
    };
  }

  /** Excel `O` — nominal shear Vn (kips): 0.6*Fy*Aw*Ncv with Aw = d*tw. */
  function nominalShearVn_kips(Fy, Aw, Ncv) {
    return 0.6 * Fy * Aw * Ncv;
  }

  /** Excel `P` — design shear strength (LRFD: L*O; ASD: O/M). */
  function designShearStrength_kips(method, L, M, Vn) {
    return method === "LRFD" ? L * Vn : Vn / M;
  }

  /** Excel `Q` — SAFE when P > Vu_demand (strict). */
  function safeRemark(P, VuDemand) {
    return P > VuDemand ? "SAFE" : "UNSAFE";
  }

  /**
   * One row of `Shear-Capacity` for current design inputs.
   * @param {ShearSectionProps} sec
   * @param {number} E ksi
   * @param {number} Fy ksi
   * @param {"LRFD"|"ASD"} method
   * @param {number} VuDemand Excel `Z38`
   */
  function evaluateCapacityRow(sec, E, Fy, method, VuDemand) {
    var Aw = sec.d * sec.tw;
    var K = sec.lambdaW != null && Number.isFinite(Number(sec.lambdaW)) ? Number(sec.lambdaW) : NaN;
    if (!Number.isFinite(K) || !Number.isFinite(Aw) || Aw <= 0) {
      return {
        valid: false,
        K: K,
        Aw: Aw,
        P: NaN,
        remark: "UNSAFE",
      };
    }
    var lm = excelLM(K, E, Fy);
    var Ncv = excelNcv(K, E, Fy);
    var Vn = nominalShearVn_kips(Fy, Aw, Ncv);
    var P = designShearStrength_kips(method, lm.L, lm.M, Vn);
    return {
      valid: true,
      K: K,
      Aw: Aw,
      Lfac: lm.L,
      Mfac: lm.M,
      Ncv: Ncv,
      Vn: Vn,
      P: P,
      remark: safeRemark(P, VuDemand),
    };
  }

  /**
   * Lightest adequate section — Excel `G38` (min R where Q=SAFE), `F44`, `G41`.
   * @param {string[]} orderedLabels Uppercase labels in `Shear-Capacity` sheet order (column F top→bottom).
   * @param {Record<string, ShearSectionProps>} byUpperLabel
   */
  function lightestSafeSection(orderedLabels, byUpperLabel, E, Fy, method, VuDemand) {
    var best = null;
    for (var i = 0; i < orderedLabels.length; i++) {
      var lab = orderedLabels[i];
      var sec = byUpperLabel[lab];
      if (!sec) continue;
      var row = evaluateCapacityRow(sec, E, Fy, method, VuDemand);
      if (!row.valid || row.remark !== "SAFE") continue;
      var w = Number(sec.weightPlf);
      if (!best || w < best.weightPlf || (w === best.weightPlf && i < best.orderIndex)) {
        best = {
          label: sec.aiscManualLabel,
          weightPlf: w,
          phiVnOrAllow: row.P,
          orderIndex: i,
        };
      }
    }
    return best;
  }

  function computeShearDesign(inputs) {
    var method = inputs.method === "ASD" ? "ASD" : "LRFD";
    var dl = Number(inputs.dl);
    var ll = Number(inputs.ll);
    var Lft = Number(inputs.Lft);
    var E = Number(inputs.E);
    var Fy = Number(inputs.Fy);
    var loads = governingUniformLoad(method, dl, ll);
    var Wu = loads.O26;
    var Mu_kipft = momentDemand_kipft(Wu, Lft);
    var Vu = shearDemand_kips(Wu, Lft);
    var orderedLabels = inputs.orderedLabels || [];
    var byUpperLabel = inputs.byUpperLabel || {};
    var pick = lightestSafeSection(orderedLabels, byUpperLabel, E, Fy, method, Vu);
    return {
      method: method,
      dl: dl,
      ll: ll,
      Lft: Lft,
      E: E,
      Fy: Fy,
      V30: loads.V30,
      AA30: loads.AA30,
      governingWu: Wu,
      Mu_kipft: Mu_kipft,
      Vu_kips: Vu,
      lightest: pick,
    };
  }

  /** Workbook `SHEAR ANALYSIS` material modulus cell N12 (ksi); same for LRFD and ASD in sheet F9. */
  var SHEAR_ANALYSIS_DEFAULT_E_KSI = 29000;

  var api = {
    SHEAR_ANALYSIS_DEFAULT_E_KSI: SHEAR_ANALYSIS_DEFAULT_E_KSI,
    governingUniformLoad: governingUniformLoad,
    momentDemand_kipft: momentDemand_kipft,
    shearDemand_kips: shearDemand_kips,
    excelLM: excelLM,
    excelNcv: excelNcv,
    shearAnalysisCv: shearAnalysisCv,
    shearAnalysisPhiLRFD: shearAnalysisPhiLRFD,
    shearAnalysisOmegaASD: shearAnalysisOmegaASD,
    shearAnalysisVn_kips: shearAnalysisVn_kips,
    shearAnalysisDesignStrength_kips: shearAnalysisDesignStrength_kips,
    evaluateCapacityRow: evaluateCapacityRow,
    evaluateShearAnalysisRow: evaluateShearAnalysisRow,
    lightestSafeSection: lightestSafeSection,
    computeShearDesign: computeShearDesign,
  };

  global.ShearDesignWorkbook = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
