/** Compression Design Calculator — mirrors `Compression-Design` / `Compression-Capacity` buckling + compactness logic (Born2BeSteel Final). */
(function () {
  "use strict";

  var root = document.getElementById("compressionSection");
  var form = document.getElementById("formCompression");
  var designView = root && root.querySelector(".compression-design-view");
  if (!root || !form || !designView) return;

  /** Sheet2 J15:K18 + tier champions (λ flange/web from workbook rows). */
  var TIERS = {
    boundaryK: [
      { label: "FIXED-FIXED", K: 0.65 },
      { label: "FIXED-PINNED", K: 0.8 },
      { label: "PINNED-PINNED", K: 1 },
      { label: "N/A", K: 0 },
    ],
    /* Properties pulled from `compression-capacity.json` rows that match workbook `Compression-Design ` probable sections. */
    champions: [
      { tier: 1, designation: "W14X48", weightPlf: 48, Ag: 14.1, rx: 5.85, ry: 1.91, lambdaFlange: 6.75, lambdaWeb: 33.6 },
      { tier: 2, designation: "W12X45", weightPlf: 45, Ag: 13.1, rx: 5.15, ry: 1.95, lambdaFlange: 7.0, lambdaWeb: 29.6 },
      { tier: 3, designation: "W10X45", weightPlf: 45, Ag: 13.3, rx: 4.32, ry: 2.01, lambdaFlange: 6.47, lambdaWeb: 22.5 },
      { tier: 4, designation: "W8X40", weightPlf: 40, Ag: 11.7, rx: 3.53, ry: 2.04, lambdaFlange: 7.21, lambdaWeb: 17.6 },
    ],
  };

  /** `Compression-Design ` workbook defaults (`Born2BeSteel Final (6).xlsx` — G15, H29, H43/H53, H61, R45/X45…). */
  var EXCEL_COMPRESSION_DESIGN_DEFAULTS = {
    method: "ASD", // G15
    grade: "A992", // H29
    deadLoadKips: 20, // H43
    liveLoadKips: 80, // H53
    modulusEKsi: 29000, // H61
    slenderness: {
      X1: { cond: "PINNED-PINNED", L: 22 }, // R45, X45
      X2: { cond: "N/A", L: "" }, // R49, X49(blank)
      X3: { cond: "N/A", L: "" }, // R52, X52(blank)
      Y1: { cond: "PINNED-PINNED", L: 22 }, // R55, X55
      Y2: { cond: "N/A", L: 14 }, // R58, X58
      Y3: { cond: "N/A", L: 8 }, // R60, X60
    },
  };

  function el(id) {
    return document.getElementById(id);
  }

  function num(inp, fallback) {
    if (!inp) return fallback || 0;
    var v = Number(inp.value);
    return Number.isFinite(v) ? v : fallback || 0;
  }

  /** Fixed decimal strings for display (avoids trailing-zero stripping from Number()). */
  function fmt(v, d) {
    if (!Number.isFinite(v)) return "--";
    var places = typeof d === "number" ? d : 4;
    return v.toFixed(places);
  }

  /** Integer demand when exact (620, 126); otherwise fixed decimals. */
  function fmtDemandVal(v, decimals) {
    if (!Number.isFinite(v)) return "--";
    var d = typeof decimals === "number" ? decimals : 3;
    if (Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v));
    return v.toFixed(d);
  }

  function kLookup(label) {
    var key = String(label || "").trim().toUpperCase();
    var row = TIERS.boundaryK.find(function (b) {
      return String(b.label).toUpperCase() === key;
    });
    return row ? row.K : 1;
  }

  function fyFromGrade(grade) {
    var key = String(grade || "").trim();
    var svc = window.SteelGradesService;
    if (svc && typeof svc.fyFor === "function") {
      var fySvc = svc.fyFor(key);
      if (Number.isFinite(fySvc)) return fySvc;
    }
    var born = window.Born2BeSteel && Array.isArray(window.Born2BeSteel.steelGrades)
      ? window.Born2BeSteel.steelGrades
      : [];
    for (var i = 0; i < born.length; i++) {
      var g = born[i];
      if (!g || String(g.astm || "").trim() !== key) continue;
      var fy = Number(g.fy);
      if (Number.isFinite(fy)) return fy;
    }
    return 50;
  }

  function steelGradeRows() {
    var svc = window.SteelGradesService;
    if (svc && typeof svc.getGrades === "function") {
      var rows = svc.getGrades();
      if (rows && rows.length) return rows.slice();
    }
    var born = window.Born2BeSteel && Array.isArray(window.Born2BeSteel.steelGrades)
      ? window.Born2BeSteel.steelGrades
      : [];
    return born.slice();
  }

  function populateCompressionSteelGradeOptions() {
    var gradeSel = el("compressionDesignGrade");
    if (!gradeSel) return;
    var rows = steelGradeRows();
    if (!rows.length) return;
    var keep = String(gradeSel.value || EXCEL_COMPRESSION_DESIGN_DEFAULTS.grade).trim();
    gradeSel.innerHTML = "";
    rows.forEach(function (gr) {
      if (!gr || !gr.astm) return;
      var opt = document.createElement("option");
      opt.value = String(gr.astm).trim();
      opt.textContent = String(gr.astm).trim();
      gradeSel.appendChild(opt);
    });
    var hasKeep = Array.prototype.some.call(gradeSel.options, function (o) {
      return o.value === keep;
    });
    gradeSel.value = hasKeep ? keep : String(rows[0].astm).trim();
  }

  /**
   * Demand combinations — matches `Compression-Design` Tu row:
   * IF(G15="LRFD",MAX(AG9,AG11),IF(G15="ASD",AG9)) with AG9/AG11 = LRFD combo rows (1.2DL+1.6LL and 1.4DL); ASD uses AG9 = DL+LL.
   */
  function demandByMethod(method, dl, ll) {
    var isAsd = String(method || "LRFD").toUpperCase() === "ASD";
    if (isAsd) {
      var asdAg9 = dl + ll;
      return {
        combo1: asdAg9,
        combo2: null,
        governing: asdAg9,
      };
    }
    var c1 = 1.2 * dl + 1.6 * ll;
    var c2 = 1.4 * dl;
    return {
      combo1: c1,
      combo2: c2,
      governing: Math.max(c1, c2),
    };
  }

  function compactStatus(sec, E, Fy) {
    var lp = 0.56 * Math.sqrt(E / Fy);
    var lr = 1.49 * Math.sqrt(E / Fy);
    var flangeOk = sec.lambdaFlange < lp;
    var webOk = sec.lambdaWeb < lr;
    return {
      lp: lp,
      lrWeb: lr,
      flangeOk: flangeOk,
      webOk: webOk,
      overallCompact: flangeOk && webOk,
      flangeLabel: flangeOk ? "COMPACT FLANGE" : "SLENDER FLANGE",
      webLabel: webOk ? "COMPACT WEB" : "SLENDER WEB",
    };
  }

  function flexuralBucklingStress(Fy, E, KLr) {
    if (!Number.isFinite(KLr) || KLr <= 0) return { Fe: NaN, Fcr: NaN };
    var Fe = (Math.PI * Math.PI * E) / (KLr * KLr);
    var limit = 4.71 * Math.sqrt(E / Fy);
    var Fcr =
      KLr <= limit ? Math.pow(0.658, Fy / Fe) * Fy : 0.877 * Fe;
    return { Fe: Fe, Fcr: Fcr };
  }

  /**
   * Excel row logic: R = max(KLx_ft)*12/rx, S = max(KLy_ft)*12/ry, T = max(R,S);
   * Nominal Pn = Fcr*Ag; Pa = Pn/1.67 (ASD), Pu = 0.9*Pn (LRFD). Capacities only if compact.
   * Governing check uses the active method strength vs demand (strict >).
   */
  function strengthForSection(sec, state) {
    var cs = compactStatus(sec, state.E, state.Fy);
    if (!cs.overallCompact) {
      return {
        pa: NaN,
        pu: NaN,
        phiPn: NaN,
        remark: "UNSAFE",
        compact: cs,
        KLrX: NaN,
        KLrY: NaN,
        KLrGov: NaN,
        Fe: NaN,
        Fcr: NaN,
        Pn: NaN,
        strongAxisGovernsKLr: false,
      };
    }
    var R = (state.klxMaxFt * 12) / sec.rx;
    var S = (state.klyMaxFt * 12) / sec.ry;
    var T = Math.max(R, S);
    var fb = flexuralBucklingStress(state.Fy, state.E, T);
    var Pn = sec.Ag * fb.Fcr;
    var pa = Pn / 1.67;
    var pu = 0.9 * Pn;
    var designStrength = state.method === "ASD" ? pa : pu;
    var remark = designStrength > state.demandPu ? "SAFE" : "UNSAFE";
    return {
      pa: pa,
      pu: pu,
      phiPn: designStrength,
      remark: remark,
      compact: cs,
      KLrX: R,
      KLrY: S,
      KLrGov: T,
      Fe: fb.Fe,
      Fcr: fb.Fcr,
      Pn: Pn,
      strongAxisGovernsKLr: R >= S,
    };
  }

  function readAxisRows(prefix) {
    var maxKl = 0;
    for (var i = 1; i <= 3; i++) {
      var cond = el("compression" + prefix + i + "Cond");
      var Lin = el("compression" + prefix + i + "L");
      var label = cond ? cond.value : "N/A";
      var K = kLookup(label);
      var Lft = Lin && String(Lin.value).trim() !== "" ? num(Lin, 0) : 0;
      var kl = label === "N/A" || label === "" ? 0 : K * Lft;
      if (kl > maxKl) maxKl = kl;

      var kOut = el("compression" + prefix + i + "K");
      var klOut = el("compression" + prefix + i + "KL");
      if (kOut) kOut.textContent = label === "N/A" ? "0" : String(K);
      if (klOut) klOut.textContent = kl > 0 ? fmt(kl, 4) : "";
    }
    return maxKl;
  }

  function fillBoundarySelect(sel) {
    if (!sel || sel.options.length) return;
    TIERS.boundaryK.forEach(function (b) {
      var o = document.createElement("option");
      o.value = b.label;
      o.textContent = b.label;
      sel.appendChild(o);
    });
  }

  function setAxisDefault(axis, rowIdx, cfg) {
    var cond = el("compression" + axis + rowIdx + "Cond");
    var Lin = el("compression" + axis + rowIdx + "L");
    if (cond && cfg && cfg.cond != null) cond.value = String(cfg.cond);
    if (Lin && cfg) Lin.value = cfg.L === "" ? "" : String(cfg.L);
  }

  function applyExcelCompressionDesignDefaults() {
    var methodSel = el("compressionDesignMethod");
    var gradeSel = el("compressionDesignGrade");
    var fyIn = el("compressionDesignFy");
    var eIn = el("compressionDesignE");
    var dlIn = el("compressionDesignDl");
    var llIn = el("compressionDesignLl");

    if (methodSel) methodSel.value = EXCEL_COMPRESSION_DESIGN_DEFAULTS.method;
    if (gradeSel) gradeSel.value = EXCEL_COMPRESSION_DESIGN_DEFAULTS.grade;
    if (dlIn) dlIn.value = String(EXCEL_COMPRESSION_DESIGN_DEFAULTS.deadLoadKips);
    if (llIn) llIn.value = String(EXCEL_COMPRESSION_DESIGN_DEFAULTS.liveLoadKips);
    if (eIn) eIn.value = String(EXCEL_COMPRESSION_DESIGN_DEFAULTS.modulusEKsi);
    if (fyIn) fyIn.value = String(fyFromGrade(EXCEL_COMPRESSION_DESIGN_DEFAULTS.grade));

    setAxisDefault("X", 1, EXCEL_COMPRESSION_DESIGN_DEFAULTS.slenderness.X1);
    setAxisDefault("X", 2, EXCEL_COMPRESSION_DESIGN_DEFAULTS.slenderness.X2);
    setAxisDefault("X", 3, EXCEL_COMPRESSION_DESIGN_DEFAULTS.slenderness.X3);
    setAxisDefault("Y", 1, EXCEL_COMPRESSION_DESIGN_DEFAULTS.slenderness.Y1);
    setAxisDefault("Y", 2, EXCEL_COMPRESSION_DESIGN_DEFAULTS.slenderness.Y2);
    setAxisDefault("Y", 3, EXCEL_COMPRESSION_DESIGN_DEFAULTS.slenderness.Y3);
  }

  /** Workbook Capacity Analysis footer: weak-axis max KL (ft) with “Assuming Kly Governs”. */
  function setDesignGovernKlFooter(klyMaxFt) {
    var govCaption = el("compressionKLGovCaption");
    var govVal = el("compressionKLGovValue");
    var row = govCaption && govCaption.closest(".compression-slen-govern");
    if (!govCaption || !govVal || !row) return;

    row.classList.remove("compression-slen-govern--na");
    govCaption.textContent = "Assuming Kly Governs";
    govVal.value = klyMaxFt > 0 ? fmt(klyMaxFt, 4) : "--";
  }

  function updateCompactnessPanel(sec, E, Fy) {
    var cs = compactStatus(sec, E, Fy);
    function set(idVal, idLim, idLbl, lambda, lim, ok, compactWord, slenderWord, lambdaDecimals) {
      var v = el(idVal);
      var l = el(idLim);
      var lbl = el(idLbl);
      var ld = typeof lambdaDecimals === "number" ? lambdaDecimals : 4;
      if (v) v.value = fmt(lambda, ld);
      if (l) l.value = fmt(lim, 4);
      if (lbl) {
        lbl.innerHTML = "<em>" + (ok ? compactWord : slenderWord) + "</em>";
        lbl.classList.toggle("is-compact", ok);
        lbl.classList.toggle("is-slender", !ok);
      }
    }
    set(
      "compressionDesignFlangeLambda",
      "compressionDesignFlangeLim",
      "compressionDesignFlangeClass",
      sec.lambdaFlange,
      cs.lp,
      cs.flangeOk,
      "COMPACT FLANGE",
      "SLENDER FLANGE",
      2
    );
    set(
      "compressionDesignWebLambda",
      "compressionDesignWebLim",
      "compressionDesignWebClass",
      sec.lambdaWeb,
      cs.lrWeb,
      cs.webOk,
      "COMPACT WEB",
      "SLENDER WEB",
      1
    );
  }

  function recompute() {
    var methodSel = el("compressionDesignMethod");
    var method = methodSel ? String(methodSel.value || "LRFD").toUpperCase() : "LRFD";
    if (!designView.classList.contains("is-active")) return;

    var gradeSel = el("compressionDesignGrade");
    var fyIn = el("compressionDesignFy");
    var eIn = el("compressionDesignE");
    var dlIn = el("compressionDesignDl");
    var llIn = el("compressionDesignLl");

    if (gradeSel && fyIn) {
      fyIn.value = String(fyFromGrade(gradeSel.value));
    }
    var Fy = Math.max(1e-6, num(fyIn, 50));
    var E = Math.max(1e-6, num(eIn, 29000));
    var dl = Math.max(0, num(dlIn, EXCEL_COMPRESSION_DESIGN_DEFAULTS.deadLoadKips));
    var ll = Math.max(0, num(llIn, EXCEL_COMPRESSION_DESIGN_DEFAULTS.liveLoadKips));

    var demand = demandByMethod(method, dl, ll);
    var demandCombo1 = demand.combo1;
    var demandCombo2 = demand.combo2;
    var demandPu = demand.governing;

    var d1 = el("compressionDemandCombo1");
    var d2 = el("compressionDemandCombo2");
    var dg = el("compressionDemandGov");
    var d1Lbl = el("compressionDemandLabel1");
    var d2Lbl = el("compressionDemandLabel2");
    var dgLbl = el("compressionDemandGovLabel");
    if (d1Lbl) d1Lbl.textContent = method === "ASD" ? "DL + LL" : "1.2DL+1.6LL";
    if (d2Lbl) d2Lbl.textContent = method === "ASD" ? "-" : "1.4DL";
    if (dgLbl) dgLbl.textContent = method === "ASD" ? "Ta" : "Tu";
    if (d1) d1.value = fmtDemandVal(demandCombo1, 3);
    if (d2) d2.value = Number.isFinite(demandCombo2) ? fmtDemandVal(demandCombo2, 3) : "-";
    if (dg) dg.value = fmtDemandVal(demandPu, 3);

    var klxMaxFt = readAxisRows("X");
    var klyMaxFt = readAxisRows("Y");

    var state = {
      method: method,
      E: E,
      Fy: Fy,
      demandPu: demandPu,
      klxMaxFt: klxMaxFt,
      klyMaxFt: klyMaxFt,
    };

    var results = TIERS.champions.map(function (sec) {
      return {
        sec: sec,
        out: strengthForSection(sec, state),
      };
    });

    function capCellText(v) {
      return Number.isFinite(v) ? fmt(v, 4) : "";
    }

    results.forEach(function (row, idx) {
      var i = idx + 1;
      var wEl = el("compressionProbW" + i);
      var nEl = el("compressionProbName" + i);
      var paEl = el("compressionProbPa" + i);
      var puEl = el("compressionProbPu" + i);
      var rEl = el("compressionProbRm" + i);
      if (wEl) wEl.textContent = String(row.sec.weightPlf);
      if (nEl) nEl.textContent = row.sec.designation;
      if (method === "ASD") {
        if (paEl) paEl.textContent = capCellText(row.out.pa);
        if (puEl) puEl.textContent = "";
      } else {
        if (paEl) paEl.textContent = "";
        if (puEl) puEl.textContent = capCellText(row.out.pu);
      }
      if (rEl) {
        rEl.textContent = row.out.remark;
        rEl.classList.toggle("is-safe", row.out.remark === "SAFE");
        rEl.classList.toggle("is-unsafe", row.out.remark === "UNSAFE");
      }
    });

    var adequate = results.filter(function (row) {
      return Number.isFinite(row.out.phiPn) && row.out.phiPn > demandPu;
    });
    adequate.sort(function (a, b) {
      return a.sec.weightPlf - b.sec.weightPlf;
    });

    var lightest = adequate.length ? adequate[0] : null;
    var safeSec = el("compressionSafeSection");
    var safeAg = el("compressionSafeAg");
    var safeRm = el("compressionSafeRemark");
    var safeRmLbl = el("compressionSafeRemarkLabel");

    if (lightest) {
      if (safeSec) safeSec.textContent = lightest.sec.designation;
      if (safeAg) safeAg.value = fmt(lightest.sec.Ag, 3);
      if (safeRm) safeRm.value = lightest.out.remark;
      if (safeRmLbl) {
        safeRmLbl.textContent = lightest.out.remark;
        safeRmLbl.classList.toggle("is-safe", lightest.out.remark === "SAFE");
        safeRmLbl.classList.toggle("is-unsafe", lightest.out.remark === "UNSAFE");
      }
      updateCompactnessPanel(lightest.sec, E, Fy);

      setDesignGovernKlFooter(klyMaxFt);
    } else {
      if (safeSec) safeSec.textContent = "NO SAFE SECTION";
      if (safeAg) safeAg.value = "--";
      if (safeRm) safeRm.value = "UNSAFE";
      if (safeRmLbl) {
        safeRmLbl.textContent = "UNSAFE";
        safeRmLbl.classList.remove("is-safe");
        safeRmLbl.classList.add("is-unsafe");
      }
      updateCompactnessPanel(TIERS.champions[TIERS.champions.length - 1], E, Fy);

      setDesignGovernKlFooter(klyMaxFt);
    }

    var dbg = el("resultCompression");
    if (dbg) {
      dbg.textContent = "";
      dbg.style.display = "none";
    }
  }

  function wire() {
    populateCompressionSteelGradeOptions();
    if (window.SteelGradesService && typeof window.SteelGradesService.onUpdate === "function") {
      window.SteelGradesService.onUpdate(function () {
        populateCompressionSteelGradeOptions();
        recompute();
      });
    }
    ["compressionDesignMethod", "compressionDesignGrade", "compressionDesignFy", "compressionDesignE", "compressionDesignDl", "compressionDesignLl"].forEach(function (id) {
      var node = el(id);
      if (!node) return;
      ["input", "change"].forEach(function (ev) {
        node.addEventListener(ev, recompute);
      });
    });

    ["X", "Y"].forEach(function (axis) {
      for (var i = 1; i <= 3; i++) {
        var cond = el("compression" + axis + i + "Cond");
        var Lin = el("compression" + axis + i + "L");
        fillBoundarySelect(cond);
        if (cond) cond.addEventListener("change", recompute);
        if (Lin) Lin.addEventListener("input", recompute);
      }
    });

    form.addEventListener("submit", function (e) {
      if (designView.classList.contains("is-active")) e.preventDefault();
    });

    root.querySelectorAll(".compression-top-tabs .compression-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        window.requestAnimationFrame(recompute);
      });
    });

    applyExcelCompressionDesignDefaults();
    recompute();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }
})();
