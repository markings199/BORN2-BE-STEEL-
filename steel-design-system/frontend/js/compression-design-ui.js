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
    /* Properties pulled from `compression-capacity.json` (exported from `Compression-Capacity` in Born2BeSteel Final workbook). */
    champions: [
      { tier: 1, designation: "W14X48", weightPlf: 48, Ag: 14.1, rx: 5.85, ry: 1.91, lambdaFlange: 6.75, lambdaWeb: 33.6 },
      { tier: 2, designation: "W12X40", weightPlf: 40, Ag: 11.7, rx: 5.13, ry: 1.94, lambdaFlange: 7.77, lambdaWeb: 33.6 },
      { tier: 3, designation: "W10X39", weightPlf: 39, Ag: 11.5, rx: 4.27, ry: 1.98, lambdaFlange: 7.53, lambdaWeb: 25 },
      { tier: 4, designation: "W8X35", weightPlf: 35, Ag: 10.3, rx: 3.51, ry: 2.03, lambdaFlange: 8.1, lambdaWeb: 20.5 },
    ],
  };

  /** Sorted lightest-first W shapes from `data/aisc-sections.json` (fallback: `TIERS.champions` only). */
  var wShapeCatalog = null;
  var wShapeCatalogFetch = null;

  function adaptCatalogWShape(raw) {
    if (!raw || String(raw.type || "").toUpperCase() !== "W") return null;
    var Ag = Number(raw.Ag);
    var rx = Number(raw.rx);
    var ry = Number(raw.ry);
    var w = Number(raw.weightPlf);
    if (!Number.isFinite(Ag) || Ag <= 0) return null;
    if (!Number.isFinite(rx) || rx <= 0) return null;
    if (!Number.isFinite(ry) || ry <= 0) return null;
    if (!Number.isFinite(w) || w <= 0) return null;
    var lf = Number(raw.lambdaF != null ? raw.lambdaF : raw.lambdaFlange);
    var lw = Number(raw.lambdaW != null ? raw.lambdaW : raw.lambdaWeb);
    if (!Number.isFinite(lf) || lf <= 0) return null;
    if (!Number.isFinite(lw) || lw <= 0) return null;
    var name = String(raw.designation || raw.aiscManualLabel || "").trim();
    if (!name) return null;
    return {
      tier: 0,
      designation: name,
      weightPlf: w,
      Ag: Ag,
      rx: rx,
      ry: ry,
      lambdaFlange: lf,
      lambdaWeb: lw,
    };
  }

  function ensureWShapeCatalog(done) {
    if (wShapeCatalog && wShapeCatalog.length) {
      if (typeof done === "function") done();
      return;
    }
    if (!wShapeCatalogFetch) {
      wShapeCatalogFetch = fetch("data/aisc-sections.json", { credentials: "same-origin" })
        .then(function (r) {
          return r.ok ? r.json() : Promise.reject(new Error("aisc-sections.json"));
        })
        .then(function (payload) {
          var arr = (payload && payload.sections) || [];
          var out = [];
          for (var i = 0; i < arr.length; i++) {
            var sec = adaptCatalogWShape(arr[i]);
            if (sec) out.push(sec);
          }
          out.sort(function (a, b) {
            return a.weightPlf - b.weightPlf || String(a.designation).localeCompare(String(b.designation));
          });
          wShapeCatalog = out;
        })
        .catch(function () {
          wShapeCatalog = null;
        });
    }
    wShapeCatalogFetch.finally(function () {
      if (typeof done === "function") done();
    });
  }

  /** `Compression-Design ` workbook defaults (`Born2BeSteel Final (LAST) (1).xlsx` — G15, H29, H43/H53, H61, R45/X45…). */
  var EXCEL_COMPRESSION_DESIGN_DEFAULTS = {
    method: "ASD", // G15
    grade: "A992", // H29
    deadLoadKips: 20, // H43
    liveLoadKips: 80, // H53
    modulusEKsi: 29000, // H61
    slenderness: {
      X1: { cond: "PINNED-PINNED", L: 20 }, // R45, X45
      X2: { cond: "N/A", L: "" }, // R49, X49 (blank)
      X3: { cond: "N/A", L: "" }, // R52, X52 (blank)
      Y1: { cond: "PINNED-PINNED", L: 20 }, // R55, X55
      Y2: { cond: "N/A", L: 0 }, // R58, X58
      Y3: { cond: "N/A", L: 0 }, // R60, X60
    },
  };

  /**
   * Resolve controls inside `#compressionSection` first so the Design Calculator always reads/writes
   * the live DOM (avoids stale `getElementById` hits if duplicate ids ever appear elsewhere).
   */
  function el(id) {
    var sid = String(id || "").trim();
    if (!sid) return null;
    if (root && typeof root.querySelector === "function") {
      try {
        var hit = root.querySelector("#" + sid);
        if (hit) return hit;
      } catch (e) {}
    }
    return document.getElementById(sid);
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

  /** Fy (ksi) for the selected ASTM grade — prefers `SteelGradesService.fyFor` (same as Steel Grade DB). */
  function fyFromGrade(grade) {
    var key = String(grade || "").trim();
    var svc = window.SteelGradesService;
    if (svc && typeof svc.fyFor === "function") {
      var fySvc = svc.fyFor(key);
      if (Number.isFinite(fySvc) && fySvc > 0) return fySvc;
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
   * Member axial strength from flexural buckling — **same model as Analysis** (`computeCompressionAnalysis`
   * in `calculations-ui.js`): R = max(KLx_ft)*12/rx, S = max(KLy_ft)*12/ry, T = max(R,S); Pn = Fcr*Ag;
   * Pa = Pn/1.67 (ASD), Pu = 0.9*Pn (LRFD). Strength is **not** zeroed when flange/web are slender; compactness
   * is diagnostic only (matches Analysis). SAFE when design strength > governing demand (strict `>`).
   */
  function strengthForSection(sec, state) {
    var cs = compactStatus(sec, state.E, state.Fy);
    if (!Number.isFinite(sec.rx) || sec.rx <= 0 || !Number.isFinite(sec.ry) || sec.ry <= 0 || !Number.isFinite(sec.Ag) || sec.Ag <= 0) {
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
    var remark =
      Number.isFinite(designStrength) && designStrength > state.demandPu ? "SAFE" : "UNSAFE";
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

  /** Max K·L (ft) from Analysis Calculator slenderness rows (`compressionACond*`, `compressionAL*`). */
  function readAnalysisAxisMaxFt(axis) {
    var maxKl = 0;
    for (var i = 1; i <= 3; i++) {
      var cond = el("compressionACond" + axis + i);
      var Lin = el("compressionAL" + axis.toLowerCase() + i);
      var label = cond ? cond.value : "N/A";
      var K = kLookup(label);
      var Lft = Lin && String(Lin.value).trim() !== "" ? num(Lin, 0) : 0;
      var kl = label === "N/A" || label === "" ? 0 : K * Lft;
      if (kl > maxKl) maxKl = kl;
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
    var analysisMode = root.classList.contains("is-analysis-tab");

    var methodSel = el(analysisMode ? "compressionAMethod" : "compressionDesignMethod");
    var method = methodSel ? String(methodSel.value || "LRFD").toUpperCase() : "LRFD";

    var gradeSel = el(analysisMode ? "compressionAGrade" : "compressionDesignGrade");
    var fyIn = el(analysisMode ? "compressionAFy" : "compressionDesignFy");
    var eIn = el(analysisMode ? "compressionAE" : "compressionDesignE");
    var dlIn = el(analysisMode ? "compressionADl" : "compressionDesignDl");
    var llIn = el(analysisMode ? "compressionALl" : "compressionDesignLl");

    if (!analysisMode && gradeSel && fyIn) {
      fyIn.value = String(fyFromGrade(gradeSel.value));
    }
    var Fy = Math.max(1e-6, num(fyIn, 50));
    if (!analysisMode && gradeSel) {
      var fySvc = window.SteelGradesService && typeof window.SteelGradesService.fyFor === "function"
        ? window.SteelGradesService.fyFor(gradeSel.value)
        : null;
      if (Number.isFinite(fySvc) && fySvc > 0) {
        Fy = Math.max(1e-6, fySvc);
        if (fyIn) fyIn.value = String(fySvc);
      }
    }
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

    var klxMaxFt = analysisMode ? readAnalysisAxisMaxFt("X") : readAxisRows("X");
    var klyMaxFt = analysisMode ? readAnalysisAxisMaxFt("Y") : readAxisRows("Y");

    var state = {
      method: method,
      E: E,
      Fy: Fy,
      demandPu: demandPu,
      klxMaxFt: klxMaxFt,
      klyMaxFt: klyMaxFt,
    };

    var usingCatalog = !!(wShapeCatalog && wShapeCatalog.length);
    var catalogList = usingCatalog ? wShapeCatalog : TIERS.champions;

    var results = catalogList.map(function (sec) {
      return {
        sec: sec,
        out: strengthForSection(sec, state),
      };
    });

    var adequate = results.filter(function (row) {
      return Number.isFinite(row.out.phiPn) && row.out.phiPn > demandPu;
    });
    adequate.sort(function (a, b) {
      return a.sec.weightPlf - b.sec.weightPlf || String(a.sec.designation).localeCompare(String(b.designation));
    });

    /** Lightest member that passes demand (same object as Probable row 1 when catalog is used). */
    var heroForDisplay = adequate.length ? adequate[0] : null;

    var probableRows = [];
    if (adequate.length > 0) {
      probableRows = adequate.slice(0, 4);
    } else if (usingCatalog) {
      probableRows = results.slice(0, 4);
    } else {
      probableRows = results.slice();
      probableRows.sort(function (a, b) {
        return a.sec.weightPlf - b.sec.weightPlf || String(a.sec.designation).localeCompare(String(b.designation));
      });
    }

    function capCellText(v) {
      return Number.isFinite(v) ? fmt(v, 4) : "";
    }

    for (var pIdx = 0; pIdx < 4; pIdx++) {
      var row = probableRows[pIdx];
      var i = pIdx + 1;
      var wEl = el("compressionProbW" + i);
      var nEl = el("compressionProbName" + i);
      var paEl = el("compressionProbPa" + i);
      var puEl = el("compressionProbPu" + i);
      var rEl = el("compressionProbRm" + i);
      if (!row) {
        if (wEl) wEl.textContent = "";
        if (nEl) nEl.textContent = "";
        if (paEl) paEl.textContent = "";
        if (puEl) puEl.textContent = "";
        if (rEl) {
          rEl.textContent = "";
          rEl.classList.remove("is-safe");
          rEl.classList.remove("is-unsafe");
        }
        continue;
      }
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
    }

    var safeSec = el("compressionSafeSection");
    var safeAg = el("compressionSafeAg");
    var safeRm = el("compressionSafeRemark");
    var safeRmLbl = el("compressionSafeRemarkLabel");
    var metaEl = el("compressionLightestMeta");

    function fyDisplayKsi(fyVal) {
      if (!Number.isFinite(fyVal)) return "--";
      if (Math.abs(fyVal - Math.round(fyVal)) < 1e-6) return String(Math.round(fyVal));
      return fyVal.toFixed(2);
    }

    function updateLightestMeta(sectionName, adequateCount, catalogMode, heroOut) {
      if (!metaEl || analysisMode) return;
      var g = gradeSel ? String(gradeSel.value || "").trim() : "";
      var fyStr = fyDisplayKsi(Fy);
      var base = (g ? g + " · " : "") + "Fy = " + fyStr + " ksi";
      var capLine = "";
      if (sectionName && heroOut) {
        var capV = method === "ASD" ? heroOut.pa : heroOut.pu;
        if (Number.isFinite(capV)) {
          var capLbl = method === "ASD" ? "P_a" : "P_u";
          capLine =
            " — " +
            sectionName +
            ": " +
            capLbl +
            " = " +
            fmt(capV, 2) +
            " kips vs governing demand " +
            fmtDemandVal(demandPu, 3) +
            " kips.";
        }
      }
      if (sectionName && adequateCount > 0) {
        if (catalogMode) {
          metaEl.textContent =
            base +
            ". " +
            String(adequateCount) +
            " W-shape(s) pass demand; headline = lightest passing (same as Probable row 1)." +
            capLine;
        } else {
          metaEl.textContent =
            base +
            ". " +
            String(adequateCount) +
            " of 4 workbook probable shapes exceed demand; lightest by plf listed." +
            capLine;
        }
      } else if (!sectionName) {
        metaEl.textContent = catalogMode
          ? base + ". No W-shape in the catalog exceeds demand for the current KL and method."
          : base + ". None of the four listed shapes exceed demand.";
      } else {
        metaEl.textContent = base + ".";
      }
    }

    function setSafeSectionName(elNode, name) {
      if (!elNode) return;
      var s = String(name || "").trim();
      if (typeof elNode.replaceChildren === "function") {
        elNode.replaceChildren(document.createTextNode(s));
      } else {
        elNode.textContent = s;
      }
    }

    if (typeof window !== "undefined" && window.__COMPRESSION_DESIGN_DEBUG) {
      console.log("[compression-design]", {
        hero: heroForDisplay && heroForDisplay.sec.designation,
        adequateCount: adequate.length,
        demand: demandPu,
        method: method,
        Fy: Fy,
        catalog: usingCatalog,
      });
    }

    if (heroForDisplay) {
      if (safeSec) {
        setSafeSectionName(safeSec, heroForDisplay.sec.designation);
        safeSec.setAttribute("data-weight-plf", String(heroForDisplay.sec.weightPlf));
      }
      if (safeAg) safeAg.value = fmt(heroForDisplay.sec.Ag, 3);
      if (safeRm) safeRm.value = heroForDisplay.out.remark;
      if (safeRmLbl) {
        safeRmLbl.textContent = heroForDisplay.out.remark;
        safeRmLbl.classList.toggle("is-safe", heroForDisplay.out.remark === "SAFE");
        safeRmLbl.classList.toggle("is-unsafe", heroForDisplay.out.remark === "UNSAFE");
      }
      updateCompactnessPanel(heroForDisplay.sec, E, Fy);

      setDesignGovernKlFooter(klyMaxFt);
      updateLightestMeta(heroForDisplay.sec.designation, adequate.length, usingCatalog, heroForDisplay.out);
    } else {
      if (safeSec) {
        setSafeSectionName(safeSec, "NO SAFE SECTION");
        safeSec.removeAttribute("data-weight-plf");
      }
      if (safeAg) safeAg.value = "--";
      if (safeRm) safeRm.value = "UNSAFE";
      if (safeRmLbl) {
        safeRmLbl.textContent = "UNSAFE";
        safeRmLbl.classList.remove("is-safe");
        safeRmLbl.classList.add("is-unsafe");
      }
      var refSec =
        probableRows.length && probableRows[0] && probableRows[0].sec
          ? probableRows[0].sec
          : TIERS.champions[TIERS.champions.length - 1];
      updateCompactnessPanel(refSec, E, Fy);

      setDesignGovernKlFooter(klyMaxFt);
      updateLightestMeta("", adequate.length, usingCatalog, null);
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
    /** One bubbling path for Design + Analysis fields inside the same form (no missed controls, no duplicate handlers). */
    function onFormFieldActivity() {
      recompute();
    }
    form.addEventListener("input", onFormFieldActivity, false);
    form.addEventListener("change", onFormFieldActivity, false);

    ["X", "Y"].forEach(function (axis) {
      for (var i = 1; i <= 3; i++) {
        fillBoundarySelect(el("compression" + axis + i + "Cond"));
      }
    });

    ["X", "Y"].forEach(function (axis) {
      for (var i = 1; i <= 3; i++) {
        fillBoundarySelect(el("compressionACond" + axis + i));
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

    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible" && root.classList.contains("active-panel")) {
        window.requestAnimationFrame(recompute);
      }
    });

    applyExcelCompressionDesignDefaults();
    recompute();
    ensureWShapeCatalog(function () {
      recompute();
    });
    try {
      window.recomputeCompressionDesignCalculator = recompute;
    } catch (eWin) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }
})();
