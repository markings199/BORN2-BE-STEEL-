/**
 * Shear module — Analysis Calculator (`SHEAR ANALYSIS` sheet).
 * Formulas: ShearDesignWorkbook.evaluateShearAnalysisRow — Cv Q39, φ F39, Ω K39, Vn Y28, strength Y38.
 */
(function () {
  "use strict";

  var PREFERRED_GRADE = "A501 Gr. A";
  /** Fallback tooltip on Tu/Ta (Y38) output until computed. */
  var SHEAR_STRENGTH_TITLE_IDLE =
    "Workbook SHEAR ANALYSIS Y38 (Tu LRFD, Ta ASD); readonly.";
  var SDW = function () {
    return window.ShearDesignWorkbook;
  };

  function getEl(id) {
    return document.getElementById(id);
  }
  function setVal(id, v) {
    var el = getEl(id);
    if (el && "value" in el) el.value = v == null ? "" : String(v);
  }
  function setText(id, v) {
    var el = getEl(id);
    if (el) el.textContent = v == null ? "" : String(v);
  }
  function readNumber(el) {
    if (!el) return null;
    var n = parseFloat(String(el.value || "").replace(/,/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  function fmt(n, d) {
    if (!Number.isFinite(n)) return "--";
    return Number(n).toFixed(d);
  }
  function setShearStrengthOutputTitle(text) {
    var el = getEl("shearUltimateVu");
    if (el) el.setAttribute("title", text);
  }
  /**
   * Excel `SHEAR ANALYSIS` !X33 (panel heading), !X38 (symbol), Y38 value — mirrors F9 branch.
   */
  function syncShearStrengthPanel(method, row) {
    var vuInput = getEl("shearUltimateVu");
    if (!vuInput) return;
    var asd = method === "ASD";
    var card = vuInput.closest(".bend-results-moment-card");
    var headEl = card && card.querySelector(".bend-a-head.shear-analysis-head-mixed");
    var rowEl = vuInput.closest(".bend-nominal-row");
    var symLabel = rowEl && rowEl.querySelector(".bend-nominal-label");
    if (headEl) {
      headEl.textContent = asd ? "ALLOWABLE SHEAR" : "ULTIMATE SHEAR";
      headEl.classList.toggle("is-ultimate-shear", !asd);
    }
    if (symLabel) symLabel.innerHTML = asd ? "<em>T</em><sub>a</sub> =" : "<em>T</em><sub>u</sub> =";
    vuInput.readOnly = true;
    vuInput.setAttribute("aria-readonly", "true");
    vuInput.setAttribute("tabindex", "-1");
    var ds = row && row.valid && Number.isFinite(row.designStrength) ? row.designStrength : NaN;
    vuInput.value = Number.isFinite(ds) ? fmt(ds, 4) : "--";
    vuInput.setAttribute(
      "aria-label",
      asd
        ? "Allowable shear design strength Ta — workbook SHEAR ANALYSIS Y38 (kips)"
        : "Ultimate shear design strength Tu — workbook SHEAR ANALYSIS Y38 (kips)"
    );
    if (Number.isFinite(ds)) {
      setShearStrengthOutputTitle(
        (asd ? "ASD: Ta = Y38 = K39·Y28 = Ωv·Vn (sheet). " : "LRFD: Tu = Y38 = F39·Y28 = φv·Vn (sheet). ") +
          fmt(ds, 4) +
          " kips."
      );
    } else {
      setShearStrengthOutputTitle(SHEAR_STRENGTH_TITLE_IDLE);
    }
  }
  function steelGradeSvc() {
    return window.SteelGradesService;
  }
  function activeShearAnalysis() {
    var v = getEl("shearViewAnalysis");
    return v && v.classList.contains("is-active");
  }

  var state = {
    byDesignation: Object.create(null),
    catalogRows: [],
    useExcelDb2Catalog: false,
    excelShapesActive: { i: true, l: false },
    excelTypesActive: { W: true, L: false },
    excelShapeMulti: false,
    excelTypeMulti: false,
    shapeFilter: "i",
    typeFilter: "W",
    selected: null,
    _selectedProps: null,
    method: "ASD",
    selectedGrade: PREFERRED_GRADE,
  };

  function bendingPickerCatalogRow(s) {
    if (!s || s.designation == null) return false;
    var ty = String(s.type || "").toUpperCase();
    if (ty === "W") {
      return ["d", "tw", "lambdaW"].every(function (k) {
        return Number.isFinite(Number(s[k]));
      });
    }
    if (ty === "L") return String(s.designation).trim() !== "";
    return false;
  }

  function aiscManualLabelDisplay(row) {
    if (!row) return "";
    var m = row.aiscManualLabel;
    if (m != null && String(m).trim()) return String(m).trim();
    return row.designation || "";
  }

  function passesShape(row) {
    var sa = state.excelShapesActive || {};
    if (!sa.i && !sa.l) return true;
    var ty = String(row.type || "").toUpperCase();
    if (sa.i && ty === "W") return true;
    if (sa.l && ty === "L") return true;
    return false;
  }

  function passesType(row) {
    var ta = state.excelTypesActive || {};
    if (!ta.W && !ta.L) return true;
    var ty = String(row.type || "").toUpperCase();
    if (ta.W && ty === "W") return true;
    if (ta.L && ty === "L") return true;
    return false;
  }

  function getFilteredDesignations() {
    var rows = state.catalogRows || [];
    var out = [];
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      if (!passesShape(row) || !passesType(row)) continue;
      out.push(row.designation);
    }
    return out;
  }

  function renderList() {
    var list = getEl("shearSectionList");
    if (!list) return;
    list.innerHTML = "";
    var des = getFilteredDesignations();
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
      b.addEventListener(
        "click",
        (function (k) {
          return function (e) {
            e.preventDefault();
            selectSection(k);
          };
        })(key)
      );
      list.appendChild(b);
    }
  }

  function selectSection(keyU) {
    state.selected = String(keyU || "").toUpperCase();
    renderList();
    state._selectedProps = state.byDesignation[state.selected] || null;
    computeAndRender(true);
  }

  function syncGrade() {
    var gradeEl = getEl("shearAnalysisGrade");
    var fyEl = getEl("shearAnalysisFy");
    if (!gradeEl || !fyEl) return;
    state.selectedGrade = String(gradeEl.value || "").trim();
    var svc = steelGradeSvc();
    var fy = svc && typeof svc.fyFor === "function" ? svc.fyFor(state.selectedGrade) : null;
    if (Number.isFinite(fy)) fyEl.value = String(Math.round(fy));
  }

  function renderFilterChips() {
    var shapeHost = getEl("shearNsShapeIcons");
    var typeHost = getEl("shearNsTypeChips");
    if (!shapeHost || !typeHost) return;
    shapeHost.innerHTML = "";
    typeHost.innerHTML = "";
    ["I", "L"].forEach(function (lbl, idx) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ns-chip-btn";
      b.setAttribute("data-shear-shape", idx === 0 ? "i" : "l");
      b.textContent = lbl;
      b.classList.toggle("is-active", !!(idx === 0 ? state.excelShapesActive.i : state.excelShapesActive.l));
      shapeHost.appendChild(b);
    });
    ["W", "L"].forEach(function (t) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ns-chip-btn";
      b.setAttribute("data-shear-type", t);
      b.textContent = t;
      b.classList.toggle("is-active", !!(t === "W" ? state.excelTypesActive.W : state.excelTypesActive.L));
      typeHost.appendChild(b);
    });
  }

  function computeAndRender(force) {
    if (!force && !activeShearAnalysis()) return;
    var out = getEl("resultShearAnalysis");
    var wb = SDW();
    var methodEl = getEl("shearAnalysisMethod");
    var method = methodEl && methodEl.value === "ASD" ? "ASD" : "LRFD";
    state.method = method;

    if (!wb || typeof wb.evaluateShearAnalysisRow !== "function") {
      syncShearStrengthPanel(method, null);
      if (out) out.textContent = "ShearDesignWorkbook not loaded.";
      return;
    }

    syncGrade();
    var E = readNumber(getEl("shearAnalysisE"));
    var fy = readNumber(getEl("shearAnalysisFy"));

    setVal("shearLrfdFactor", "--");
    setVal("shearAsdOmega", "--");
    setVal("shearCv", "--");
    setVal("shearVn", "--");

    if (!state._selectedProps) {
      syncShearStrengthPanel(method, null);
      setText("shearSelectedSection", "—");
      setVal("shearOutTw", "--");
      setVal("shearOutHtw", "--");
      setVal("shearOutD", "--");
      setVal("shearOutAw", "--");
      if (out) {
        out.textContent =
          getFilteredDesignations().length === 0
            ? "No sections match Shapes / Type filters."
            : "Select a section.";
      }
      return;
    }

    var p = state._selectedProps;
    setText("shearSelectedSection", aiscManualLabelDisplay(p));

    if (String(p.type || "").toUpperCase() !== "W") {
      syncShearStrengthPanel(method, null);
      setVal("shearOutTw", "--");
      setVal("shearOutHtw", "--");
      setVal("shearOutD", "--");
      setVal("shearOutAw", "--");
      if (out)
        out.textContent =
          "Shear web formulas apply to W-shapes. Select Shape I and Type W.";
      return;
    }

    var d = Number(p.d);
    var tw = Number(p.tw);
    var K = Number(p.lambdaW);
    setVal("shearOutTw", Number.isFinite(tw) ? fmt(tw, 4) : "--");
    setVal("shearOutHtw", Number.isFinite(K) ? fmt(K, 4) : "--");
    setVal("shearOutD", Number.isFinite(d) ? fmt(d, 4) : "--");
    var Aw = Number.isFinite(d) && Number.isFinite(tw) ? d * tw : NaN;
    setVal("shearOutAw", Number.isFinite(Aw) ? fmt(Aw, 4) : "--");

    if (E == null || !(E > 0) || fy == null || !(fy > 0)) {
      syncShearStrengthPanel(method, null);
      if (out) out.textContent = "Enter valid E and Fy (ksi).";
      return;
    }

    var sec = {
      aiscManualLabel: aiscManualLabelDisplay(p),
      weightPlf: Number(p.weight) || 0,
      d: d,
      tw: tw,
      lambdaW: Number.isFinite(K) ? K : null,
    };

    /** Capacity-only path: Excel row shows Y38; no separate demand cell on this UI. */
    var row = wb.evaluateShearAnalysisRow(sec, E, fy, method, null);

    if (!row.valid) {
      syncShearStrengthPanel(method, row);
      setVal("shearCv", "--");
      setVal("shearVn", "--");
      if (out) out.textContent = "Invalid h/tw or geometry for shear capacity.";
      return;
    }

    setVal("shearLrfdFactor", fmt(row.phiLRFD, 2));
    setVal("shearAsdOmega", fmt(row.omegaASD, 2));
    setVal("shearCv", fmt(row.Cv, 4));
    setVal("shearVn", fmt(row.Vn, 4));
    syncShearStrengthPanel(method, row);
    var ds = row.designStrength;
    if (out) {
      var parts = [
        method +
          " — workbook Y38 design strength: " +
          (Number.isFinite(ds) ? fmt(ds, 4) : "--") +
          " kips; Vn (Y28): " +
          fmt(row.Vn, 4) +
          " kips.",
      ];
      if (row.remark) parts.push(row.remark + ".");
      out.textContent = parts.join(" ");
    }
  }

  function bindFilters() {
    var panel = getEl("shearSectionFiltersPanel");
    if (!panel) return;
    panel.addEventListener("click", function (ev) {
      var t = ev.target;
      if (!t || !t.closest) return;
      var shapeBtn = t.closest("[data-shear-shape]");
      if (shapeBtn) {
        ev.preventDefault();
        var s = shapeBtn.getAttribute("data-shear-shape");
        state.excelShapesActive = { i: s === "i", l: s === "l" };
        renderFilterChips();
        renderList();
        state.selected = null;
        state._selectedProps = null;
        computeAndRender(true);
        return;
      }
      var typeBtn = t.closest("[data-shear-type]");
      if (typeBtn) {
        ev.preventDefault();
        var typ = typeBtn.getAttribute("data-shear-type");
        state.excelTypesActive = { W: typ === "W", L: typ === "L" };
        renderFilterChips();
        renderList();
        state.selected = null;
        state._selectedProps = null;
        computeAndRender(true);
      }
    });
  }

  function populateGrades() {
    var el = getEl("shearAnalysisGrade");
    if (!el) return;
    var svc = steelGradeSvc();
    var list = (svc && svc.getGrades && svc.getGrades()) || [];
    el.innerHTML = "";
    list.forEach(function (gr) {
      if (!gr || gr.astm == null) return;
      var o = document.createElement("option");
      o.value = String(gr.astm);
      o.textContent = String(gr.astm);
      el.appendChild(o);
    });
    var hit = list.find(function (g) {
      return g && String(g.astm) === PREFERRED_GRADE;
    });
    el.value = hit ? hit.astm : list[0] ? list[0].astm : "";
    syncGrade();
  }

  function initCatalog() {
    fetch("data/aisc-sections.json")
      .then(function (r) {
        return r.ok ? r.json() : Promise.reject();
      })
      .catch(function () {
        return { sections: [] };
      })
      .then(function (data) {
        state.byDesignation = Object.create(null);
        state.catalogRows = [];
        state.useExcelDb2Catalog = false;
        var bac = data && data.bendingAnalysisCatalog;
        var srcRows =
          bac && Array.isArray(bac.sections) && bac.sections.length ? bac.sections : data.sections || [];
        if (bac && bac.sections && bac.sections.length) state.useExcelDb2Catalog = true;

        state.catalogRows = srcRows
          .map(function (s) {
            if (!bendingPickerCatalogRow(s)) return null;
            var d = String(s.designation).toUpperCase();
            var copy = Object.assign({}, s, { designation: d });
            state.byDesignation[d] = copy;
            return copy;
          })
          .filter(Boolean);

        renderFilterChips();
        renderList();
        var pick =
          state.byDesignation["W30X99"] ||
          state.byDesignation["W14X193"] ||
          state.byDesignation["W12X45"] ||
          state.catalogRows[0];
        if (pick) selectSection(pick.designation);
        else computeAndRender(true);
      });
  }

  function bindInputs() {
    var m = getEl("shearAnalysisMethod");
    if (m) {
      m.addEventListener("change", function () {
        computeAndRender(true);
      });
    }
    var g = getEl("shearAnalysisGrade");
    if (g) g.addEventListener("change", function () { syncGrade(); computeAndRender(true); });
    var e = getEl("shearAnalysisE");
    if (e) e.addEventListener("input", function () { computeAndRender(true); });
  }

  function init() {
    if (!getEl("shearSection") || !getEl("shearSectionList")) return;
    var svc = steelGradeSvc();
    if (svc && svc.ensureLoaded) {
      svc.ensureLoaded().then(populateGrades).catch(populateGrades);
    } else {
      populateGrades();
    }
    bindInputs();
    bindFilters();
    initCatalog();
    if (svc && svc.onUpdate) {
      svc.onUpdate(function () {
        populateGrades();
        computeAndRender(true);
      });
    }
  }

  window.refreshShearAnalysis = function () {
    computeAndRender(true);
  };

  window.addEventListener("load", init);
})();
