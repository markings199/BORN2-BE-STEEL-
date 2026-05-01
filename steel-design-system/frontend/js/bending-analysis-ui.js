(function () {
  "use strict";

  /** Preferred default when present in Excel export (Bending Analysis workbook). */
  var PREFERRED_ANALYSIS_GRADE = "A618 Gr. I, II";

  function baWorkbook() {
    return typeof window !== "undefined" ? window.BendingAnalysisWorkbook : null;
  }

  function steelGradeSvc() {
    return typeof window !== "undefined" ? window.SteelGradesService : null;
  }

  function fmtFixed(n, dp) {
    if (!Number.isFinite(n)) return "--";
    return Number(n.toFixed(dp)).toFixed(dp);
  }

  /** Trim trailing zeros after rounding (workbook-style display). */
  function fmtTrim(n, dp) {
    if (!Number.isFinite(n)) return "--";
    return String(Number(n.toFixed(dp)));
  }

  function getEl(id) {
    return document.getElementById(id);
  }

  function setVal(id, v) {
    var el = getEl(id);
    if (!el) return;
    if ("value" in el) el.value = String(v == null ? "" : v);
    else el.textContent = String(v == null ? "" : v);
  }

  function setText(id, v) {
    var el = getEl(id);
    if (!el) return;
    el.textContent = String(v == null ? "" : v);
  }

  function activeBendViewIsAnalysis() {
    var v = getEl("bendAnalysisView");
    return !!(v && v.classList.contains("is-active"));
  }

  function readNumber(el) {
    if (!el) return null;
    var raw = String(el.value || "").trim();
    if (!raw) return null;
    var n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  var state = {
    byDesignation: Object.create(null),
    /**
     * Rows for the picker + `computeBorn2BeSteelAnalysis`:
     * Prefer `bendingAnalysisCatalog` from `aisc-sections.json` (Excel `aisc shapes database (2)` row order).
     * Fallback: Key Geometric Properties rows passing `analysisExcelCatalogRow`.
     */
    catalogRows: [],
    /** When true, catalog + order come from Excel `aisc shapes database (2)` (see bendingAnalysisCatalog). */
    useExcelDb2Catalog: false,
    /** Distinct Type column values from workbook catalog (e.g. ["W","L"]). */
    excelTypeChoices: null,
    /** From `bendingAnalysisCatalog.meta.shapePickerLabels` — maps chips to Excel **Shapes** symbols. */
    excelShapePickerLabels: null,
    /** Excel picker: active shape chips (`i`/`l` = UI labels; filter uses **Shapes** column via meta). */
    excelShapesActive: { i: false, l: false },
    excelTypesActive: { W: false, L: false },
    excelShapeMulti: false,
    excelTypeMulti: false,
    /** Match shipped workbook startup (FN17 refs blank -> 0) until user edits Design inputs. */
    useDesignFn17: false,
    selected: null,
    method: "ASD",
    selectedGrade: PREFERRED_ANALYSIS_GRADE,
    shapeFilter: "all",
    typeFilter: "all",
  };

  /**
   * Born2BeSteel Bending Analysis sheet: rolled wide-flange shapes only (`type === "W"` in
   * Key Geometric Properties export), with full geometry for `computeBorn2BeSteelAnalysis`.
   */
  var BEND_ANALYSIS_GEOM_KEYS = ["Zx", "Sx", "bf", "tf", "tw", "d", "lambdaF", "lambdaW"];

  function analysisExcelCatalogRow(s) {
    if (!s || s.designation == null) return false;
    if (String(s.type || "").toUpperCase() !== "W") return false;
    return BEND_ANALYSIS_GEOM_KEYS.every(function (k) {
      return Number.isFinite(Number(s[k]));
    });
  }

  /** Excel-backed picker lists Type=L angles plus Type=W; only W rows satisfy bending FN geometry checks. */
  function bendingPickerCatalogRow(s) {
    if (!s || s.designation == null) return false;
    var ty = String(s.type || "").toUpperCase();
    if (ty === "W") return analysisExcelCatalogRow(s);
    if (ty === "L") {
      var zx = Number(s.Zx);
      var sx = Number(s.Sx);
      var d = Number(s.d);
      var ag = Number(s.Ag);
      return (
        Number.isFinite(zx) &&
        Number.isFinite(sx) &&
        (Number.isFinite(d) || Number.isFinite(ag)) &&
        String(s.designation).trim() !== ""
      );
    }
    return false;
  }

  /** Union of Excel `Shapes` symbols for currently active shape chips (see catalog meta). */
  function excelActiveShapeSymbols() {
    var labels = state.excelShapePickerLabels;
    var sa = state.excelShapesActive || { i: false, l: false };
    var out = [];
    if (!labels || !labels.length) return out;
    for (var i = 0; i < labels.length; i++) {
      var entry = labels[i];
      if (!entry || !sa[entry.id]) continue;
      var ms = entry.matchShapeSymbols;
      if (Array.isArray(ms)) {
        for (var j = 0; j < ms.length; j++) out.push(ms[j]);
      }
    }
    return out;
  }

  function passesShapeCategory(row, shapeFilter) {
    if (state.useExcelDb2Catalog) {
      var sa = state.excelShapesActive || { i: false, l: false };
      if (!sa.i && !sa.l) return true;
      var sym = row.shapeSymbol != null ? String(row.shapeSymbol).trim() : "";
      var allowed = excelActiveShapeSymbols();
      if (allowed.length > 0) {
        if (!sym) return false;
        return allowed.indexOf(sym) >= 0;
      }
      var tyE = String(row.type || "").toUpperCase();
      return (sa.i && tyE === "W") || (sa.l && tyE === "L");
    }
    var t = String(row.type || "").toUpperCase();
    switch (shapeFilter) {
      case "all":
        return true;
      case "w":
        return t === "W";
      case "channel":
        return t === "C" || t === "MC";
      case "angle":
        return t === "L" || t === "2L";
      case "tee":
        return t === "WT" || t === "MT" || t === "ST";
      case "hss":
        return t === "HSS";
      case "pipe":
        return t === "PIPE";
      default:
        return true;
    }
  }

  function passesTypeFamily(row, typeFilter) {
    if (state.useExcelDb2Catalog) {
      var tyE = String(row.type || "").toUpperCase();
      var ta = state.excelTypesActive || { W: false, L: false };
      if (!ta.W && !ta.L) return true;
      return (ta.W && tyE === "W") || (ta.L && tyE === "L");
    }
    if (typeFilter === "all") return true;
    return (
      String(row.type || "").toUpperCase() ===
      String(typeFilter).toUpperCase()
    );
  }

  /** Leaving multi-select on Shapes: collapse to one chip only (does not change Type — Excel columns are independent). */
  function collapseExcelShapeMulti() {
    if (state.excelShapesActive.i && state.excelShapesActive.l) {
      state.excelShapesActive = { i: true, l: false };
    } else if (!state.excelShapesActive.i && !state.excelShapesActive.l) {
      state.excelShapesActive = { i: true, l: false };
    }
  }

  function collapseExcelTypeMulti() {
    if (state.excelTypesActive.W && state.excelTypesActive.L) {
      state.excelTypesActive = { W: true, L: false };
    } else if (!state.excelTypesActive.W && !state.excelTypesActive.L) {
      state.excelTypesActive = { W: true, L: false };
    }
  }

  function syncExcelPickToLegacyStrings() {
    if (!state.useExcelDb2Catalog) return;
    if (state.excelShapesActive.i && !state.excelShapesActive.l) state.shapeFilter = "i";
    else if (!state.excelShapesActive.i && state.excelShapesActive.l) state.shapeFilter = "l";
    else state.shapeFilter = "all";
    if (state.excelTypesActive.W && !state.excelTypesActive.L) state.typeFilter = "W";
    else if (!state.excelTypesActive.W && state.excelTypesActive.L) state.typeFilter = "L";
    else state.typeFilter = "all";
  }

  function syncExcelFilterUi() {
    var filtPanel = getEl("bendSectionFiltersPanel");
    if (!filtPanel || !state.useExcelDb2Catalog) return;
    filtPanel.querySelectorAll("[data-bend-shape]").forEach(function (btn) {
      var k = btn.getAttribute("data-bend-shape");
      btn.classList.toggle(
        "is-active",
        !!(state.excelShapesActive && state.excelShapesActive[k])
      );
    });
    filtPanel.querySelectorAll("[data-bend-type]").forEach(function (btn) {
      var k = btn.getAttribute("data-bend-type");
      btn.classList.toggle(
        "is-active",
        !!(state.excelTypesActive && state.excelTypesActive[k])
      );
    });
    var sm = filtPanel.querySelector('[data-bend-tool="shape-multi"]');
    var tm = filtPanel.querySelector('[data-bend-tool="type-multi"]');
    if (sm) {
      sm.setAttribute("aria-pressed", state.excelShapeMulti ? "true" : "false");
      sm.classList.toggle("is-pressed", !!state.excelShapeMulti);
    }
    if (tm) {
      tm.setAttribute("aria-pressed", state.excelTypeMulti ? "true" : "false");
      tm.classList.toggle("is-pressed", !!state.excelTypeMulti);
    }
  }

  /** Designations in JSON order after Shapes + Type filters (within analysis catalog). */
  function getFilteredDesignations() {
    var rows = state.catalogRows || [];
    var out = [];
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      if (!passesShapeCategory(row, state.shapeFilter)) continue;
      if (!passesTypeFamily(row, state.typeFilter)) continue;
      out.push(row.designation);
    }
    return out;
  }

  function syncGradeAndFy() {
    var gradeEl = getEl("bendAnalysisGrade");
    var fyEl = getEl("bendAnalysisFy");
    if (!gradeEl || !fyEl) return;
    var selected = String(gradeEl.value || "").trim();
    state.selectedGrade = selected;
    var svc = steelGradeSvc();
    var fy = svc && typeof svc.fyFor === "function" ? svc.fyFor(selected) : null;
    if (Number.isFinite(fy)) fyEl.value = String(fy);
  }

  function pickDefaultGradeAstm(list) {
    if (!list || !list.length) return "";
    var hit = list.find(function (g) {
      return g && String(g.astm) === PREFERRED_ANALYSIS_GRADE;
    });
    return hit ? hit.astm : String(list[0].astm || "");
  }

  /**
   * Rebuild bending analysis grade <select> from current SteelGradesService data.
   * Used after initial load and when grades reload (e.g. reloadFromFetch / ingest).
   */
  function applyBendingGradeDropdownFromService() {
    var el = getEl("bendAnalysisGrade");
    if (!el) return;
    var svc = steelGradeSvc();
    var list = (svc && typeof svc.getGrades === "function" && svc.getGrades()) || [];
    el.innerHTML = "";
    list.forEach(function (gr) {
      if (!gr || gr.astm == null) return;
      var opt = document.createElement("option");
      opt.value = String(gr.astm);
      opt.textContent = String(gr.astm);
      el.appendChild(opt);
    });
    var keys = {};
    list.forEach(function (gr) {
      if (gr && gr.astm) keys[String(gr.astm)] = true;
    });
    if (!keys[state.selectedGrade]) {
      state.selectedGrade = pickDefaultGradeAstm(list);
    }
    if (state.selectedGrade) el.value = state.selectedGrade;
    syncGradeAndFy();
    if (activeBendViewIsAnalysis()) computeAndRender(true);
  }

  function populateGradeOptions() {
    if (!getEl("bendAnalysisGrade")) return;
    var svc = steelGradeSvc();
    if (svc && typeof svc.ensureLoaded === "function") {
      svc.ensureLoaded().then(applyBendingGradeDropdownFromService).catch(applyBendingGradeDropdownFromService);
    } else {
      applyBendingGradeDropdownFromService();
    }
  }

  /** Excel `AISC_Manual_Label` column (falls back to designation). */
  function aiscManualLabelDisplay(row) {
    if (!row) return "";
    var m = row.aiscManualLabel;
    if (m != null && String(m).trim()) return String(m).trim();
    return row.designation || "";
  }

  /**
   * AISC_Manual_Label grid — same visual pattern as Tension Non-Staggered `ns-aisc-grid`
   * (buttons in a two-column scroll panel; behavior stays Born2BeSteel / bending catalog).
   */
  function renderAiscLabelGrid(designations) {
    var list = getEl("bendSectionList");
    if (!list) return;
    list.innerHTML = "";
    var des = Array.isArray(designations) ? designations : [];
    for (var i = 0; i < des.length; i++) {
      var designation = des[i];
      var key = String(designation).toUpperCase();
      var crow = state.byDesignation[key];
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ns-aisc-btn";
      b.setAttribute("role", "option");
      b.textContent = crow ? aiscManualLabelDisplay(crow) : designation;
      if (state.selected && key === state.selected) b.classList.add("is-active");
      b.addEventListener("click", function (k) {
        return function (e) {
          e.preventDefault();
          selectSection(k);
        };
      }(key));
      list.appendChild(b);
    }
  }

  /**
   * Two-column AISC_Manual_Label grid; order = JSON export order within active filters,
   * with an optional W12× demo block pulled first when present.
   */
  function rerenderList() {
    var list = getFilteredDesignations();
    var preferred = [
      "W4X13",
      "W12X279",
      "W12X305",
      "W12X35",
      "W12X45",
      "W12X53",
      "W12X65",
      "W12X30",
      "W12X336",
      "W12X40",
      "W12X50",
      "W12X58",
      "W12X72",
    ];
    var set = new Set(list);
    var ordered = preferred.filter(function (d) {
      return set.has(d);
    });
    list.forEach(function (d) {
      if (ordered.indexOf(d) === -1) ordered.push(d);
    });
    renderAiscLabelGrid(ordered);
  }

  function selectionStillInFilteredList() {
    var sel = state.selected;
    if (!sel) return true;
    var list = getFilteredDesignations();
    return list.indexOf(sel) >= 0;
  }

  function syncFilterChipActive(container, attrName, activeVal) {
    if (!container) return;
    container.querySelectorAll("[" + attrName + "]").forEach(function (btn) {
      var v = btn.getAttribute(attrName);
      btn.classList.toggle("is-active", v === activeVal);
    });
  }

  /**
   * Shape / Type chips — Excel-backed catalog uses workbook `typesDistinct` only (see export-aisc-sections.js).
   * Legacy fallback keeps tension-style shape families for Key Geom–only JSON.
   */
  function renderBendingNsFilterChips() {
    var shapeHost = getEl("bendNsShapeIcons");
    var typeHost = getEl("bendNsTypeChips");
    var shapesBlock = getEl("bendNsShapesBlock");
    if (!shapeHost || !typeHost) return;

    shapeHost.innerHTML = "";
    typeHost.innerHTML = "";

    if (state.useExcelDb2Catalog) {
      if (shapesBlock) {
        shapesBlock.hidden = false;
        shapesBlock.removeAttribute("aria-hidden");
      }
      var metaLabs = state.excelShapePickerLabels;
      var shapeOpts = [
        {
          v: "i",
          label:
            metaLabs && metaLabs[0] && metaLabs[0].label ? metaLabs[0].label : "I",
        },
        {
          v: "l",
          label:
            metaLabs && metaLabs[1] && metaLabs[1].label ? metaLabs[1].label : "L",
        },
      ];
      shapeOpts.forEach(function (o) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "ns-chip-btn";
        b.setAttribute("data-bend-shape", o.v);
        b.textContent = o.label;
        shapeHost.appendChild(b);
      });
    } else {
      if (shapesBlock) {
        shapesBlock.hidden = false;
        shapesBlock.removeAttribute("aria-hidden");
      }
      var shapes = [
        { v: "all", label: "All" },
        { v: "w", label: "W" },
        { v: "channel", label: "CHANNEL" },
        { v: "angle", label: "L / ∠" },
        { v: "tee", label: "TEE" },
        { v: "hss", label: "HSS" },
        { v: "pipe", label: "PIPE" },
      ];
      shapes.forEach(function (o) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "ns-chip-btn";
        b.setAttribute("data-bend-shape", o.v);
        b.textContent = o.label;
        shapeHost.appendChild(b);
      });
    }

    var typeIds = ["all", "W", "M", "S", "HP", "C", "MC"];
    if (state.useExcelDb2Catalog) {
      typeIds = ["W", "L"];
    }
    typeIds.forEach(function (t) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ns-chip-btn";
      b.setAttribute("data-bend-type", t);
      b.textContent = t === "all" ? "All" : t;
      typeHost.appendChild(b);
    });

    var filtPanel = getEl("bendSectionFiltersPanel");
    if (filtPanel) {
      if (state.useExcelDb2Catalog) syncExcelFilterUi();
      else {
        syncFilterChipActive(filtPanel, "data-bend-shape", state.shapeFilter);
        syncFilterChipActive(filtPanel, "data-bend-type", state.typeFilter);
      }
    }
  }

  function updateMethodUI() {
    var methodEl = getEl("bendMethodToggle");
    if (!methodEl) return;
    if ("value" in methodEl) methodEl.value = state.method;
    else methodEl.textContent = state.method;
    var head = getEl("bendCapacityHead");
    if (head) head.textContent = "Bending capacity";
    var pref = getEl("bendDesignMomentPrefix");
    if (pref) {
      pref.innerHTML =
        state.method === "LRFD"
          ? "<em>M</em><sub>u</sub>:"
          : "<em>M</em><sub>a</sub>:";
    }
  }

  function computeAndRender(force) {
    if (!force && !activeBendViewIsAnalysis()) return;

    var out = getEl("resultBending");
    if (!out) return;

    syncGradeAndFy();
    var eVal = readNumber(getEl("bendAnalysisE"));
    var fy = readNumber(getEl("bendAnalysisFy"));

    var selected = state.selected;
    if (!selected || !state._selectedProps) {
      setText("bendSelectedSection", "—");
      setVal("bendLambdaF", "--");
      setVal("bendLambdaW", "--");
      setVal("bendPropZx", "--");
      setVal("bendSx", "--");
      setVal("bendKc", "--");
      setVal("bendLambdaPF", "--");
      setVal("bendLambdaRF", "--");
      setVal("bendLambdaPFDesign", "--");
      setVal("bendLambdaRFDesign", "--");
      setText("bendClass", "—");
      setVal("bendMn", "--");
      setVal("bendMa", "--");
      out.textContent =
        getFilteredDesignations().length === 0
          ? "No sections match the current Shapes / Type filters."
          : "Select a section to begin.";
      out.classList.toggle("is-error", getFilteredDesignations().length === 0);
      return;
    }

    if (!analysisExcelCatalogRow(state._selectedProps)) {
      setText("bendSelectedSection", aiscManualLabelDisplay(state._selectedProps));
      setVal("bendLambdaF", "--");
      setVal("bendLambdaW", "--");
      setVal("bendPropZx", "--");
      setVal("bendSx", "--");
      setVal("bendKc", "--");
      setVal("bendLambdaPF", "--");
      setVal("bendLambdaRF", "--");
      setVal("bendLambdaPFDesign", "--");
      setVal("bendLambdaRFDesign", "--");
      setText("bendClass", "—");
      setVal("bendMn", "--");
      setVal("bendMa", "--");
      var isAngle =
        String(state._selectedProps.type || "").toUpperCase() === "L";
      out.textContent = isAngle
        ? "Angles (Type L / Shape L) are listed to match the workbook picker. This page’s Bending Analysis equations use rolled wide-flange (Type W / Shape I) geometry — select Shape I and Type W for Mn and Ma."
        : "Bending Analysis (Born2BeSteel) applies to rolled W-shapes with full geometric properties in the workbook catalog.";
      out.classList.add("is-error");
      return;
    }

    if (eVal == null || !(eVal > 0)) {
      out.textContent =
        "Enter a valid modulus E (ksi) greater than zero — workbook cell O12.";
      out.classList.add("is-error");
      setVal("bendMn", "--");
      setVal("bendMa", "--");
      return;
    }
    if (fy == null || !(fy > 0)) {
      out.textContent =
        "Yield strength Fy is missing — choose a steel grade with Fy (workbook W10).";
      out.classList.add("is-error");
      setVal("bendMn", "--");
      setVal("bendMa", "--");
      return;
    }

    var p = state._selectedProps;
    var zxEl = getEl("bendAnalysisZx");
    if (zxEl && Number.isFinite(p.Zx)) zxEl.value = String(p.Zx);

    var WB = baWorkbook();
    if (!WB || typeof WB.computeBorn2BeSteelAnalysis !== "function") {
      out.textContent = "Analysis workbook failed to load.";
      out.classList.add("is-error");
      return;
    }

    /** `Bending Design`!O12 / X10 — drive FN17 λ limits and compact Mp (FN19) like Excel. */
    var eDesign = readNumber(getEl("bendingDesignE"));
    var fyDesign = readNumber(getEl("bendingDesignFy"));
    var lpFn17 = 0;
    var lrFn17 = 0;
    if (
      state.useDesignFn17 &&
      eDesign != null &&
      eDesign > 0 &&
      fyDesign != null &&
      fyDesign > 0
    ) {
      lpFn17 = WB.lambdaPfAnalysis(eDesign, fyDesign);
      lrFn17 = WB.lambdaRfAnalysis(eDesign, fyDesign);
    }
    var fyMp =
      fyDesign != null && fyDesign > 0 ? fyDesign : fy;

    var sec = {
      Zx: Number(p.Zx),
      Sx: Number(p.Sx),
      bf: Number(p.bf),
      tf: Number(p.tf),
      tw: Number(p.tw),
      d: Number(p.d),
      lambdaF: Number(p.lambdaF),
      lambdaW: Number(p.lambdaW),
    };

    var r = WB.computeBorn2BeSteelAnalysis(sec, {
      E: eVal,
      Fy: fy,
      fyMp: fyMp,
      lpDesign: lpFn17,
      lrDesign: lrFn17,
      method: state.method,
    });

    if (!r.ok) {
      out.textContent = r.error;
      out.classList.add("is-error");
      return;
    }

    out.classList.remove("is-error");
    var v = r.values;

    setText("bendSelectedSection", aiscManualLabelDisplay(p));
    setVal("bendLambdaF", fmtTrim(v.lambdaF, 4));
    setVal("bendLambdaW", Number.isFinite(v.lambdaW) ? fmtTrim(v.lambdaW, 4) : "--");
    setVal("bendPropZx", Number.isFinite(p.Zx) ? fmtTrim(p.Zx, 4) : "--");
    setVal("bendSx", Number.isFinite(p.Sx) ? fmtTrim(p.Sx, 4) : "--");
    setVal("bendKc", Number.isFinite(v.kc) ? fmtFixed(v.kc, 4) : "--");
    setVal("bendLambdaPF", fmtTrim(v.lambdaPfDisplay, 4));
    setVal("bendLambdaRF", fmtTrim(v.lambdaRfDisplay, 4));
    setVal(
      "bendLambdaPFDesign",
      Number.isFinite(v.lambdaPfFn17) ? fmtTrim(v.lambdaPfFn17, 4) : "--"
    );
    setVal(
      "bendLambdaRFDesign",
      Number.isFinite(v.lambdaRfFn17) ? fmtTrim(v.lambdaRfFn17, 4) : "--"
    );
    setText("bendClass", v.flangeClass);
    setVal("bendMn", fmtFixed(v.Mn_kip_in, 4));
    setVal("bendMa", fmtFixed(v.Mdesign_kip_in, 4));

    out.textContent = "";
  }

  function selectSection(designation) {
    state.selected = String(designation || "").toUpperCase();
    rerenderList();

    var row = state.byDesignation[state.selected];
    if (!row) {
      state._selectedProps = null;
      var out = getEl("resultBending");
      if (out) {
        out.textContent = "Section not found in catalog.";
        out.classList.add("is-error");
      }
      computeAndRender(true);
      return;
    }

    state._selectedProps = row;
    var zxEl = getEl("bendAnalysisZx");
    if (zxEl && row.Zx != null) zxEl.value = String(row.Zx);
    computeAndRender(true);
  }

  function bindTabs() {
    var section = getEl("bendingSection");
    if (!section) return;
    var tabs = section.querySelectorAll("#formBending .compression-tab[data-bend-tab]");
    var designView = getEl("bendDesignView");
    var analysisView = getEl("bendAnalysisView");
    if (!tabs.length || !designView || !analysisView) return;

    function setTabState(isAnalysis) {
      var capV = document.getElementById("bendCapacityView");
      if (capV) {
        capV.classList.remove("is-active");
        capV.setAttribute("aria-hidden", "true");
      }
      section.classList.toggle("is-analysis-tab", !!isAnalysis);
      tabs.forEach(function (t) {
        var mode = t.getAttribute("data-bend-tab");
        t.classList.toggle("is-active", (mode === "analysis") === !!isAnalysis);
      });
      designView.classList.toggle("is-active", !isAnalysis);
      analysisView.classList.toggle("is-active", !!isAnalysis);
      if (!isAnalysis) computeAndRender(false);
      else computeAndRender(true);
    }

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var mode = tab.getAttribute("data-bend-tab");
        setTabState(mode === "analysis");
      });
    });

    setTabState(false);
  }

  function bind() {
    var list = getEl("bendSectionList");
    var methodEl = getEl("bendMethodToggle");
    if (!list || !methodEl) return;

    methodEl.addEventListener("change", function () {
      state.method = methodEl.value === "LRFD" ? "LRFD" : "ASD";
      updateMethodUI();
      computeAndRender(true);
    });

    var eEl = getEl("bendAnalysisE");
    var gradeEl = getEl("bendAnalysisGrade");
    if (gradeEl) {
      gradeEl.addEventListener("change", function () {
        syncGradeAndFy();
        computeAndRender(true);
      });
    }
    if (eEl) eEl.addEventListener("input", function () { computeAndRender(true); });

    updateMethodUI();

    var filtPanel = getEl("bendSectionFiltersPanel");
    if (filtPanel) {
      filtPanel.addEventListener("click", function (ev) {
        var t = ev.target;
        if (!t || !t.closest) return;

        var toolBtn = t.closest("[data-bend-tool]");
        if (toolBtn && state.useExcelDb2Catalog) {
          ev.preventDefault();
          var tool = toolBtn.getAttribute("data-bend-tool");
          if (tool === "shape-multi") {
            state.excelShapeMulti = !state.excelShapeMulti;
            if (!state.excelShapeMulti) collapseExcelShapeMulti();
          } else if (tool === "shape-clear") {
            state.excelShapesActive = { i: false, l: false };
          } else if (tool === "type-multi") {
            state.excelTypeMulti = !state.excelTypeMulti;
            if (!state.excelTypeMulti) collapseExcelTypeMulti();
          } else if (tool === "type-clear") {
            state.excelTypesActive = { W: false, L: false };
          }
          syncExcelPickToLegacyStrings();
          syncExcelFilterUi();
          if (!selectionStillInFilteredList()) {
            state.selected = null;
            state._selectedProps = null;
          }
          rerenderList();
          computeAndRender(true);
          return;
        }

        var shapeBtn = t.closest("[data-bend-shape]");
        if (shapeBtn) {
          ev.preventDefault();
          var shape = shapeBtn.getAttribute("data-bend-shape");
          if (state.useExcelDb2Catalog) {
            if (state.excelShapeMulti) {
              state.excelShapesActive[shape] = !state.excelShapesActive[shape];
            } else {
              state.excelShapesActive = {
                i: shape === "i",
                l: shape === "l",
              };
            }
            syncExcelPickToLegacyStrings();
            syncExcelFilterUi();
          } else {
            state.shapeFilter = shape;
            syncFilterChipActive(filtPanel, "data-bend-shape", state.shapeFilter);
          }
          if (!selectionStillInFilteredList()) {
            state.selected = null;
            state._selectedProps = null;
          }
          rerenderList();
          computeAndRender(true);
          return;
        }

        var typeBtn = t.closest("[data-bend-type]");
        if (typeBtn) {
          ev.preventDefault();
          var typ = typeBtn.getAttribute("data-bend-type");
          if (state.useExcelDb2Catalog) {
            if (state.excelTypeMulti) {
              state.excelTypesActive[typ] = !state.excelTypesActive[typ];
            } else {
              state.excelTypesActive = {
                W: typ === "W",
                L: typ === "L",
              };
            }
            syncExcelPickToLegacyStrings();
            syncExcelFilterUi();
          } else {
            state.typeFilter = typ;
            syncFilterChipActive(filtPanel, "data-bend-type", state.typeFilter);
          }
          if (!selectionStillInFilteredList()) {
            state.selected = null;
            state._selectedProps = null;
          }
          rerenderList();
          computeAndRender(true);
        }
      });
    }
  }

  /** Recompute Analysis when Design-calculator material inputs change (Excel cross-sheet refs). */
  function bindAnalysisFromDesignInputs() {
    function refresh() {
      state.useDesignFn17 = true;
      if (activeBendViewIsAnalysis()) computeAndRender(true);
    }
    ["bendingDesignE", "bendingDesignFy"].forEach(function (id) {
      var el = getEl(id);
      if (!el) return;
      el.addEventListener("input", refresh);
    });
    var dg = getEl("bendingDesignGrade");
    if (dg) dg.addEventListener("change", refresh);
  }

  function init() {
    if (!getEl("bendingSection")) return;
    if (!getEl("bendSectionList")) return;

    populateGradeOptions();
    var sgSvc = steelGradeSvc();
    if (sgSvc && typeof sgSvc.onUpdate === "function") {
      sgSvc.onUpdate(function () {
        applyBendingGradeDropdownFromService();
      });
    }
    bindTabs();
    bind();
    bindAnalysisFromDesignInputs();

    fetch("data/aisc-sections.json")
      .then(function (r) {
        return r.ok ? r.json() : Promise.reject(new Error("bad json"));
      })
      .catch(function () {
        return { sections: [] };
      })
      .then(function (data) {
        state.byDesignation = Object.create(null);
        state.catalogRows = [];
        state.useExcelDb2Catalog = false;
        state.excelTypeChoices = null;
        state.excelShapePickerLabels = null;

        var bac = data && data.bendingAnalysisCatalog;
        var srcRows =
          bac && Array.isArray(bac.sections) && bac.sections.length ? bac.sections : null;

        if (srcRows) {
          state.useExcelDb2Catalog = true;
          var metaTypes =
            bac.meta && Array.isArray(bac.meta.typesDistinct) ? bac.meta.typesDistinct : [];
          state.excelTypeChoices = metaTypes.length ? metaTypes.slice() : ["W", "L"];
          state.excelShapePickerLabels =
            bac.meta && Array.isArray(bac.meta.shapePickerLabels)
              ? bac.meta.shapePickerLabels
              : null;
          state.excelShapesActive = { i: true, l: false };
          state.excelTypesActive = { W: true, L: false };
          state.excelShapeMulti = false;
          state.excelTypeMulti = false;
          state.shapeFilter = "i";
          state.typeFilter = "W";
        } else {
          srcRows = (data && data.sections) ? data.sections : [];
          state.excelShapesActive = { i: false, l: false };
          state.excelTypesActive = { W: false, L: false };
          state.excelShapeMulti = false;
          state.excelTypeMulti = false;
          state.shapeFilter = "all";
          state.typeFilter = "all";
        }

        state.catalogRows = srcRows
          .map(function (s) {
            var ok = state.useExcelDb2Catalog
              ? bendingPickerCatalogRow(s)
              : analysisExcelCatalogRow(s);
            if (!ok) return null;
            var d = String(s.designation).toUpperCase();
            var copy = Object.assign({}, s, { designation: d });
            state.byDesignation[d] = copy;
            return copy;
          })
          .filter(Boolean);

        renderBendingNsFilterChips();
        rerenderList();

        if (state.byDesignation["W4X13"]) selectSection("W4X13");
        else if (state.byDesignation["W12X45"]) selectSection("W12X45");
        else computeAndRender(true);
      });
  }

  window.addEventListener("load", init);
})();
