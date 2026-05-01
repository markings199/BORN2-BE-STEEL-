(function () {
  "use strict";

  var WB =
    typeof BendingDesignWorkbook !== "undefined" ? BendingDesignWorkbook : null;
  var root = document.getElementById("bendingSection");
  if (!root) return;
  if (!WB) {
    console.error(
      "bending-design-ui.js requires bending-design-workbook.js (load it first)."
    );
    return;
  }

  function byId(id) {
    return document.getElementById(id);
  }

  var gradeSel = byId("bendingDesignGrade");
  var fyEl = byId("bendingDesignFy");
  var eEl = byId("bendingDesignE");
  var dlEl = byId("bendingDesignDL");
  var llEl = byId("bendingDesignLL");
  var spanEl = byId("bendingDesignSpan");
  var methodSel = byId("bendingDesignMethod");
  var manualMuEl = byId("bendingDesignManualMu");
  var manualIxEl = byId("bendingDesignManualIx");
  var deflDivisorEl = byId("bendingDesignDeflDivisor");

  var selDefl = byId("bendingDesignDeflSelect");
  var selBeamWeight = byId("bendingDesignBeamWeightSelect");
  var btnCapWithoutDefl = byId("bendingDesignCapWithoutDeflBtn");
  var btnCapConsideringDefl = byId("bendingDesignCapConsideringDeflBtn");

  var outWuGov = byId("bendingDesignWuGov");
  var outCombo1 = byId("bendingDesignCombo1");
  var outCombo2 = byId("bendingDesignCombo2");
  var outCombo1Lbl = byId("bendingDesignCombo1Lbl");
  var outCombo2Lbl = byId("bendingDesignCombo2Lbl");
  var outWuLbl = byId("bendingDesignWuLbl");
  var outMuCalc = byId("bendingDesignMuCalc");
  var outIxReq = byId("bendingDesignIxReq");
  var outIxFormula = byId("bendingDesignIxFormula");

  var safeSection = byId("bendingDesignSafeSection");
  var safeWeight = byId("bendingDesignSafeWeight");
  var safePhiMn = byId("bendingDesignSafePhiMn");
  var methodTag = byId("bendingDesignMethodTag");
  var phiMnLbl = byId("bendingDesignPhiMnLbl");
  var resultBendingDesign = byId("resultBendingDesign");
  var capTableBody = byId("bendingCapacityTableBody");
  var capDeflTableBody = byId("bendingCapacityDeflTableBody");
  var bendCapacityView = byId("bendCapacityView");
  var bendDesignViewEl = byId("bendDesignView");
  var bendAnalysisViewEl = byId("bendAnalysisView");
  var capDbSearch = byId("bendingCapDbSearch");
  var capDbShape = byId("bendingCapDbShape");
  var capDbType = byId("bendingCapDbType");
  var capDbLabel = byId("bendingCapDbLabel");
  var capDbResultCount = byId("bendingCapDbResultCount");
  var capDbResetBtn = byId("bendingCapDbResetBtn");
  var capDbNavBtn = byId("bendingCapDbNavBtn");

  var state = {
    method: "LRFD",
    deflectionMode: "without considering deflection",
    beamWeightMode: "consider beam weight",
    grades: [],
    catalog: [],
    _capRowsCache: null,
    _capRowsInvalidInputs: false,
    _capDeflRowsCache: null,
    _capDeflRowsInvalidInputs: false,
  };

  function num(raw) {
    var n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  function fmt(n, d) {
    if (!Number.isFinite(n)) return "--";
    var digits = typeof d === "number" ? d : 4;
    return Number(n.toFixed(digits)).toFixed(digits);
  }

  function fmtLoose(n, d) {
    if (!Number.isFinite(n)) return "--";
    return Number(n.toFixed(d)).toString();
  }

  function remarkPillHtml(safe, demand, phiMn) {
    var base = "bending-cap-remark-pill";
    if (!Number.isFinite(demand) || !Number.isFinite(phiMn)) {
      return (
        '<span class="' +
        base +
        " " +
        base +
        '--na" role="status">—</span>'
      );
    }
    if (safe) {
      return (
        '<span class="' +
        base +
        " " +
        base +
        '--safe" role="status">SAFE!</span>'
      );
    }
    return (
      '<span class="' +
      base +
      " " +
      base +
      '--unsafe" role="status">UNSAFE :&lt;</span>'
    );
  }

  function remarkPillHtmlIx(ixSafe, ix, ixLimit) {
    var base = "bending-cap-remark-pill";
    if (!Number.isFinite(ixLimit) || !Number.isFinite(ix)) {
      return (
        '<span class="' +
        base +
        " " +
        base +
        '--na" role="status">—</span>'
      );
    }
    if (ixSafe) {
      return (
        '<span class="' +
        base +
        " " +
        base +
        '--safe" role="status">SAFE!</span>'
      );
    }
    return (
      '<span class="' +
      base +
      " " +
      base +
      '--unsafe" role="status">UNSAFE :&lt;</span>'
    );
  }

  function bendingCapFilteredRows(rows) {
    if (!Array.isArray(rows) || !rows.length) return [];
    var q = (
      capDbSearch && capDbSearch.value ? capDbSearch.value : ""
    )
      .trim()
      .toLowerCase();
    var labelQ = (
      capDbLabel && capDbLabel.value ? capDbLabel.value : ""
    )
      .trim()
      .toLowerCase();
    var shapeVal = capDbShape && capDbShape.value ? capDbShape.value : "";
    var typ = capDbType && capDbType.value ? capDbType.value : "";

    return rows.filter(function (r) {
      var lb = String(r.label || "").toLowerCase();
      if (q && lb.indexOf(q) < 0) return false;
      if (labelQ && lb.indexOf(labelQ) < 0) return false;
      if (shapeVal === "W" && !/^w/i.test(String(r.label || ""))) return false;
      if (typ === "rolled") {
        /* catalog is rolled W-shapes only — keep row */
      }
      return true;
    });
  }

  function isBendingCapacityRouteActive() {
    return !!(bendCapacityView && bendCapacityView.classList.contains("is-active"));
  }

  function hideBendingCapacityRoute() {
    if (!bendCapacityView || !bendCapacityView.classList.contains("is-active"))
      return;
    bendCapacityView.classList.remove("is-active");
    bendCapacityView.setAttribute("aria-hidden", "true");
    if (bendAnalysisViewEl && bendAnalysisViewEl.classList.contains("is-active"))
      return;
    if (bendDesignViewEl) bendDesignViewEl.classList.add("is-active");
  }

  function updateCapacityDbTitle() {
    var h =
      bendCapacityView &&
      bendCapacityView.querySelector(".bending-cap-db-title");
    if (!h) return;
    var defl =
      normalizeMode(state.deflectionMode) ===
      normalizeMode("considering deflection");
    h.textContent = defl
      ? "Capacity Analysis Database (considering deflection)"
      : "Capacity Analysis Database";
  }

  function updateCapacitySplitVisibility() {
    var noDefl = byId("bendingCapSplitNoDefl");
    var defl = byId("bendingCapSplitDefl");
    var isDefl =
      normalizeMode(state.deflectionMode) ===
      normalizeMode("considering deflection");
    if (noDefl) noDefl.hidden = !!isDefl;
    if (defl) defl.hidden = !isDefl;
    updateCapacityDbTitle();
  }

  function renderActiveCapacityTable() {
    if (!isBendingCapacityRouteActive()) return;
    updateCapacitySplitVisibility();
    if (
      normalizeMode(state.deflectionMode) ===
      normalizeMode("considering deflection")
    )
      renderCapacityDeflTableBody();
    else renderCapacityTableBody();
  }

  function showBendingCapacityRoute() {
    if (!bendCapacityView) return;
    if (bendAnalysisViewEl && bendAnalysisViewEl.classList.contains("is-active"))
      return;
    if (bendDesignViewEl) bendDesignViewEl.classList.remove("is-active");
    bendCapacityView.classList.add("is-active");
    bendCapacityView.setAttribute("aria-hidden", "false");
    var dash = root.querySelector(".bending-calculator-dashboard");
    if (dash) dash.scrollIntoView({ behavior: "smooth", block: "start" });
    renderActiveCapacityTable();
  }

  function renderCapacityTableBody() {
    if (!capTableBody || !isBendingCapacityRouteActive()) return;

    capTableBody.textContent = "";

    if (state._capRowsInvalidInputs) {
      if (capDbResultCount) capDbResultCount.textContent = "0 results";
      var invTr = document.createElement("tr");
      var invTd = document.createElement("td");
      invTd.colSpan = 16;
      invTd.textContent =
        "Enter valid Fy, E, and ensure the section catalog is loaded.";
      invTd.style.textAlign = "center";
      invTd.style.padding = "0.75rem";
      invTd.style.background = "#fff";
      invTr.appendChild(invTd);
      capTableBody.appendChild(invTr);
      return;
    }

    var rows = state._capRowsCache;
    if (!Array.isArray(rows)) {
      if (capDbResultCount) capDbResultCount.textContent = "0 results";
      return;
    }

    var filtered = bendingCapFilteredRows(rows);
    if (capDbResultCount)
      capDbResultCount.textContent =
        filtered.length +
        " result" +
        (filtered.length === 1 ? "" : "s");

    if (!filtered.length) {
      var emptyTr = document.createElement("tr");
      var emptyTd = document.createElement("td");
      emptyTd.colSpan = 16;
      emptyTd.textContent = rows.length
        ? "No sections match the current filters."
        : "No capacity rows (catalog empty).";
      emptyTd.style.textAlign = "center";
      emptyTd.style.padding = "0.75rem";
      emptyTd.style.background = "#fff";
      emptyTr.appendChild(emptyTd);
      capTableBody.appendChild(emptyTr);
      return;
    }

    var frag = document.createDocumentFragment();
    var prevGroup = null;
    var zebra = 0;

    for (var i = 0; i < filtered.length; i++) {
      var r = filtered[i];
      var gk = r.groupKey || "—";
      if (gk !== prevGroup) {
        prevGroup = gk;
        var gr = document.createElement("tr");
        gr.className = "bending-cap-group-row";
        var gtd = document.createElement("td");
        gtd.colSpan = 16;
        gtd.textContent = gk;
        gr.appendChild(gtd);
        frag.appendChild(gr);
      }

      var tr = document.createElement("tr");
      tr.className =
        "bending-cap-data-row" +
        (zebra % 2 ? " bending-cap-data-row--alt" : "");
      zebra++;

      function td(className, text) {
        var cell = document.createElement("td");
        if (className) cell.className = className;
        cell.textContent = text;
        tr.appendChild(cell);
      }

      td("bending-cap-section-cell", r.label);
      td("", fmtLoose(r.W, 0));
      td("", fmt(r.lf, 2));
      td("", fmt(r.lw, 1));
      td("", fmt(r.Zx, 0));
      td("", fmt(r.Sx, 0));
      td("", r.Kc != null && Number.isFinite(r.Kc) ? fmt(r.Kc, 6) : "--");
      td("", fmt(r.lambdaPf, 5));
      td("", fmt(r.lambdaRf, 5));
      td("", fmt(r.Mp, 0));
      td("", r.compactness || "—");
      td("", fmt(r.Mn, 0));
      td("", r.WuBeam != null && Number.isFinite(r.WuBeam) ? fmt(r.WuBeam, 4) : "--");
      td("", r.MuBeam != null && Number.isFinite(r.MuBeam) ? fmt(r.MuBeam, 2) : "--");
      td(
        "bending-cap-pu-cell",
        r.phiMn != null && Number.isFinite(r.phiMn)
          ? fmt(r.phiMn, 0)
          : "--"
      );

      var rc = document.createElement("td");
      rc.className = "bending-cap-remark-cell";
      rc.innerHTML = remarkPillHtml(r.safe, r.demand, r.phiMn);
      tr.appendChild(rc);

      frag.appendChild(tr);
    }

    capTableBody.appendChild(frag);
  }

  function renderCapacityDeflTableBody() {
    if (!capDeflTableBody || !isBendingCapacityRouteActive()) return;

    capDeflTableBody.textContent = "";

    if (state._capDeflRowsInvalidInputs) {
      if (capDbResultCount) capDbResultCount.textContent = "0 results";
      var invTr = document.createElement("tr");
      var invTd = document.createElement("td");
      invTd.colSpan = 16;
      invTd.textContent =
        "Enter valid Fy, E, and ensure the section catalog is loaded.";
      invTd.style.textAlign = "center";
      invTd.style.padding = "0.75rem";
      invTd.style.background = "#fff";
      invTr.appendChild(invTd);
      capDeflTableBody.appendChild(invTr);
      return;
    }

    var rows = state._capDeflRowsCache;
    if (!Array.isArray(rows)) {
      if (capDbResultCount) capDbResultCount.textContent = "0 results";
      return;
    }

    var filtered = bendingCapFilteredRows(rows);
    if (capDbResultCount)
      capDbResultCount.textContent =
        filtered.length +
        " result" +
        (filtered.length === 1 ? "" : "s");

    if (!filtered.length) {
      var emptyTr = document.createElement("tr");
      var emptyTd = document.createElement("td");
      emptyTd.colSpan = 16;
      emptyTd.textContent = rows.length
        ? "No sections match the current filters."
        : "No capacity rows (catalog empty).";
      emptyTd.style.textAlign = "center";
      emptyTd.style.padding = "0.75rem";
      emptyTd.style.background = "#fff";
      emptyTr.appendChild(emptyTd);
      capDeflTableBody.appendChild(emptyTr);
      return;
    }

    var frag = document.createDocumentFragment();
    var prevGroup = null;
    var zebra = 0;

    for (var i = 0; i < filtered.length; i++) {
      var r = filtered[i];
      var gk = r.groupKey || "—";
      if (gk !== prevGroup) {
        prevGroup = gk;
        var gr = document.createElement("tr");
        gr.className = "bending-cap-group-row";
        var gtd = document.createElement("td");
        gtd.colSpan = 16;
        gtd.textContent = gk;
        gr.appendChild(gtd);
        frag.appendChild(gr);
      }

      var tr = document.createElement("tr");
      tr.className =
        "bending-cap-data-row" +
        (zebra % 2 ? " bending-cap-data-row--alt" : "");
      zebra++;

      function td(className, text) {
        var cell = document.createElement("td");
        if (className) cell.className = className;
        cell.textContent = text;
        tr.appendChild(cell);
      }

      td("bending-cap-section-cell", r.label);
      td("", fmtLoose(r.W, 0));
      td("", fmt(r.lf, 2));
      td("", fmt(r.lw, 1));
      td("", fmt(r.Zx, 0));
      td("", fmt(r.Sx, 0));
      td("", r.Kc != null && Number.isFinite(r.Kc) ? fmt(r.Kc, 6) : "--");
      td("", fmt(r.lambdaPf, 5));
      td("", fmt(r.lambdaRf, 5));
      td("", fmt(r.Mp, 0));
      td("", r.compactness || "—");
      td("", fmt(r.Mn, 0));
      td(
        "",
        r.muColumnDesignStrength != null &&
          Number.isFinite(r.muColumnDesignStrength)
          ? fmtLoose(r.muColumnDesignStrength, 1)
          : "--"
      );
      td("", r.Ix != null && Number.isFinite(r.Ix) ? fmt(r.Ix, 0) : "--");

      var rcM = document.createElement("td");
      rcM.className = "bending-cap-remark-cell";
      rcM.innerHTML = remarkPillHtml(
        r.momentSafe,
        r.momentDemand,
        r.phiMn
      );
      tr.appendChild(rcM);

      var rcIx = document.createElement("td");
      rcIx.className = "bending-cap-remark-cell";
      rcIx.innerHTML = remarkPillHtmlIx(r.ixSafe, r.Ix, r.ixLimit);
      tr.appendChild(rcIx);

      frag.appendChild(tr);
    }

    capDeflTableBody.appendChild(frag);
  }

  function resetBendingCapFilters() {
    if (capDbSearch) capDbSearch.value = "";
    if (capDbShape) capDbShape.value = "";
    if (capDbType) capDbType.value = "";
    if (capDbLabel) capDbLabel.value = "";
    renderActiveCapacityTable();
  }

  function refreshCapacityTable(sec0, fy, E, method) {
    if (!capTableBody || !capDeflTableBody) return;

    var bad =
      fy == null ||
      fy <= 0 ||
      E == null ||
      E <= 0 ||
      !state.catalog.length;

    if (bad) {
      state._capRowsInvalidInputs = true;
      state._capDeflRowsInvalidInputs = true;
      state._capRowsCache = [];
      state._capDeflRowsCache = [];
    } else {
      state._capRowsInvalidInputs = false;
      state._capDeflRowsInvalidInputs = false;
      state._capRowsCache = WB.capacityAnalysisRowsWithoutDeflection(
        state.catalog,
        method,
        sec0,
        fy,
        E
      );
      state._capDeflRowsCache = WB.capacityAnalysisRowsConsideringDeflection(
        state.catalog,
        method,
        sec0,
        fy,
        E
      );
    }

    if (!isBendingCapacityRouteActive()) return;
    renderActiveCapacityTable();
  }

  function setInvalid(el, bad, title) {
    if (!el) return;
    el.classList.toggle("is-invalid", !!bad);
    if (bad && title) el.setAttribute("title", title);
    else el.removeAttribute("title");
  }

  function setOut(el, text) {
    if (!el) return;
    var s =
      text === null || text === undefined ? "" : String(text);
    var tag = el.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT")
      el.value = s;
    else el.textContent = s;
  }

  function normalizeMode(s) {
    return String(s || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function lightestSafe(sec0) {
    return WB.pickLightestSection(state.catalog, state.method, sec0);
  }

  function syncMethodUi() {
    var m = state.method;
    if (methodSel) methodSel.value = m;
    if (methodTag)
      methodTag.textContent =
        "→ " + (m === "LRFD" ? "(LRFD METHOD)" : "(ASD METHOD)");

    if (outWuLbl) outWuLbl.textContent = m === "LRFD" ? "GOVERNING Wu =" : "ALLOWABLE Wa =";
    if (outCombo1Lbl)
      outCombo1Lbl.textContent =
        m === "LRFD" ? "1.2DL+1.6LL" : "DL+LL";
    if (outCombo2Lbl)
      outCombo2Lbl.textContent = m === "LRFD" ? "1.4DL" : "—";

    if (phiMnLbl)
      phiMnLbl.innerHTML =
        m === "LRFD" ? "M<sub>u</sub> =" : "M<sub>a</sub> =";

    var capLbl =
      m === "LRFD"
        ? "CAPACITY ANALYSIS"
        : "CAPACITY ANALYSIS (ASD)";
    root.querySelectorAll(".bending-cap-analysis-btn-head").forEach(function (el) {
      el.textContent = capLbl;
    });

    root.querySelectorAll(".bending-demand-mu-factored-lbl").forEach(function (el) {
      el.innerHTML =
        m === "LRFD"
          ? "<strong>M<sub>u</sub> (Factored Moment):</strong>"
          : "<strong>M<sub>a</sub> (Allowable Moment):</strong>";
    });
    var formulaStrip = byId("bendingDemandFormulaDisplay");
    if (formulaStrip)
      formulaStrip.innerHTML =
        m === "LRFD"
          ? "M<sub>u</sub> = <em>w</em>L²/8"
          : "M<sub>a</sub> = <em>w</em>L²/8";
    var manualIns = byId("bendingDemandManualInstruction");
    if (manualIns)
      manualIns.innerHTML =
        m === "LRFD"
          ? "<em>INSTRUCTION: LEAVE THE YELLOW M<sub>u</sub> BELOW AS <strong>0</strong> IF THE BEAM IS SIMPLY SUPPORTED.</em>"
          : "<em>INSTRUCTION: LEAVE THE YELLOW M<sub>a</sub> BELOW AS <strong>0</strong> IF THE BEAM IS SIMPLY SUPPORTED.</em>";

    syncDeflectionSelect();
    syncBeamWeightSelect();
    syncCapacityTableHeaders();
    syncCapacityDeflTableHeaders();
  }

  function syncCapacityTableHeaders() {
    var thWu = byId("bendingCapThWu");
    var thMuBeam = byId("bendingCapThMuBeam");
    var thDesign = byId("bendingCapThDesignStrength");
    if (!thWu || !thMuBeam || !thDesign) return;
    var m = state.method;
    if (m === "LRFD") {
      thWu.innerHTML = "W<sub>u</sub> (w/ beam wt)";
      thMuBeam.innerHTML = "M<sub>u</sub> (w/ beam wt)";
      thDesign.innerHTML = "M<sub>u</sub>";
      thDesign.title =
        "Design flexural strength column (LRFD): 0.9Mn, shown under Mu header in workbook capacity sheet.";
    } else {
      thWu.innerHTML = "w<sub>a</sub> (w/ beam wt)";
      thMuBeam.innerHTML = "M<sub>a</sub> (w/ beam wt)";
      thDesign.innerHTML = "M<sub>u</sub>";
      thDesign.title =
        "Design flexural strength column (ASD): Mn/1.67, shown under Mu header in workbook capacity sheet.";
    }
  }

  function syncCapacityDeflTableHeaders() {
    var thMu = byId("bendingCapDeflThMu");
    if (!thMu) return;
    thMu.innerHTML = "M<sub>u</sub>";
  }

  function syncCapAnalysisButtons() {
    var key = normalizeMode(state.deflectionMode);
    var vConsider = normalizeMode("considering deflection");
    var isConsider = key === vConsider;
    if (btnCapWithoutDefl) {
      btnCapWithoutDefl.setAttribute("aria-pressed", isConsider ? "false" : "true");
      btnCapWithoutDefl.classList.toggle("is-selected", !isConsider);
    }
    if (btnCapConsideringDefl) {
      btnCapConsideringDefl.setAttribute("aria-pressed", isConsider ? "true" : "false");
      btnCapConsideringDefl.classList.toggle("is-selected", isConsider);
    }
  }

  function syncDeflectionSelect() {
    var key = normalizeMode(state.deflectionMode);
    var vConsider = normalizeMode("considering deflection");
    var val =
      key === vConsider
        ? "considering deflection"
        : "without considering deflection";
    if (selDefl) selDefl.value = val;
    syncCapAnalysisButtons();
  }

  function syncBeamWeightSelect() {
    if (!selBeamWeight) return;
    var key = normalizeMode(state.beamWeightMode);
    var vIgnore = normalizeMode("ignore beam weight");
    selBeamWeight.value =
      key === vIgnore ? "ignore beam weight" : "consider beam weight";
  }

  function setMethod(next) {
    next = String(next || "").trim().toUpperCase();
    if (next !== "LRFD" && next !== "ASD") next = "LRFD";
    state.method = next;
    syncMethodUi();
    recompute();
  }

  function setDeflectionMode(label) {
    state.deflectionMode = normalizeMode(label);
    syncDeflectionSelect();
    recompute();
  }

  function setBeamWeightMode(label) {
    state.beamWeightMode = normalizeMode(label);
    syncBeamWeightSelect();
    recompute();
  }

  function getGradeList() {
    if (window.SteelAPI && typeof SteelAPI.listSteelGrades === "function") {
      return SteelAPI.listSteelGrades()
        .then(function (res) {
          var list = res && Array.isArray(res.grades) ? res.grades : [];
          return list
            .map(function (g) {
              return {
                astm: String(g.astm || "").trim(),
                fy: Number(g.fy),
                fu: Number(g.fu),
              };
            })
            .filter(function (g) {
              return g.astm && Number.isFinite(g.fy);
            });
        })
        .catch(function () {
          return null;
        });
    }
    return Promise.resolve(null);
  }

  function fallbackGrades() {
    var list =
      window.Born2BeSteel && Born2BeSteel.steelGrades
        ? Born2BeSteel.steelGrades
        : [];
    return list
      .map(function (g) {
        return {
          astm: String(g.astm || "").trim(),
          fy: Number(g.fy),
          fu: Number(g.fu),
        };
      })
      .filter(function (g) {
        return g.astm && Number.isFinite(g.fy);
      });
  }

  function setGrade(astm) {
    if (!state.grades.length) return;
    var g = state.grades.find(function (x) {
      return String(x.astm).trim() === String(astm).trim();
    });
    if (!g) g = state.grades[0];
    if (gradeSel) gradeSel.value = g.astm;
    if (fyEl) fyEl.value = fmtLoose(g.fy, 0);
    recompute();
  }

  function readFy() {
    return num(fyEl ? fyEl.value : null);
  }

  function recompute() {
    var method = state.method;
    var fy = readFy();
    var E = num(eEl ? eEl.value : null);
    var DL = num(dlEl ? dlEl.value : null);
    var LL = num(llEl ? llEl.value : null);
    var L_ft = num(spanEl ? spanEl.value : null);
    var manualMu = num(manualMuEl ? manualMuEl.value : null);
    var manualIx = num(manualIxEl ? manualIxEl.value : null);
    var deflDiv = num(deflDivisorEl ? deflDivisorEl.value : null);

    var dlS = DL == null ? 0 : DL;
    var llS = LL == null ? 0 : LL;
    manualMu = manualMu == null ? 0 : manualMu;
    manualIx = manualIx == null ? 0 : manualIx;

    setInvalid(dlEl, DL != null && DL < 0, "DL must be ≥ 0.");
    setInvalid(llEl, LL != null && LL < 0, "LL must be ≥ 0.");
    setInvalid(spanEl, L_ft != null && L_ft <= 0, "Beam length must be > 0.");
    setInvalid(eEl, E != null && E <= 0, "E must be > 0.");
    setInvalid(fyEl, !(fy != null && fy > 0), "Fy must be > 0.");
    setInvalid(manualMuEl, manualMu < 0, "Manual Mu must be ≥ 0.");
    setInvalid(manualIxEl, manualIx < 0, "Manual Ix must be ≥ 0.");
    setInvalid(
      deflDivisorEl,
      deflDiv != null && deflDiv <= 0,
      "Deflection divisor must be > 0."
    );

    var combo1 =
      method === "LRFD" ? 1.2 * dlS + 1.6 * llS : dlS + llS;
    var combo2 = method === "LRFD" ? 1.4 * dlS : null;
    var wGov = WB.wuGoverning(method, dlS, llS);

    setOut(outCombo1, fmtLoose(combo1, 1));
    setOut(
      outCombo2,
      method === "LRFD" && combo2 != null ? fmtLoose(combo2, 1) : "—"
    );
    setOut(outWuGov, fmtLoose(wGov, 1));

    var O39 =
      fy != null &&
      E != null &&
      L_ft != null &&
      L_ft > 0 &&
      Number.isFinite(wGov)
        ? WB.muDemandFromW(wGov, L_ft)
        : null;

    setOut(outMuCalc, fmtLoose(O39, 2));

    var ixReq =
      deflDiv != null &&
      deflDiv > 0 &&
      E != null &&
      E > 0 &&
      L_ft != null &&
      L_ft > 0 &&
      Number.isFinite(llS)
        ? WB.ixRequiredExcel(llS, L_ft, E, deflDiv)
        : null;

    setOut(outIxReq, fmt(ixReq, 6));
    if (outIxFormula)
      outIxFormula.innerHTML =
        "<span class=\"bending-ix-formula-main\">Δ<sub>max</sub> = 5<em>WL</em>⁴/(384<em>EI</em>)</span>";

    var deflectionNorm = normalizeMode(state.deflectionMode);
    var beamWeightNorm = normalizeMode(state.beamWeightMode);

    var sec0 = {
      fy: fy,
      E: E,
      DL: dlS,
      LL: llS,
      L_ft: L_ft,
      wGov: wGov,
      O39: O39,
      manualMu: manualMu,
      ixReq: ixReq,
      manualIx: manualIx,
      deflectionNorm: deflectionNorm,
      beamWeightNorm: beamWeightNorm,
    };

    var pick = null;
    if (
      fy != null &&
      fy > 0 &&
      E != null &&
      E > 0 &&
      L_ft != null &&
      L_ft > 0 &&
      state.catalog.length
    ) {
      pick = lightestSafe(sec0);
    }

    if (safeSection)
      setOut(safeSection, pick && pick.sec ? pick.sec.label : "--");
    setOut(
      safeWeight,
      pick && pick.sec ? fmtLoose(pick.sec.weightPlf, 0) : "--"
    );
    setOut(
      safePhiMn,
      pick && Number.isFinite(pick.phiMn) ? fmtLoose(pick.phiMn, 2) : "--"
    );

    if (resultBendingDesign) resultBendingDesign.textContent = "";

    refreshCapacityTable(sec0, fy, E, method);
  }

  function bind() {
    if (root.__bendingDesignBound) return;
    root.__bendingDesignBound = true;

    var form = byId("formBending");
    if (form && !form.__bdSubmitHook) {
      form.__bdSubmitHook = true;
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (form.querySelector('.bend-view[data-bend-view="analysis"].is-active')) return;
        recompute();
      });
    }

    [
      eEl,
      dlEl,
      llEl,
      spanEl,
      manualMuEl,
      manualIxEl,
      deflDivisorEl,
    ].forEach(function (el) {
      if (el) el.addEventListener("input", recompute);
    });

    if (gradeSel)
      gradeSel.addEventListener("change", function () {
        setGrade(gradeSel.value);
      });

    if (methodSel)
      methodSel.addEventListener("change", function () {
        setMethod(methodSel.value);
      });

    if (selDefl)
      selDefl.addEventListener("change", function () {
        setDeflectionMode(selDefl.value);
        if (isBendingCapacityRouteActive()) renderActiveCapacityTable();
      });
    if (selBeamWeight)
      selBeamWeight.addEventListener("change", function () {
        setBeamWeightMode(selBeamWeight.value);
      });

    function wireCapBtn(btn) {
      if (!btn) return;
      btn.addEventListener("click", function () {
        var mode = btn.getAttribute("data-cap-mode");
        if (!mode) return;
        if (
          normalizeMode(mode) ===
          normalizeMode("without considering deflection")
        ) {
          setDeflectionMode(mode);
          showBendingCapacityRoute();
        } else {
          setDeflectionMode(mode);
          showBendingCapacityRoute();
        }
      });
    }
    wireCapBtn(btnCapWithoutDefl);
    wireCapBtn(btnCapConsideringDefl);

    function wireCapDbFilter(el, evtName) {
      if (!el) return;
      el.addEventListener(evtName || "input", function () {
        renderActiveCapacityTable();
      });
    }
    wireCapDbFilter(capDbSearch);
    wireCapDbFilter(capDbLabel);
    wireCapDbFilter(capDbShape, "change");
    wireCapDbFilter(capDbType, "change");
    if (capDbResetBtn)
      capDbResetBtn.addEventListener("click", function () {
        resetBendingCapFilters();
      });
    if (capDbNavBtn)
      capDbNavBtn.addEventListener("click", function () {
        hideBendingCapacityRoute();
      });
  }

  function init() {
    bind();
    syncMethodUi();

    fetch("data/aisc-sections.json")
      .then(function (r) {
        return r.json();
      })
      .then(function (json) {
        state.catalog = WB.parseCatalog(json);
      })
      .catch(function () {
        state.catalog = [];
      })
      .finally(function () {
        getGradeList().then(function (list) {
          if (!list || !list.length) list = fallbackGrades();
          state.grades = list || [];
          if (gradeSel) {
            gradeSel.innerHTML = "";
            state.grades.forEach(function (g) {
              var opt = document.createElement("option");
              opt.value = g.astm;
              opt.textContent = g.astm;
              gradeSel.appendChild(opt);
            });
          }
          var pref =
            state.grades.find(function (g) {
              return String(g.astm).trim() === "A572 Gr. 60";
            }) || state.grades[0];
          setGrade(pref ? pref.astm : "");
          recompute();
        });
      });
  }

  init();
})();
