(function () {
  "use strict";

  var PHI_B = 0.9;
  var OMEGA_B = 1.67;
  var DEFAULT_E_KSI = 29000;
  /** Preferred default when present in Excel export (Bending Analysis workbook). */
  var PREFERRED_ANALYSIS_GRADE = "A618 Gr. I, II";

  function steelGradeSvc() {
    return typeof window !== "undefined" ? window.SteelGradesService : null;
  }

  function clamp(n, a, b) {
    if (!Number.isFinite(n)) return n;
    return Math.min(b, Math.max(a, n));
  }

  function fmtFixed(n, dp) {
    if (!Number.isFinite(n)) return "--";
    return Number(n.toFixed(dp)).toFixed(dp);
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

  /**
   * Bending Analysis workbook: λ_w from database (h/t_w); k_c = 4 / √λ_w.
   * Nominal flexural strength in flange-local slender regime: M_n = 0.9 E k_c S_x / λ_f² (kip·in).
   */
  function computeAll(inputs) {
    var E = inputs.E;
    var Fy = inputs.Fy;
    var Zx = inputs.Zx;
    var Sx = inputs.Sx;
    var bf = inputs.bf;
    var tf = inputs.tf;
    var tw = inputs.tw;
    var d = inputs.d;
    var lambdaFSheet = inputs.lambdaF;
    var lambdaWSheet = inputs.lambdaW;

    if (![E, Fy, Zx, Sx, bf, tf, tw, d].every(Number.isFinite)) {
      return { ok: false, error: "Select a section and provide E and Fy." };
    }
    if (E <= 0 || Fy <= 0 || Zx <= 0 || Sx <= 0 || bf <= 0 || tf <= 0 || tw <= 0 || d <= 0) {
      return { ok: false, error: "Inputs must be positive." };
    }

    var h = d - 2 * tf;
    var lambdaFGeom = bf / (2 * tf);
    var lambdaWGeom = h > 0 && tw > 0 ? h / tw : null;

    var lambdaF = Number.isFinite(lambdaFSheet) ? lambdaFSheet : lambdaFGeom;
    var lambdaW = Number.isFinite(lambdaWSheet) ? lambdaWSheet : lambdaWGeom;

    if (!Number.isFinite(lambdaF) || lambdaF <= 0) {
      return { ok: false, error: "Invalid flange slenderness λ_f." };
    }

    var lambdaPF = 0.38 * Math.sqrt(E / Fy);
    var lambdaRF = 1.0 * Math.sqrt(E / Fy);

    var classification = "SLENDER";
    if (lambdaF < lambdaPF) classification = "COMPACT";
    else if (lambdaF < lambdaRF) classification = "NON-COMPACT";

    var kc = null;
    if (Number.isFinite(lambdaW) && lambdaW > 0) {
      kc = 4 / Math.sqrt(lambdaW);
    }

    var Mp = Fy * Zx;
    var Mr = 0.7 * Fy * Sx;

    var Mn;
    if (classification === "COMPACT") {
      Mn = Mp;
    } else if (classification === "NON-COMPACT") {
      var denom = lambdaRF - lambdaPF;
      var t = denom > 0 ? (lambdaF - lambdaPF) / denom : 0;
      t = clamp(t, 0, 1);
      Mn = Mp - (Mp - Mr) * t;
      Mn = clamp(Mn, Math.min(Mp, Mr), Math.max(Mp, Mr));
    } else {
      if (!Number.isFinite(kc)) return { ok: false, error: "Cannot compute k_c from web slenderness." };
      Mn = (0.9 * E * kc * Sx) / (lambdaF * lambdaF);
    }

    var method = inputs.method;
    var Ma = method === "LRFD" ? PHI_B * Mn : Mn / OMEGA_B;

    return {
      ok: true,
      values: {
        lambdaF: lambdaF,
        lambdaW: lambdaW,
        lambdaPF: lambdaPF,
        lambdaRF: lambdaRF,
        kc: kc,
        classification: classification,
        Mn: Mn,
        Ma: Ma,
        method: method,
      },
    };
  }

  var state = {
    byDesignation: Object.create(null),
    allSectionRows: [],
    allSections: [],
    selected: null,
    method: "ASD",
    selectedShape: "I",
    selectedType: "W",
    selectedGrade: PREFERRED_ANALYSIS_GRADE,
    page: 0,
  };
  var ROWS_PER_PAGE = 6;

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

  function prefixOf(designation) {
    var m = String(designation || "").toUpperCase().match(/^[A-Z]+/);
    return m ? m[0] : "";
  }

  function shapeToPrefixes(shape) {
    if (shape === "I") return ["W"];
    if (shape === "L") return ["L"];
    return [];
  }

  function typeToPrefixes(type) {
    if (type === "W") return ["W"];
    if (type === "L") return ["L"];
    return [];
  }

  function availablePrefixes() {
    return Array.from(
      new Set(state.allSections.map(function (d) { return prefixOf(d); }).filter(Boolean))
    ).sort();
  }

  function filteredSections() {
    var allowedByShape = shapeToPrefixes(state.selectedShape);
    var allowedByType = typeToPrefixes(state.selectedType);

    return state.allSections.filter(function (d) {
      var p = prefixOf(d);
      if (allowedByShape.length && allowedByShape.indexOf(p) === -1) return false;
      if (allowedByType.length && allowedByType.indexOf(p) === -1) return false;
      return true;
    });
  }

  function renderSectionGrid(designations) {
    var list = getEl("bendSectionList");
    if (!list) return;
    list.innerHTML = "";

    var items = Array.isArray(designations) ? designations.slice() : [];
    for (var i = 0; i < items.length; i += 2) {
      var left = items[i] || null;
      var right = items[i + 1] || null;

      var row = document.createElement("div");
      row.className =
        "bend-table-row" +
        (state.selected && (state.selected === left || state.selected === right) ? " is-active" : "");
      row.setAttribute("role", "option");

      function cell(designation) {
        var s = document.createElement("span");
        s.textContent = designation || "";
        if (!designation) {
          s.style.visibility = "hidden";
          s.setAttribute("aria-hidden", "true");
          return s;
        }
        s.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          selectSection(designation);
        });
        return s;
      }

      row.appendChild(cell(left));
      row.appendChild(cell(right));
      list.appendChild(row);
    }
  }

  function renderSectionGridColumnPairs(leftCol, rightCol) {
    var list = getEl("bendSectionList");
    if (!list) return;
    list.innerHTML = "";

    var L = Array.isArray(leftCol) ? leftCol : [];
    var R = Array.isArray(rightCol) ? rightCol : [];
    var rows = Math.max(L.length, R.length);

    for (var i = 0; i < rows; i++) {
      var left = L[i] || null;
      var right = R[i] || null;

      var row = document.createElement("div");
      row.className =
        "bend-table-row" +
        (state.selected && (state.selected === left || state.selected === right) ? " is-active" : "");
      row.setAttribute("role", "option");

      function cell(designation) {
        var s = document.createElement("span");
        s.textContent = designation || "";
        if (!designation) {
          s.style.visibility = "hidden";
          s.setAttribute("aria-hidden", "true");
          return s;
        }
        s.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          selectSection(designation);
        });
        return s;
      }

      row.appendChild(cell(left));
      row.appendChild(cell(right));
      list.appendChild(row);
    }
  }

  function updatePagination(totalRows) {
    var prev = getEl("bendPagePrev");
    var next = getEl("bendPageNext");
    var info = getEl("bendPageInfo");
    var pages = Math.max(1, Math.ceil((totalRows || 0) / ROWS_PER_PAGE));
    if (state.page >= pages) state.page = pages - 1;
    if (state.page < 0) state.page = 0;
    if (prev) prev.disabled = state.page <= 0;
    if (next) next.disabled = state.page >= pages - 1;
    if (info) info.textContent = String(state.page + 1) + "/" + String(pages);
  }

  function populateFilterOptions() {
    var shapeList = getEl("bendShapeOptions");
    var typeList = getEl("bendTypeOptions");
    var shapeBox = getEl("bendShapeOptionsList");
    var typeBox = getEl("bendTypeOptionsList");
    if (!shapeList || !typeList) return;

    var prefixes = availablePrefixes();

    shapeList.innerHTML = ["I", "L"].map(function (p) { return "<option value=\"" + p + "\"></option>"; }).join("");
    typeList.innerHTML = ["W", "L"].map(function (p) { return "<option value=\"" + p + "\"></option>"; }).join("");

    function renderBox(box, kind, options) {
      if (!box) return;
      box.innerHTML = "";
      options.forEach(function (opt) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "bend-mini-opt";
        btn.textContent = opt;
        btn.setAttribute("role", "option");
        var isEnabled = true;
        if (kind === "shape") {
          var pfx = shapeToPrefixes(opt);
          isEnabled = pfx.some(function (p) { return prefixes.indexOf(p) !== -1; });
        } else {
          var pfx2 = typeToPrefixes(opt);
          var allowed = shapeToPrefixes(state.selectedShape);
          isEnabled = pfx2.some(function (p) {
            return prefixes.indexOf(p) !== -1 && (!allowed.length || allowed.indexOf(p) !== -1);
          });
        }
        if (!isEnabled) {
          btn.disabled = true;
          btn.classList.add("is-disabled");
        }
        btn.addEventListener("click", function () {
          if (btn.disabled) return;
          if (kind === "shape") {
            state.selectedShape = opt;
            state.selectedType = opt === "L" ? "L" : "W";
            state.page = 0;
            var tEl = getEl("bendTypeFilter");
            if (tEl) tEl.value = state.selectedType;
            var sEl = getEl("bendShapeFilter");
            if (sEl) sEl.value = state.selectedShape;
            populateFilterOptions();
          } else {
            state.selectedType = opt;
            state.page = 0;
            var tEl2 = getEl("bendTypeFilter");
            if (tEl2) tEl2.value = state.selectedType;
          }
          rerenderList();
        });
        box.appendChild(btn);
      });
    }

    renderBox(shapeBox, "shape", ["I", "L"]);
    renderBox(typeBox, "type", ["W", "L"]);

    syncFilterActiveStates();
  }

  function syncFilterActiveStates() {
    var shapeVal = String(state.selectedShape || "").trim().toUpperCase();
    var typeVal = String(state.selectedType || "").trim().toUpperCase();

    function sync(boxId, active) {
      var box = getEl(boxId);
      if (!box) return;
      Array.prototype.forEach.call(box.querySelectorAll(".bend-mini-opt"), function (b) {
        b.classList.toggle("is-active", String(b.textContent || "").trim().toUpperCase() === active);
      });
    }
    sync("bendShapeOptionsList", shapeVal === "I" ? "I" : shapeVal);
    sync("bendTypeOptionsList", typeVal);
  }

  function rerenderList() {
    var list = filteredSections();
    state.sections = list;

    if (state.selectedShape === "I" && state.selectedType === "W") {
      var preferred = [
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
      var mid = Math.ceil(ordered.length / 2);
      var left = ordered.slice(0, mid);
      var right = ordered.slice(mid);
      var totalRows = Math.max(left.length, right.length);
      updatePagination(totalRows);
      var pageStart = state.page * ROWS_PER_PAGE;
      var pageEnd = pageStart + ROWS_PER_PAGE;
      renderSectionGridColumnPairs(left.slice(pageStart, pageEnd), right.slice(pageStart, pageEnd));
    } else {
      var totalRows2 = Math.ceil(list.length / 2);
      updatePagination(totalRows2);
      var pageStart2 = state.page * ROWS_PER_PAGE * 2;
      var pageEnd2 = pageStart2 + ROWS_PER_PAGE * 2;
      renderSectionGrid(list.slice(pageStart2, pageEnd2));
    }
    syncFilterActiveStates();
  }

  function classLabel(cls) {
    if (cls === "COMPACT") return "Compact Flange";
    if (cls === "NON-COMPACT") return "Non-compact Flange";
    return "Slender Flange";
  }

  function updateMethodUI() {
    var btn = getEl("bendMethodToggle");
    if (!btn) return;
    btn.textContent = state.method;
    btn.setAttribute("aria-pressed", state.method === "ASD" ? "true" : "false");
    var label = getEl("bendCapacityLabel");
    if (label) {
      label.innerHTML =
        state.method === "LRFD"
          ? "Bending capacity (<em>M</em><sub>u</sub>) (kip·in)"
          : "Bending capacity (<em>M</em><sub>a</sub>) (kip·in)";
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
      setText("bendClass", "—");
      setVal("bendMn", "--");
      setVal("bendMa", "--");
      out.textContent = "Select a section to begin.";
      out.classList.remove("is-error");
      return;
    }

    var p = state._selectedProps;
    var zxEl = getEl("bendAnalysisZx");
    if (zxEl && Number.isFinite(p.Zx)) zxEl.value = String(p.Zx);

    var zx = Number.isFinite(p.Zx) ? p.Zx : readNumber(zxEl);

    var r = computeAll({
      E: eVal,
      Fy: fy,
      Zx: zx,
      Sx: p.Sx,
      bf: p.bf,
      tf: p.tf,
      tw: p.tw,
      d: p.d,
      lambdaF: p.lambdaF,
      lambdaW: p.lambdaW,
      method: state.method,
    });

    if (!r.ok) {
      out.textContent = r.error;
      out.classList.add("is-error");
      return;
    }

    out.classList.remove("is-error");
    var v = r.values;

    setText("bendSelectedSection", selected);
    setVal("bendLambdaF", fmtFixed(v.lambdaF, 4));
    setVal("bendLambdaW", Number.isFinite(v.lambdaW) ? fmtFixed(v.lambdaW, 4) : "--");
    setVal("bendPropZx", Number.isFinite(p.Zx) ? fmtFixed(p.Zx, 4) : "--");
    setVal("bendSx", Number.isFinite(p.Sx) ? fmtFixed(p.Sx, 4) : "--");
    setVal("bendKc", Number.isFinite(v.kc) ? fmtFixed(v.kc, 4) : "--");
    setVal("bendLambdaPF", fmtFixed(v.lambdaPF, 4));
    setVal("bendLambdaRF", fmtFixed(v.lambdaRF, 4));
    setText("bendClass", classLabel(v.classification));
    setVal("bendMn", fmtFixed(v.Mn, 4));
    setVal("bendMa", fmtFixed(v.Ma, 4));

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
    var tabs = section.querySelectorAll(".bending-top-tabs .bending-tab");
    var designView = getEl("bendDesignView");
    var analysisView = getEl("bendAnalysisView");
    if (!tabs.length || !designView || !analysisView) return;

    function setTabState(isAnalysis) {
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
    var toggle = getEl("bendMethodToggle");
    if (!list || !toggle) return;

    toggle.addEventListener("click", function () {
      state.method = state.method === "ASD" ? "LRFD" : "ASD";
      updateMethodUI();
      computeAndRender(true);
    });

    var fyEl = getEl("bendAnalysisFy");
    var eEl = getEl("bendAnalysisE");
    var gradeEl = getEl("bendAnalysisGrade");
    if (gradeEl) {
      gradeEl.addEventListener("change", function () {
        syncGradeAndFy();
        computeAndRender(true);
      });
    }
    if (eEl) eEl.addEventListener("input", function () { computeAndRender(true); });
    if (fyEl) fyEl.addEventListener("input", function () { computeAndRender(true); });

    var shapeEl = getEl("bendShapeFilter");
    var typeEl = getEl("bendTypeFilter");
    var prevBtn = getEl("bendPagePrev");
    var nextBtn = getEl("bendPageNext");
    if (shapeEl) {
      shapeEl.addEventListener("input", function () {
        var v = String(shapeEl.value || "").trim().toUpperCase();
        if (v === "I" || v === "L") {
          state.selectedShape = v;
          state.selectedType = v === "L" ? "L" : "W";
          state.page = 0;
          if (typeEl) typeEl.value = state.selectedType;
          populateFilterOptions();
          rerenderList();
        }
      });
    }
    if (typeEl) {
      typeEl.addEventListener("input", function () {
        var v2 = String(typeEl.value || "").trim().toUpperCase();
        if (v2 === "W" || v2 === "L") {
          state.selectedType = v2;
          state.page = 0;
          rerenderList();
        }
      });
    }
    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        if (state.page <= 0) return;
        state.page -= 1;
        rerenderList();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        state.page += 1;
        rerenderList();
      });
    }

    document.querySelectorAll("[data-bend-clear]").forEach(function (el) {
      el.addEventListener("click", function () {
        var which = el.getAttribute("data-bend-clear");
        if (which === "shape") state.selectedShape = "I";
        if (which === "type") state.selectedType = "W";
        if (which === "all") {
          state.selectedShape = "I";
          state.selectedType = "W";
        }
        state.page = 0;
        if (shapeEl) shapeEl.value = state.selectedShape;
        if (typeEl) typeEl.value = state.selectedType;
        populateFilterOptions();
        rerenderList();
      });
    });

    updateMethodUI();
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

    fetch("data/aisc-sections.json")
      .then(function (r) {
        return r.ok ? r.json() : Promise.reject(new Error("bad json"));
      })
      .catch(function () {
        return { sections: [] };
      })
      .then(function (data) {
        var rows = (data && data.sections) ? data.sections : [];
        state.allSectionRows = rows
          .map(function (s) {
            if (!s || !s.designation) return null;
            var d = String(s.designation).toUpperCase();
            var copy = Object.assign({}, s, { designation: d });
            state.byDesignation[d] = copy;
            return copy;
          })
          .filter(Boolean);
        state.allSections = state.allSectionRows
          .map(function (s) { return s.designation; })
          .sort();

        var pfx = availablePrefixes();
        if (pfx.indexOf("W") === -1 && pfx.length) {
          state.selectedShape = pfx.indexOf("L") !== -1 ? "L" : "I";
          state.selectedType = state.selectedShape === "L" ? "L" : "W";
        }
        var shapeEl = getEl("bendShapeFilter");
        var typeEl = getEl("bendTypeFilter");
        if (shapeEl) shapeEl.value = state.selectedShape;
        if (typeEl) typeEl.value = state.selectedType;
        populateFilterOptions();
        rerenderList();

        var listEl = getEl("bendSectionList");
        if (listEl && !listEl.children.length && state.selectedShape === "I" && state.selectedType === "W") {
          renderSectionGridColumnPairs(
            ["W12X279", "W12X305", "W12X35", "W12X45", "W12X53", "W12X65"],
            ["W12X30", "W12X336", "W12X40", "W12X50", "W12X58", "W12X72"]
          );
        }

        if (state.byDesignation["W12X45"]) selectSection("W12X45");
        else computeAndRender(true);
      });
  }

  window.addEventListener("load", init);
})();
