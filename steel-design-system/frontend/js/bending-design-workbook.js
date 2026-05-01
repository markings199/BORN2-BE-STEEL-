/**
 * Born2BeSteel `Bending Design` / `Bending Capacity*` workbook math (pure functions).
 * Loaded in the browser as `BendingDesignWorkbook`; required by Node regression tests.
 * Regression: `npm run test:bending-design` (scripts/bending-design-regression.js).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.BendingDesignWorkbook = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function parseCatalog(json) {
    var list = json && Array.isArray(json.sections) ? json.sections : [];
    return list
      .filter(function (s) {
        return String(s.type || "").toUpperCase() === "W";
      })
      .map(function (s) {
        return {
          label: String(s.aiscManualLabel || s.designation || "").trim(),
          weightPlf: Number(s.weightPlf),
          Zx: Number(s.Zx),
          Sx: Number(s.Sx),
          Ix: Number(s.Ix),
          bf: Number(s.bf),
          tf: Number(s.tf),
          tw: Number(s.tw),
          d: Number(s.d),
          /* From Born2BeSteel Key Geometric Properties — matches Excel capacity sheets */
          lambdaF: Number(s.lambdaF),
          lambdaW: Number(s.lambdaW),
        };
      })
      .filter(function (s) {
        return (
          s.label &&
          [s.weightPlf, s.Zx, s.Sx, s.Ix, s.bf, s.tf, s.tw, s.d].every(
            Number.isFinite
          )
        );
      })
      .sort(function (a, b) {
        return a.weightPlf - b.weightPlf;
      });
  }

  function lfSection(sec) {
    return sec.bf / (2 * sec.tf);
  }

  function lwSection(sec) {
    return (sec.d - 2 * sec.tf) / sec.tw;
  }

  /** Flange slenderness λf — prefer Excel-exported value when present. */
  function lfRatio(sec) {
    return Number.isFinite(sec.lambdaF) ? sec.lambdaF : lfSection(sec);
  }

  /** Web slenderness h/tw — prefer Excel-exported λw when present (matches workbook/Kc). */
  function webSlendernessRatio(sec) {
    return Number.isFinite(sec.lambdaW) ? sec.lambdaW : lwSection(sec);
  }

  function mnNominalKipFt(sec, fy, E) {
    var Mp_ft = (fy * sec.Zx) / 12;
    var lf = lfRatio(sec);
    var lp = 0.38 * Math.sqrt(E / fy);
    var lr = 1 * Math.sqrt(E / fy);
    var Kc = kcWeb(sec);
    if (!Number.isFinite(Kc)) Kc = 0.76;

    /* Table B4.1b (flange): compact λ ≤ λp; non-compact λp < λ ≤ λr; slender λ > λr */
    var cls =
      lf <= lp ? "COMPACT" : lf <= lr ? "NON-COMPACT" : "SLENDER";

    if (cls === "COMPACT") return Mp_ft;

    if (cls === "NON-COMPACT") {
      var mnYield_ft = (0.7 * fy * sec.Sx) / 12;
      return Mp_ft - (Mp_ft - mnYield_ft) * ((lf - lp) / (lr - lp));
    }

    var MnSlender_kip_in = (0.9 * E * Kc * sec.Sx) / (lf * lf);
    return MnSlender_kip_in / 12;
  }

  /**
   * Workbook parity: `Bending Capacity w deflection` Q-column has a non-compact branch
   * that effectively interpolates from Mp to 0 (sheet references `Bending Design!X[row]`
   * are blank in the shipped file). Keep this isolated to deflection-sheet outputs.
   */
  function mnNominalKipFtDeflectionWorkbook(sec, fy, E) {
    var Mp_ft = (fy * sec.Zx) / 12;
    var lf = lfRatio(sec);
    var lp = 0.38 * Math.sqrt(E / fy);
    var lr = 1 * Math.sqrt(E / fy);
    var Kc = kcWeb(sec);
    if (!Number.isFinite(Kc)) Kc = 0.76;

    var cls =
      lf <= lp ? "COMPACT" : lf <= lr ? "NON-COMPACT" : "SLENDER";
    if (cls === "COMPACT") return Mp_ft;

    if (cls === "NON-COMPACT") {
      var ratio = (lf - lp) / (lr - lp);
      return Mp_ft - Mp_ft * ratio;
    }

    var MnSlender_kip_in = (0.9 * E * Kc * sec.Sx) / (lf * lf);
    return MnSlender_kip_in / 12;
  }

  function phiMnKipFt(Mn_ft, method) {
    if (!Number.isFinite(Mn_ft)) return null;
    if (method === "LRFD") return 0.9 * Mn_ft;
    return Mn_ft / 1.67;
  }

  function wuGoverning(method, DL, LL) {
    if (method === "ASD") return DL + LL;
    var n = 1.2 * DL + 1.6 * LL;
    var s = 1.4 * DL;
    return Math.max(n, s);
  }

  function lineLoadWithBeam(method, DL, LL, wSelfPlf, beamWeightNorm) {
    var wKlf = wSelfPlf / 1000;
    if (beamWeightNorm === "ignore beam weight") {
      /*
       * `Bending Capacity no deflection` column R:
       * IF(TRIM(F42)="ignore beam weight", 0, ...).
       * Demand still references O39 via demandMuNoDeflection.
       */
      return 0;
    }
    if (method === "ASD") return DL + LL + wKlf;
    if (method === "LRFD") return 1.2 * (DL + wKlf) + 1.6 * LL;
    return null;
  }

  function muDemandFromW(wKlf, L_ft) {
    return (wKlf * L_ft * L_ft) / 8;
  }

  function ixRequiredExcel(LL_klf, L_ft, E_ksi, divisor) {
    var L_in = L_ft * 12;
    var w_kip_per_in = LL_klf / 12;
    return (
      (divisor * 5 * w_kip_per_in * Math.pow(L_in, 4)) /
      (384 * E_ksi * L_in)
    );
  }

  function demandMuNoDeflection(sec0, Sdem) {
    var o39 = sec0.O39;
    if (!Number.isFinite(o39)) return null;
    var manual = sec0.manualMu > 0 ? sec0.manualMu : 0;
    return Math.max(o39, Sdem, manual);
  }

  function demandMuDeflection(sec0) {
    var o39 = sec0.O39;
    if (!Number.isFinite(o39)) return null;
    return sec0.manualMu > 0 ? sec0.manualMu : o39;
  }

  /**
   * @param {Array} catalog - parsed W-shapes, ascending weight
   * @param {string} method - LRFD | ASD
   * @param {object} sec0 - fy, E, DL, LL, L_ft, O39, manualMu, ixReq, manualIx, deflectionNorm, beamWeightNorm (normalized)
   */
  function pickLightestSection(catalog, method, sec0) {
    var fy = sec0.fy;
    var E = sec0.E;
    var DL = sec0.DL;
    var LL = sec0.LL;
    var L_ft = sec0.L_ft;
    var ixReq = sec0.ixReq;
    var manualIx = sec0.manualIx;
    var manualMu = sec0.manualMu;
    var deflNorm = sec0.deflectionNorm;
    var bwNorm = sec0.beamWeightNorm;

    var considering = deflNorm === "considering deflection";

    if (considering) {
      var ixLimit = manualIx > 0 ? manualIx : ixReq;
      if (!Number.isFinite(ixLimit)) return null;

      for (var j = 0; j < catalog.length; j++) {
        var sj = catalog[j];
        if (!(sj.Ix > ixLimit)) continue;
        var MnJ = mnNominalKipFtDeflectionWorkbook(sj, fy, E);
        var phiJ = phiMnKipFt(MnJ, method);
        if (!Number.isFinite(phiJ)) continue;

        /*
         * `Bending Capacity w deflection` REMARKS(Mu) checks:
         * IF(O46>0,O46,O39), independent of section self-weight term.
         */
        var muNeed = demandMuDeflection(sec0);
        if (!Number.isFinite(muNeed)) continue;

        return {
          sec: sj,
          phiMn: phiJ,
          Mn_ft: MnJ,
          Sdem: null,
          momentDemand: muNeed,
          ixOnlySelection: true,
          momentOk: phiJ > muNeed,
        };
      }
      return null;
    }

    for (var i = 0; i < catalog.length; i++) {
      var sec = catalog[i];
      var Rline = lineLoadWithBeam(method, DL, LL, sec.weightPlf, bwNorm);
      if (Rline == null) continue;
      var Sdem = muDemandFromW(Rline, L_ft);
      var Mn_ft = mnNominalKipFt(sec, fy, E);
      var phiMn = phiMnKipFt(Mn_ft, method);
      if (!Number.isFinite(phiMn)) continue;

      var demand = demandMuNoDeflection(sec0, Sdem);
      if (!Number.isFinite(demand)) continue;
      if (phiMn > demand) {
        return {
          sec: sec,
          phiMn: phiMn,
          Mn_ft: Mn_ft,
          Sdem: Sdem,
          momentDemand: demand,
          ixOnlySelection: false,
          momentOk: true,
        };
      }
    }

    return null;
  }

  function lambdaPfFlange(E_ksi, fy_ksi) {
    return 0.38 * Math.sqrt(E_ksi / fy_ksi);
  }

  function lambdaRfFlange(E_ksi, fy_ksi) {
    return 1.0 * Math.sqrt(E_ksi / fy_ksi);
  }

  function plasticMomentKipFt(sec, fy_ksi) {
    return (fy_ksi * sec.Zx) / 12;
  }

  function flangeFlexuralClass(sec, fy_ksi, E_ksi) {
    var lf = lfRatio(sec);
    var lp = lambdaPfFlange(E_ksi, fy_ksi);
    var lr = lambdaRfFlange(E_ksi, fy_ksi);
    if (lf <= lp) return "COMPACT";
    if (lf <= lr) return "NON-COMPACT";
    return "SLENDER";
  }

  /**
   * AISC 360 Sec. F4.1: kc = 4 / sqrt(h/tw), with 0.35 ≤ kc ≤ 0.76.
   */
  function kcWeb(sec) {
    var lw = webSlendernessRatio(sec);
    if (!(lw > 0)) return null;
    var raw = 4 / Math.sqrt(lw);
    return Math.min(Math.max(raw, 0.35), 0.76);
  }

  /**
   * One spreadsheet-style row for `Bending Capacity` without deflection (all W-shapes).
   * Uses the same demand/capacity rules as pickLightestSection for this mode.
   */
  function capacityRowWithoutDeflection(sec, method, sec0, fy_ksi, E_ksi) {
    var lf = lfRatio(sec);
    var lw = webSlendernessRatio(sec);
    var lp = lambdaPfFlange(E_ksi, fy_ksi);
    var lr = lambdaRfFlange(E_ksi, fy_ksi);
    var Kc = kcWeb(sec);
    var Mp_ft = plasticMomentKipFt(sec, fy_ksi);
    var compactness = flangeFlexuralClass(sec, fy_ksi, E_ksi);
    var Mn_ft = mnNominalKipFt(sec, fy_ksi, E_ksi);
    var phiMn = phiMnKipFt(Mn_ft, method);

    var Rline = lineLoadWithBeam(
      method,
      sec0.DL,
      sec0.LL,
      sec.weightPlf,
      sec0.beamWeightNorm
    );
    var L_ft = sec0.L_ft;
    var Mu_wb =
      Rline != null &&
      Number.isFinite(Rline) &&
      Number.isFinite(L_ft) &&
      L_ft > 0
        ? muDemandFromW(Rline, L_ft)
        : null;
    var demand =
      Mu_wb != null && Number.isFinite(Mu_wb)
        ? demandMuNoDeflection(sec0, Mu_wb)
        : null;

    var safe =
      Number.isFinite(phiMn) &&
      Number.isFinite(demand) &&
      phiMn > demand;

    return {
      label: sec.label,
      W: sec.weightPlf,
      lf: lf,
      lw: lw,
      Zx: sec.Zx,
      Sx: sec.Sx,
      Kc: Kc,
      lambdaPf: lp,
      lambdaRf: lr,
      Mp: Mp_ft,
      compactness: compactness,
      Mn: Mn_ft,
      WuBeam: Rline,
      MuBeam: Mu_wb,
      phiMn: phiMn,
      demand: demand,
      safe: safe,
    };
  }

  function wFamilySortKey(label) {
    var m = /^W(\d+)/i.exec(String(label || ""));
    return m ? Number(m[1]) : -1;
  }

  /**
   * @returns {Array<object>} sorted deepest/heaviest first; includes `groupKey` (e.g. W44).
   */
  function capacityAnalysisRowsWithoutDeflection(catalog, method, sec0, fy_ksi, E_ksi) {
    if (
      !Array.isArray(catalog) ||
      !catalog.length ||
      !Number.isFinite(fy_ksi) ||
      fy_ksi <= 0 ||
      !Number.isFinite(E_ksi) ||
      E_ksi <= 0
    )
      return [];

    var rows = catalog.map(function (sec) {
      var r = capacityRowWithoutDeflection(sec, method, sec0, fy_ksi, E_ksi);
      r.groupKey =
        (function (lb) {
          var m = /^W\d+/i.exec(String(lb || ""));
          return m ? m[0].toUpperCase() : "—";
        })(sec.label);
      return r;
    });

    rows.sort(function (a, b) {
      var da = wFamilySortKey(a.label);
      var db = wFamilySortKey(b.label);
      if (db !== da) return db - da;
      return (b.W || 0) - (a.W || 0);
    });

    return rows;
  }

  /**
   * Capacity sheet row when deflection governs section choice (Ix check + moment check).
   * Aligns with pickLightestSection `considering deflection` branch.
   */
  function capacityRowConsideringDeflection(sec, method, sec0, fy_ksi, E_ksi) {
    var lf = lfRatio(sec);
    var lw = webSlendernessRatio(sec);
    var lp = lambdaPfFlange(E_ksi, fy_ksi);
    var lr = lambdaRfFlange(E_ksi, fy_ksi);
    var Kc = kcWeb(sec);
    var Mp_ft = plasticMomentKipFt(sec, fy_ksi);
    var compactness = flangeFlexuralClass(sec, fy_ksi, E_ksi);
    var Mn_ft = mnNominalKipFtDeflectionWorkbook(sec, fy_ksi, E_ksi);
    var phiMn = phiMnKipFt(Mn_ft, method);

    var ixLimit = sec0.manualIx > 0 ? sec0.manualIx : sec0.ixReq;
    /* Deflection sheet uses O46/O39 only for moment REMARKS. */
    var muNeed = demandMuDeflection(sec0);

    var momentSafe =
      Number.isFinite(phiMn) &&
      Number.isFinite(muNeed) &&
      phiMn > muNeed;
    var ixSafe =
      Number.isFinite(ixLimit) &&
      Number.isFinite(sec.Ix) &&
      sec.Ix > ixLimit;

    return {
      label: sec.label,
      W: sec.weightPlf,
      lf: lf,
      lw: lw,
      Zx: sec.Zx,
      Sx: sec.Sx,
      Kc: Kc,
      lambdaPf: lp,
      lambdaRf: lr,
      Mp: Mp_ft,
      compactness: compactness,
      Mn: Mn_ft,
      /* Born2BeSteel capacity sheet: Mu column is φMn / Mn/Ω (not applied demand). */
      muColumnDesignStrength: phiMn,
      /* Governing applied moment used for REMARKS(Mu) vs φMn / Mn/Ω. */
      momentDemand: muNeed,
      Ix: sec.Ix,
      ixLimit: ixLimit,
      phiMn: phiMn,
      momentSafe: momentSafe,
      ixSafe: ixSafe,
    };
  }

  function capacityAnalysisRowsConsideringDeflection(catalog, method, sec0, fy_ksi, E_ksi) {
    if (
      !Array.isArray(catalog) ||
      !catalog.length ||
      !Number.isFinite(fy_ksi) ||
      fy_ksi <= 0 ||
      !Number.isFinite(E_ksi) ||
      E_ksi <= 0
    )
      return [];

    var rows = catalog.map(function (sec) {
      var r = capacityRowConsideringDeflection(sec, method, sec0, fy_ksi, E_ksi);
      r.groupKey =
        (function (lb) {
          var m = /^W\d+/i.exec(String(lb || ""));
          return m ? m[0].toUpperCase() : "—";
        })(sec.label);
      return r;
    });

    rows.sort(function (a, b) {
      var da = wFamilySortKey(a.label);
      var db = wFamilySortKey(b.label);
      if (db !== da) return db - da;
      return (b.W || 0) - (a.W || 0);
    });

    return rows;
  }

  return {
    parseCatalog: parseCatalog,
    lfSection: lfSection,
    lwSection: lwSection,
    lfRatio: lfRatio,
    webSlendernessRatio: webSlendernessRatio,
    mnNominalKipFt: mnNominalKipFt,
    mnNominalKipFtDeflectionWorkbook: mnNominalKipFtDeflectionWorkbook,
    phiMnKipFt: phiMnKipFt,
    wuGoverning: wuGoverning,
    lineLoadWithBeam: lineLoadWithBeam,
    muDemandFromW: muDemandFromW,
    ixRequiredExcel: ixRequiredExcel,
    demandMuNoDeflection: demandMuNoDeflection,
    demandMuDeflection: demandMuDeflection,
    pickLightestSection: pickLightestSection,
    lambdaPfFlange: lambdaPfFlange,
    lambdaRfFlange: lambdaRfFlange,
    plasticMomentKipFt: plasticMomentKipFt,
    flangeFlexuralClass: flangeFlexuralClass,
    kcWeb: kcWeb,
    capacityRowWithoutDeflection: capacityRowWithoutDeflection,
    capacityAnalysisRowsWithoutDeflection: capacityAnalysisRowsWithoutDeflection,
    capacityRowConsideringDeflection: capacityRowConsideringDeflection,
    capacityAnalysisRowsConsideringDeflection: capacityAnalysisRowsConsideringDeflection,
  };
});
