/**
 * Born2BeSteel workbook formulas (Excel-accurate).
 * References:
 * - SHEAR DESIGN !I10:AA30, !O26, !R38, !Z38/Z49 (lightest flexure & **`AC`** shear strength), !F38:G41
 * - Shear Capacity no deflection / w deflection **`AC`** (design shear for **`AD`** SAFE vs `MAX(G51,G55)`), not legacy **`P`**
 * - Shear Capacity no deflection **`X`** (moment SAFE): `MAX('Bending Design'!O45,'Bending Design'!O39,V)` — not `Shear Design` O39
 * - Shear-Capacity !L:N, !O:P, !Q:S (table helper column **`P`** remains available via `evaluateCapacityRow`)
 * - SHEAR ANALYSIS !Q39 (Cv — Web Factor), !F39 (LRFD φv), !K39 (ASD Ωv), !Y28 (Vn), !Y38 (design strength)
 *   Y38: IF(F9="LRFD",F39*Y28,IF(F9="ASD",Y28/K39)); Cv matches IF(G32<=1.1*√(5N12/X10),1,…)
 */
(function (global) {
  "use strict";

  /**
   * @typedef {Object} ShearSectionProps
   * @property {string} aiscManualLabel
   * @property {number} weightPlf
   * @property {number} d
   * @property {number} tw
   * @property {number|null} lambdaW h/tw from Key Geometric Properties (Excel column L)
   * @property {number|null} [lambdaF] flange slenderness bf/2tf (Excel column K)
   * @property {number|null} [Zx] plastic modulus Zx (in³) — Excel column M
   * @property {number|null} [Sx] elastic section modulus Sx (in³) — Excel column N
   * @property {number|null} [Ix] moment of inertia Ix (in⁴) — deflection capacity sheet column V
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
   * Excel `SHEAR ANALYSIS` Web Factor (!Q39 / G32 with N12=E, X10=Fy):
   * IF(G32<=1.1*SQRT(5*N12/X10),1,
   * IF(G32<=1.37*SQRT(5*N12/X10),(1.1*SQRT(5*N12/X10))/G32,(1.51*N12*5)/(X10*G32^2)))
   */
  function shearAnalysisCv(K, E, Fy) {
    if (!Number.isFinite(K) || !Number.isFinite(E) || !Number.isFinite(Fy) || K <= 0 || E <= 0 || Fy <= 0)
      return NaN;
    var sqrt5N12overX10 = Math.sqrt((5 * E) / Fy);
    var lim11 = 1.1 * sqrt5N12overX10;
    var lim137 = 1.37 * sqrt5N12overX10;
    if (K <= lim11) return 1;
    if (K <= lim137) return lim11 / K;
    return (1.51 * E * 5) / (Fy * K * K);
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
   * Excel `SHEAR ANALYSIS` !Y38 — IF(F9="LRFD",F39*Y28,IF(F9="ASD",Y28/K39)).
   * LRFD: φv·Vn (F39·Y28); ASD: Vn/Ωv (Y28/K39).
   */
  function shearAnalysisDesignStrength_kips(method, phiLRFD, omegaASD, Vn) {
    if (!Number.isFinite(Vn)) return NaN;
    if (method === "ASD") {
      return Number.isFinite(omegaASD) && omegaASD !== 0 ? Vn / omegaASD : NaN;
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
   * Excel **`Shear Capacity no deflection` / `Shear Capacity w deflection` column `AC`** (design shear strength
   * shown as **`Va=`/`Vu=` on Shear Design Z49**), NOT legacy column **`P`**.
   *
   * `LRFD`: `AC = AB × Y` where `AB = 0.6·Fy·Aw·Cv`, Cv matches SHEAR ANALYSIS (`shearAnalysisCv`),
   * `Y = IF(htw ≤ 2.24√(E/Fy), 1, 0.9)`.
   * `ASD`: `AC = AB / Z` where `Z = IF(htw ≤ 2.24√(E/Fy), 1.5, 1.67)`.
   * Demand comparison (`AD`): **`AC > MAX(G51,G55)`** (strict `>`).
   */
  function shearCapacitySheetDesignStrengthAC_kips(sec, E, Fy, method) {
    var Aw = sec.d * sec.tw;
    var K =
      sec.lambdaW != null && Number.isFinite(Number(sec.lambdaW)) ? Number(sec.lambdaW) : NaN;
    if (!Number.isFinite(K) || !Number.isFinite(Aw) || Aw <= 0 || K <= 0) return NaN;
    if (!Number.isFinite(E) || !Number.isFinite(Fy) || E <= 0 || Fy <= 0) return NaN;
    var Cv = shearAnalysisCv(K, E, Fy);
    var AB = 0.6 * Fy * Aw * Cv;
    var lim224 = 2.24 * Math.sqrt(E / Fy);
    if (method === "ASD") {
      var Z = K <= lim224 ? 1.5 : 1.67;
      return AB / Z;
    }
    var Y = K <= lim224 ? 1 : 0.9;
    return AB * Y;
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

  function trimLower(s) {
    return String(s == null ? "" : s)
      .trim()
      .toLowerCase();
  }

  function isConsideringDeflectionMode(deflectionMode) {
    return trimLower(deflectionMode) === "considering deflection";
  }

  function isConsiderBeamWeightMode(beamWeightMode) {
    return trimLower(beamWeightMode) === "consider beam weight";
  }

  /**
   * Excel `Bending Design` default O39 (kip·ft) with initial G22=8, G27=12, G33=5 ft, ASD: (DL+LL)L²/8.
   * Used by `Shear Capacity no deflection` column X Active_Mu when bending inputs are not supplied.
   */
  var EXCEL_BENDING_DESIGN_DEFAULT_O39_KIPFT = ((8 + 12) * (5 * 5)) / 8;

  /**
   * Shear Design `Y31` — required Ix (in⁴) for LL-only uniform load and span L (ft).
   * (T50*5*(G27*1/12)*(G33*12)^4)/(384*P12*(G33*12))
   */
  function requiredIxY31_in4(deflDivisor, ll_klf, Lft, E_ksi) {
    var T50 = Number(deflDivisor);
    var G27 = Number(ll_klf);
    var G33 = Number(Lft);
    var P12 = Number(E_ksi);
    if (!Number.isFinite(T50) || T50 <= 0) return NaN;
    if (!Number.isFinite(G27) || G27 < 0) return NaN;
    if (!Number.isFinite(G33) || G33 <= 0) return NaN;
    if (!Number.isFinite(P12) || P12 <= 0) return NaN;
    var w_kipin = G27 / 12;
    var L_in = G33 * 12;
    return (T50 * 5 * w_kipin * Math.pow(L_in, 4)) / (384 * P12 * L_in);
  }

  /** Excel `Shear Capacity` flange S — COMPACT / NON-COMPACT / SLENDER (P,Q columns). */
  function flangeSlendernessClassExcel(lambdaF, E, Fy) {
    var K = Number(lambdaF);
    if (!Number.isFinite(K) || K <= 0) return "";
    var P = 0.38 * Math.sqrt(E / Fy);
    var Q = 1 * Math.sqrt(E / Fy);
    if (K < P) return "COMPACT";
    if (K < Q) return "NON-COMPACT";
    return "SLENDER";
  }

  /**
   * Nominal flexural strength T (kip·ft) — column T on capacity sheets (before φ/Ω).
   * @param {"noDefl"|"wDefl"} sheetVariant middle-branch Fy·Sx term matches each sheet.
   */
  function nominalFlexuralT_kipft(sec, E, Fy, sheetVariant) {
    var Zx = sec.Zx != null && Number.isFinite(Number(sec.Zx)) ? Number(sec.Zx) : NaN;
    var Sx = sec.Sx != null && Number.isFinite(Number(sec.Sx)) ? Number(sec.Sx) : NaN;
    var Kf = sec.lambdaF != null && Number.isFinite(Number(sec.lambdaF)) ? Number(sec.lambdaF) : NaN;
    var Kw = sec.lambdaW != null && Number.isFinite(Number(sec.lambdaW)) ? Number(sec.lambdaW) : NaN;
    if (!Number.isFinite(Zx) || !Number.isFinite(Sx) || !Number.isFinite(Kf) || !Number.isFinite(Kw))
      return NaN;
    var R = (Fy * Zx) / 12;
    var P = 0.38 * Math.sqrt(E / Fy);
    var Q = 1 * Math.sqrt(E / Fy);
    var O = 4 / Math.sqrt(Kw);
    var cls = flangeSlendernessClassExcel(Kf, E, Fy);
    if (cls === "COMPACT") return R;
    // Workbook stored values for both no-deflection and considering-deflection sheets
    // align to kip-ft units with /12 on the 0.7*Fy*Sx term.
    var fySxTerm = (0.7 * Fy * Sx) / 12;
    if (cls === "NON-COMPACT") {
      return R - (R - fySxTerm) * ((Kf - P) / (Q - P));
    }
    return (0.9 * E * O * Sx) / (Kf * Kf);
  }

  /** Column W — LRFD 0.9·T, ASD T/1.67 */
  function designFlexuralStrength_kipft(method, T_kipft) {
    if (!Number.isFinite(T_kipft)) return NaN;
    return method === "LRFD" ? 0.9 * T_kipft : T_kipft / 1.67;
  }

  /**
   * Column U on `Shear Capacity no deflection` — factored line load (klf) for optional beam self-weight row;
   * IF(ignore,0, ASD: DL+LL+w/1000, LRFD: 1.2*(DL+w/1000)+1.6*LL).
   */
  function lineLoadWithBeamWeight_klf(method, dl, ll, weightPlf, considerBeamWeight) {
    if (!considerBeamWeight) return 0;
    var wklf = Number(weightPlf) / 1000;
    var d = Number(dl);
    var l = Number(ll);
    if (method === "ASD") return d + l + wklf;
    return 1.2 * (d + wklf) + 1.6 * l;
  }

  function momentFromLineLoad_kipft(w_klf, Lft) {
    var w = Number(w_klf);
    var L = Number(Lft);
    if (!Number.isFinite(w) || !Number.isFinite(L) || L <= 0) return NaN;
    return (w * L * L) / 8;
  }

  /**
   * One row of `Shear Capacity no deflection` (Born2BeSteel Final (5) sheet).
   */
  function evaluateShearCapacityNoDeflectionDesignRow(sec, ctx) {
    var method = ctx.method;
    var E = ctx.E;
    var Fy = ctx.Fy;
    var G51 = ctx.G51;
    var G55 = ctx.G55;
    var dl = ctx.dl;
    var ll = ctx.ll;
    var Lft = ctx.Lft;
    var considerBw = ctx.considerBeamWeight;

    var T = nominalFlexuralT_kipft(sec, E, Fy, "noDefl");
    var W = designFlexuralStrength_kipft(method, T);
    var U = lineLoadWithBeamWeight_klf(method, dl, ll, sec.weightPlf, considerBw);
    var V = momentFromLineLoad_kipft(U, Lft);
    var bend39 = Number(ctx.bendingO39);
    if (!Number.isFinite(bend39)) bend39 = EXCEL_BENDING_DESIGN_DEFAULT_O39_KIPFT;
    var bend45 = Number(ctx.bendingO45);
    if (!Number.isFinite(bend45)) bend45 = 0;
    var activeMu = Math.max(bend45, bend39, Number(V) || 0);
    var momentRemark = Number.isFinite(W) && W > activeMu ? "SAFE!" : "UNSAFE :<";

    var shearStrengthAC = shearCapacitySheetDesignStrengthAC_kips(sec, E, Fy, method);
    var activeVu = Math.max(Number(G51) || 0, Number(G55) || 0);
    var shearRemark =
      Number.isFinite(shearStrengthAC) && shearStrengthAC > activeVu ? "SAFE" : "UNSAFE";

    var aeYes = momentRemark === "SAFE!" && shearRemark === "SAFE";

    return {
      valid: Number.isFinite(shearStrengthAC) && Number.isFinite(W),
      T: T,
      W: W,
      momentRemark: momentRemark,
      shearDesignP: shearStrengthAC,
      shearRemark: shearRemark,
      aeYes: aeYes,
    };
  }

  /**
   * One row of `Shear Capacity w deflection` — moment (W), Ix (X), shear (AD), AE.
   */
  function evaluateShearCapacityWDeflectionDesignRow(sec, ctx) {
    var method = ctx.method;
    var E = ctx.E;
    var Fy = ctx.Fy;
    var O39 = ctx.O39;
    var O46 = ctx.O46;
    var Y31 = ctx.Y31;
    var G51 = ctx.G51;
    var G55 = ctx.G55;

    var T = nominalFlexuralT_kipft(sec, E, Fy, "wDefl");
    var U = designFlexuralStrength_kipft(method, T);
    var activeMu = Number(O46) > 0 ? Number(O46) : Number(O39) || 0;
    var momentRemark = Number.isFinite(U) && U > activeMu ? "SAFE!" : "UNSAFE :<";

    var Ix = sec.Ix != null && Number.isFinite(Number(sec.Ix)) ? Number(sec.Ix) : NaN;
    var ixRemark =
      Number.isFinite(Ix) && Number.isFinite(Y31) && Ix > Y31 ? "SAFE!" : "UNSAFE :<";

    var shearStrengthAC = shearCapacitySheetDesignStrengthAC_kips(sec, E, Fy, method);
    var activeVu = Math.max(Number(G51) || 0, Number(G55) || 0);
    var shearRemark =
      Number.isFinite(shearStrengthAC) && shearStrengthAC > activeVu ? "SAFE" : "UNSAFE";

    var aeYes = ixRemark === "SAFE!" && shearRemark === "SAFE" && momentRemark === "SAFE!";

    return {
      valid: Number.isFinite(shearStrengthAC) && Number.isFinite(U),
      T: T,
      U: U,
      momentRemark: momentRemark,
      ixRemark: ixRemark,
      shearDesignP: shearStrengthAC,
      shearRemark: shearRemark,
      aeYes: aeYes,
    };
  }

  function lightestShearDesignCapacitySection(orderedLabels, byUpperLabel, ctx) {
    var best = null;
    for (var i = 0; i < orderedLabels.length; i++) {
      var lab = orderedLabels[i];
      var sec = byUpperLabel[lab];
      if (!sec) continue;
      var row = ctx.consideringDeflection
        ? evaluateShearCapacityWDeflectionDesignRow(sec, ctx)
        : evaluateShearCapacityNoDeflectionDesignRow(sec, ctx);
      if (!row.valid || !row.aeYes) continue;
      var w = Number(sec.weightPlf);
      if (!best || w < best.weightPlf || (w === best.weightPlf && i < best.orderIndex)) {
        best = {
          label: sec.aiscManualLabel,
          weightPlf: w,
          phiVnOrAllow: row.shearDesignP,
          orderIndex: i,
          flexuralDesign_kipft: ctx.consideringDeflection ? row.U : row.W,
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
    var deflectionMode =
      inputs.deflectionMode != null ? inputs.deflectionMode : "without considering deflection";
    var beamWeightMode =
      inputs.beamWeightMode != null ? inputs.beamWeightMode : "consider beam weight";
    var deflDivisor = inputs.deflDivisor != null ? Number(inputs.deflDivisor) : 360;
    var manualMu = inputs.manualMu != null ? Number(inputs.manualMu) : 0;
    var G55 = inputs.G55 != null ? Number(inputs.G55) : 0;

    var consideringDeflection = isConsideringDeflectionMode(deflectionMode);
    var considerBeamWeight = isConsiderBeamWeightMode(beamWeightMode);

    var bendingO39 =
      inputs.bendingO39 != null && Number.isFinite(Number(inputs.bendingO39))
        ? Number(inputs.bendingO39)
        : EXCEL_BENDING_DESIGN_DEFAULT_O39_KIPFT;
    var bendingO45 =
      inputs.bendingO45 != null && Number.isFinite(Number(inputs.bendingO45))
        ? Number(inputs.bendingO45)
        : 0;

    var loads = governingUniformLoad(method, dl, ll);
    var Wu = loads.O26;
    var Mu_kipft = momentDemand_kipft(Wu, Lft);
    var Vu = shearDemand_kips(Wu, Lft);
    var orderedLabels = inputs.orderedLabels || [];
    var byUpperLabel = inputs.byUpperLabel || {};

    var Y31 = requiredIxY31_in4(deflDivisor, ll, Lft, E);

    var ctx = {
      method: method,
      E: E,
      Fy: Fy,
      O39: Mu_kipft,
      O45: 0,
      bendingO39: bendingO39,
      bendingO45: bendingO45,
      O46: manualMu,
      Y31: Y31,
      G51: Vu,
      G55: G55,
      dl: dl,
      ll: ll,
      Lft: Lft,
      considerBeamWeight: considerBeamWeight,
      consideringDeflection: consideringDeflection,
    };

    var pick = lightestShearDesignCapacitySection(orderedLabels, byUpperLabel, ctx);

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
      Y31_ixRequired_in4: Y31,
      deflectionMode: deflectionMode,
      beamWeightMode: beamWeightMode,
      deflDivisor: deflDivisor,
      lightest: pick,
    };
  }

  /** Workbook `SHEAR ANALYSIS` material modulus cell N12 (ksi); same for LRFD and ASD in sheet F9. */
  var SHEAR_ANALYSIS_DEFAULT_E_KSI = 29000;

  var api = {
    EXCEL_BENDING_DESIGN_DEFAULT_O39_KIPFT: EXCEL_BENDING_DESIGN_DEFAULT_O39_KIPFT,
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
    shearCapacitySheetDesignStrengthAC_kips: shearCapacitySheetDesignStrengthAC_kips,
    lightestSafeSection: lightestSafeSection,
    requiredIxY31_in4: requiredIxY31_in4,
    flangeSlendernessClassExcel: flangeSlendernessClassExcel,
    nominalFlexuralT_kipft: nominalFlexuralT_kipft,
    evaluateShearCapacityNoDeflectionDesignRow: evaluateShearCapacityNoDeflectionDesignRow,
    evaluateShearCapacityWDeflectionDesignRow: evaluateShearCapacityWDeflectionDesignRow,
    computeShearDesign: computeShearDesign,
  };

  global.ShearDesignWorkbook = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
