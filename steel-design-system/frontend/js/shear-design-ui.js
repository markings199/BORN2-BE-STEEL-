/**
 * Shear module — `SHEAR DESIGN` Design Calculator UI (Born2BeSteel workbook).
 */
(function () {
  "use strict";

  var root = document.getElementById("shearSection");
  if (!root) return;

  var WB = window.ShearDesignWorkbook;
  if (!WB) return;

  /**
   * `Shear Design` sheet defaults — `Born2BeSteel Final (6) (1).xlsx`:
   * F8 method, G22/G27/G33 (DL/LL klf, span ft), R9 grade, P12 E; O46/G55 manual zeros; F39/F42 member options.
   * Fy display follows selected grade (X10 tracks grade in workbook).
   */
  var EXCEL_SHEAR_DESIGN_DEFAULTS = {
    steelGrade: "A36",
    dl: 0.2,
    ll: 0.8,
    Lft: 35,
    E: 29000,
    fyKsi: 36,
    method: "ASD",
  };

  var steelSelect = document.getElementById("shearSteelGrade");
  var fyOut = document.getElementById("shearFy");
  var EIn = document.getElementById("shearE");
  var dlIn = document.getElementById("shearDL");
  var llIn = document.getElementById("shearLL");
  var lenIn = document.getElementById("shearBeamLength");
  var methodSel = document.getElementById("shearMethod");

  var govLabel = document.getElementById("shearGovWLabel");
  var govVal = document.getElementById("shearGovW");

  var comboALabel = document.getElementById("shearComboALabel");
  var comboAVal = document.getElementById("shearComboA");
  var comboBLabel = document.getElementById("shearComboBLabel");
  var comboBVal = document.getElementById("shearComboB");

  var muFormula = document.getElementById("shearMuFormula");
  var muVal = document.getElementById("shearMu");
  var vuFormula = document.getElementById("shearVuFormula");
  var vuVal = document.getElementById("shearVu");
  var shearVuUserEdited = false;

  var lineG38 = document.getElementById("shearLineG38");
  var lineG38Unit = document.getElementById("shearLineG38Unit");
  var lineMa = document.getElementById("shearLineMa");
  var lineMaLbl = document.getElementById("shearLineMaLbl");
  var lineF41 = document.getElementById("shearLineF41");
  var lineG41 = document.getElementById("shearLineG41");
  var sectionNameOut = document.getElementById("shearDesignSectionName");
  var muDemandPrefix = document.getElementById("shearDemandMuPrefix");
  var ixReqOut = document.getElementById("shearDesignIxReq");
  var deflSel = document.getElementById("shearDesignDeflSelect");
  var beamWtSel = document.getElementById("shearDesignBeamWeightSelect");
  var deflDivIn = document.getElementById("shearDesignDeflDivisor");
  var manualMuIn = document.getElementById("shearDesignManualMu");
  var manualVuIn = document.getElementById("shearDesignManualVu");

  var viewButtons = root.querySelectorAll("[data-shear-view]");
  var viewMap = {
    design: document.getElementById("shearViewDesign"),
    analysis: document.getElementById("shearViewAnalysis"),
    capacity: document.getElementById("shearViewCapacity"),
  };

  var orderedLabelsUpper = null;
  var byUpperLabel = null;

  function gradesList() {
    var fromSvc =
      window.SteelGradesService && typeof window.SteelGradesService.getGrades === "function"
        ? window.SteelGradesService.getGrades()
        : null;
    if (fromSvc && fromSvc.length) return fromSvc;
    var fromBorn = window.Born2BeSteel && window.Born2BeSteel.steelGrades;
    if (fromBorn && fromBorn.length) return fromBorn;
    return [];
  }

  function fmt(v, d) {
    var dig = typeof d === "number" ? d : 4;
    return Number(v).toFixed(dig);
  }

  function fmtExcel(v) {
    var n = Number(v);
    if (!Number.isFinite(n)) return "";
    return String(Number(n.toFixed(4)));
  }

  function trimLower(s) {
    return String(s == null ? "" : s)
      .trim()
      .toLowerCase();
  }

  function num(el, fb) {
    if (!el) return fb;
    var n = parseFloat(String(el.value).replace(/,/g, ""));
    return Number.isFinite(n) ? n : fb;
  }

  /**
   * Excel `Shear Capacity no deflection` X-column demand uses `Bending Design` O39/O45 (not Shear O39).
   * Prefer live values from the Bending Design calculator when present.
   */
  function readBendingDesignDemandForShearNoDefl() {
    var muCalc = document.getElementById("bendingDesignMuCalc");
    if (muCalc && muCalc.value != null && String(muCalc.value).trim() !== "" && String(muCalc.value).trim() !== "--") {
      var o39 = parseFloat(String(muCalc.value).replace(/,/g, ""));
      if (Number.isFinite(o39)) return { bendingO39: o39, bendingO45: 0 };
    }
    return {
      bendingO39: WB.EXCEL_BENDING_DESIGN_DEFAULT_O39_KIPFT,
      bendingO45: 0,
    };
  }

  function syncSteelFields() {
    var g = gradesList().find(function (x) {
      return steelSelect && x.astm === steelSelect.value;
    });
    var fyGrade = g && Number.isFinite(Number(g.fy)) ? Number(g.fy) : NaN;
    var fyX10 = Number.isFinite(fyGrade) ? fyGrade : Number(EXCEL_SHEAR_DESIGN_DEFAULTS.fyKsi);
    if (fyOut && Number.isFinite(fyX10) && fyX10 > 0) fyOut.value = fmt(fyX10, 0);
    if (g && window.Born2BeSteel && typeof window.Born2BeSteel.setActiveMaterial === "function") {
      window.Born2BeSteel.setActiveMaterial(g.astm);
    }
  }

  function initSteelOptions() {
    if (!steelSelect) return;
    var grades = gradesList();
    steelSelect.innerHTML = "";
    grades.forEach(function (g) {
      var o = document.createElement("option");
      o.value = g.astm;
      o.textContent = g.astm;
      steelSelect.appendChild(o);
    });
    var match = grades.find(function (g) {
      return g.astm === EXCEL_SHEAR_DESIGN_DEFAULTS.steelGrade;
    });
    steelSelect.value = match ? match.astm : grades[0] ? grades[0].astm : "";
    syncSteelFields();
  }

  function loadCatalog(cb) {
    if (orderedLabelsUpper && byUpperLabel) {
      cb();
      return;
    }
    fetch("data/shear-design-order.json")
      .then(function (r) {
        return r.ok ? r.json() : Promise.reject(new Error("shear-design-order.json"));
      })
      .then(function (order) {
        return fetch("data/aisc-sections.json").then(function (r2) {
          return r2.ok ? r2.json() : Promise.reject(new Error("aisc-sections.json"));
        }).then(function (aisc) {
          var labels = (order.labels || []).map(function (L) {
            return String(L).toUpperCase();
          });
          orderedLabelsUpper = labels;
          byUpperLabel = {};
          (aisc.sections || []).forEach(function (s) {
            if (s.type !== "W") return;
            byUpperLabel[String(s.aiscManualLabel).toUpperCase()] = s;
          });
        });
      })
      .then(function () {
        cb();
      })
      .catch(function () {
        orderedLabelsUpper = [];
        byUpperLabel = {};
        cb();
      });
  }

  function updateComboLabels(method) {
    if (comboALabel) {
      comboALabel.textContent = method === "LRFD" ? "1.2DL+1.6LL" : "DL+LL";
    }
    if (comboBLabel) {
      /* ASD: Shear Design sheet S28 — dash header over blank/dash value column */
      comboBLabel.textContent = method === "LRFD" ? "1.4DL" : "-";
    }
    if (govLabel) {
      govLabel.textContent =
        method === "LRFD" ? "GOVERNING Wu :" : "ALLOWABLE Wa =";
    }
    if (lineG38Unit) {
      lineG38Unit.textContent = "lb/ft";
    }
    if (lineF41) {
      lineF41.innerHTML =
        method === "LRFD" ? "<em>V</em><sub>u</sub>=" : "<em>V</em><sub>a</sub>=";
    }
    if (muDemandPrefix) {
      muDemandPrefix.innerHTML =
        method === "LRFD" ? "M<sub>u</sub>" : "M<sub>a</sub>";
    }
    if (muFormula) {
      muFormula.innerHTML = "<em>w</em>L<sup>2</sup>/8";
    }
    if (vuFormula) {
      vuFormula.innerHTML = "<em>w</em>L/2";
    }
    var methodTag = document.getElementById("shearDesignMethodTag");
    if (methodTag) {
      methodTag.textContent = "(" + method + " METHOD)";
    }
    var muCardTitle = document.getElementById("shearMuCardTitle");
    if (muCardTitle) {
      muCardTitle.textContent =
        method === "LRFD" ? "Mu (Factored Moment):" : "Ma (Factored Moment):";
    }
    if (lineMaLbl) {
      /* Lightest safe section: ASD must show M_u (not M_a), per workbook display on this row. */
      lineMaLbl.innerHTML = "<em>M</em><sub>u</sub>=";
    }
  }

  function recompute() {
    if (!orderedLabelsUpper || !byUpperLabel) return;
    var method = methodSel && methodSel.value === "ASD" ? "ASD" : "LRFD";
    updateComboLabels(method);

    var dl = num(dlIn, EXCEL_SHEAR_DESIGN_DEFAULTS.dl);
    var ll = num(llIn, EXCEL_SHEAR_DESIGN_DEFAULTS.ll);
    var Lft = num(lenIn, EXCEL_SHEAR_DESIGN_DEFAULTS.Lft);
    var E = num(EIn, 29000);
    var Fy = num(fyOut, NaN);
    if (!Number.isFinite(Fy) || Fy <= 0) {
      Fy = Number(EXCEL_SHEAR_DESIGN_DEFAULTS.fyKsi);
    }
    if (!Number.isFinite(Fy) || Fy <= 0) Fy = 36;

    var loads = WB.governingUniformLoad(method, dl, ll);
    var autoVu = WB.shearDemand_kips(loads.O26, Lft);
    if (vuVal && !shearVuUserEdited) {
      vuVal.value = Number.isFinite(autoVu) ? fmtExcel(autoVu) : "";
    }
    var g55Input = num(manualVuIn, 0);
    if (vuVal && shearVuUserEdited) {
      g55Input = num(vuVal, g55Input);
      if (manualVuIn) manualVuIn.value = Number.isFinite(g55Input) ? fmtExcel(g55Input) : "0";
    }
    if (comboAVal) comboAVal.value = fmtExcel(loads.V30);
    if (comboBVal) {
      if (method === "LRFD") {
        comboBVal.value = Number.isFinite(loads.AA30) ? fmtExcel(loads.AA30) : "";
      } else {
        comboBVal.value = "-";
      }
    }
    if (govVal) govVal.value = fmtExcel(loads.O26);

    var bendDem = readBendingDesignDemandForShearNoDefl();
    var out = WB.computeShearDesign({
      method: method,
      dl: dl,
      ll: ll,
      Lft: Lft,
      E: E,
      Fy: Fy,
      orderedLabels: orderedLabelsUpper,
      byUpperLabel: byUpperLabel,
      deflectionMode: deflSel ? deflSel.value : "without considering deflection",
      beamWeightMode: beamWtSel ? beamWtSel.value : "consider beam weight",
      deflDivisor: num(deflDivIn, 360),
      manualMu: num(manualMuIn, 0),
      G55: g55Input,
      bendingO39: bendDem.bendingO39,
      bendingO45: bendDem.bendingO45,
    });

    if (muVal) muVal.value = fmtExcel(out.Mu_kipft);
    if (vuVal && !shearVuUserEdited) vuVal.value = fmtExcel(out.Vu_kips);
    if (ixReqOut) {
      ixReqOut.value = Number.isFinite(out.Y31_ixRequired_in4)
        ? fmtExcel(out.Y31_ixRequired_in4)
        : "—";
    }
    syncShearCapDeflButtons();

    if (out.lightest) {
      if (lineG38) lineG38.value = fmtExcel(out.lightest.weightPlf);
      if (lineMa) {
        /*
         * Excel `Shear Design!Z47` uses MINIFS over SAFE/YES rows
         * on the active capacity sheet (not the selected lightest row's W/U directly).
         */
        var mDesign = NaN;
        var ctx = {
          method: method,
          E: E,
          Fy: Fy,
          O39: out.Mu_kipft,
          O45: 0,
          bendingO39: bendDem.bendingO39,
          bendingO45: bendDem.bendingO45,
          O46: num(manualMuIn, 0),
          Y31: out.Y31_ixRequired_in4,
          G51: out.Vu_kips,
          G55: num(manualVuIn, 0),
          dl: dl,
          ll: ll,
          Lft: Lft,
          considerBeamWeight:
            trimLower(beamWtSel ? beamWtSel.value : "consider beam weight") ===
            "consider beam weight",
          consideringDeflection:
            trimLower(deflSel ? deflSel.value : "without considering deflection") ===
            "considering deflection",
        };
        var minSafe = Infinity;
        orderedLabelsUpper.forEach(function (lab) {
          var sec = byUpperLabel[lab];
          if (!sec) return;
          var row = ctx.consideringDeflection
            ? WB.evaluateShearCapacityWDeflectionDesignRow(sec, ctx)
            : WB.evaluateShearCapacityNoDeflectionDesignRow(sec, ctx);
          if (!row || !row.aeYes) return;
          var v = ctx.consideringDeflection ? Number(row.U) : Number(row.W);
          if (Number.isFinite(v) && v < minSafe) minSafe = v;
        });
        if (Number.isFinite(minSafe)) mDesign = minSafe;
        else mDesign = out.lightest.flexuralDesign_kipft;
        lineMa.value = Number.isFinite(Number(mDesign)) ? fmtExcel(mDesign) : "";
      }
      if (lineG41) lineG41.value = fmtExcel(out.lightest.phiVnOrAllow);
      if (sectionNameOut) sectionNameOut.textContent = out.lightest.label;
    } else {
      if (lineG38) lineG38.value = "";
      if (lineMa) lineMa.value = "";
      if (lineG41) lineG41.value = "";
      if (sectionNameOut) sectionNameOut.textContent = "—";
    }
  }

  function setShearView(name) {
    Object.keys(viewMap).forEach(function (k) {
      var el = viewMap[k];
      if (!el) return;
      var on = k === name;
      el.classList.toggle("is-active", on);
      el.setAttribute("aria-hidden", on ? "false" : "true");
    });
    viewButtons.forEach(function (btn) {
      var v = btn.getAttribute("data-shear-view");
      var on = v === name && (v === "design" || v === "analysis");
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });
    if (name === "analysis" && typeof window.refreshShearAnalysis === "function") {
      window.refreshShearAnalysis();
    }
    if (name === "capacity" && typeof window.refreshShearCapacityDemand === "function") {
      window.refreshShearCapacityDemand();
    }
  }

  viewButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      setShearView(btn.getAttribute("data-shear-view"));
    });
  });

  var shearDesignForm = document.getElementById("formShearDesign");
  if (shearDesignForm) {
    shearDesignForm.addEventListener("submit", function (e) {
      e.preventDefault();
    });
  }

  var capWithoutBtn = document.getElementById("shearDesignCapWithoutDeflBtn");
  var capWithBtn = document.getElementById("shearDesignCapConsideringDeflBtn");

  function syncShearCapDeflButtons() {
    if (!deflSel || !capWithoutBtn || !capWithBtn) return;
    var considering = trimLower(deflSel.value) === "considering deflection";
    capWithBtn.classList.toggle("is-selected", considering);
    capWithBtn.setAttribute("aria-pressed", considering ? "true" : "false");
    capWithoutBtn.classList.toggle("is-selected", !considering);
    capWithoutBtn.setAttribute("aria-pressed", considering ? "false" : "true");
  }
  if (capWithoutBtn) {
    capWithoutBtn.addEventListener("click", function () {
      if (deflSel) deflSel.value = "without considering deflection";
      syncShearCapDeflButtons();
      recompute();
      var capView = document.getElementById("shearViewCapacity");
      if (capView) capView.setAttribute("data-shear-cap-mode", "noDefl");
      setShearView("capacity");
    });
  }
  if (capWithBtn) {
    capWithBtn.addEventListener("click", function () {
      if (deflSel) deflSel.value = "considering deflection";
      syncShearCapDeflButtons();
      recompute();
      var capView = document.getElementById("shearViewCapacity");
      if (capView) capView.setAttribute("data-shear-cap-mode", "defl");
      setShearView("capacity");
    });
  }

  // Delegated fallback so buttons still work even if DOM/CSS overlays intercept direct handlers.
  root.addEventListener("click", function (e) {
    var btn = e.target && e.target.closest
      ? e.target.closest("#shearDesignCapWithoutDeflBtn, #shearDesignCapConsideringDeflBtn")
      : null;
    if (!btn) return;
    if (btn.id === "shearDesignCapWithoutDeflBtn") {
      if (deflSel) deflSel.value = "without considering deflection";
      syncShearCapDeflButtons();
      recompute();
      var capViewA = document.getElementById("shearViewCapacity");
      if (capViewA) capViewA.setAttribute("data-shear-cap-mode", "noDefl");
      setShearView("capacity");
      return;
    }
    if (deflSel) deflSel.value = "considering deflection";
    syncShearCapDeflButtons();
    recompute();
    var capViewB = document.getElementById("shearViewCapacity");
    if (capViewB) capViewB.setAttribute("data-shear-cap-mode", "defl");
    setShearView("capacity");
  });

  root.querySelectorAll("[data-shear-view-switch]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      setShearView(btn.getAttribute("data-shear-view-switch") || "design");
    });
  });

  function wireInputs() {
    [
      steelSelect,
      EIn,
      dlIn,
      llIn,
      lenIn,
      methodSel,
      deflSel,
      beamWtSel,
      deflDivIn,
      manualMuIn,
      manualVuIn,
      document.getElementById("shearDesignManualIx"),
    ].forEach(function (el) {
      if (!el) return;
      el.addEventListener("input", function () {
        syncSteelFields();
        recompute();
      });
      el.addEventListener("change", function () {
        syncSteelFields();
        recompute();
      });
    });
    if (vuVal) {
      vuVal.addEventListener("input", function () {
        shearVuUserEdited = true;
        recompute();
      });
      vuVal.addEventListener("change", function () {
        shearVuUserEdited = true;
        recompute();
      });
    }
  }

  function applyExcelDefaults() {
    if (dlIn) dlIn.value = String(EXCEL_SHEAR_DESIGN_DEFAULTS.dl);
    if (llIn) llIn.value = String(EXCEL_SHEAR_DESIGN_DEFAULTS.ll);
    if (lenIn) lenIn.value = String(EXCEL_SHEAR_DESIGN_DEFAULTS.Lft);
    if (EIn) EIn.value = String(EXCEL_SHEAR_DESIGN_DEFAULTS.E);
    if (methodSel) methodSel.value = EXCEL_SHEAR_DESIGN_DEFAULTS.method;
    initSteelOptions();
  }

  function bootstrap() {
    wireInputs();
    applyExcelDefaults();
    loadCatalog(function () {
      recompute();
    });
  }

  if (window.SteelGradesService && typeof window.SteelGradesService.ensureLoaded === "function") {
    window.SteelGradesService.ensureLoaded().then(bootstrap).catch(bootstrap);
  } else {
    bootstrap();
  }

  if (window.SteelGradesService && typeof window.SteelGradesService.onUpdate === "function") {
    window.SteelGradesService.onUpdate(function () {
      initSteelOptions();
      recompute();
    });
  }
})();
