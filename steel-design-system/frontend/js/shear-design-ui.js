/**
 * Shear module — `SHEAR DESIGN` Design Calculator UI (Born2BeSteel workbook).
 */
(function () {
  "use strict";

  var root = document.getElementById("shearSection");
  if (!root) return;

  var WB = window.ShearDesignWorkbook;
  if (!WB) return;

  /** `SHEAR DESIGN` snapshot defaults (Born2BeSteel Final (2) (1).xlsx). */
  var EXCEL_SHEAR_DESIGN_DEFAULTS = {
    steelGrade: "A572 Gr. 50",
    dl: 8,
    ll: 12,
    Lft: 5,
    E: 29000,
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

  var lineF38 = document.getElementById("shearLineF38");
  var lineG38 = document.getElementById("shearLineG38");
  var lineG38Unit = document.getElementById("shearLineG38Unit");
  var lineF41 = document.getElementById("shearLineF41");
  var lineG41 = document.getElementById("shearLineG41");
  var sectionNameOut = document.getElementById("shearDesignSectionName");
  var muDemandPrefix = document.getElementById("shearDemandMuPrefix");
  var vuDemandPrefix = document.getElementById("shearDemandVuPrefix");

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

  function num(el, fb) {
    if (!el) return fb;
    var n = parseFloat(String(el.value).replace(/,/g, ""));
    return Number.isFinite(n) ? n : fb;
  }

  function currentGradeFy() {
    var grades = gradesList();
    if (!grades.length) return NaN;
    var key = steelSelect ? steelSelect.value : "";
    var g = grades.find(function (x) {
      return x.astm === key;
    });
    return g && Number.isFinite(Number(g.fy)) ? Number(g.fy) : NaN;
  }

  function syncSteelFields() {
    var fy = currentGradeFy();
    if (fyOut && Number.isFinite(fy)) fyOut.value = fmt(fy, 0);
    var g = gradesList().find(function (x) {
      return steelSelect && x.astm === steelSelect.value;
    });
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
      comboBLabel.textContent = method === "LRFD" ? "1.4DL" : "Wa =";
    }
    if (govLabel) {
      govLabel.textContent =
        method === "LRFD" ? "GOVERNING Wu :" : "ALLOWABLE Wa :";
    }
    if (lineF38) {
      lineF38.textContent = method === "LRFD" ? "Wu =" : "Wa =";
    }
    if (lineG38Unit) {
      lineG38Unit.textContent = "kips/ft";
    }
    if (lineF41) {
      lineF41.textContent = method === "LRFD" ? "Vu =" : "Va =";
    }
    if (muDemandPrefix) {
      muDemandPrefix.textContent = method === "LRFD" ? "Mu =" : "Ma =";
    }
    if (vuDemandPrefix) {
      vuDemandPrefix.textContent = method === "LRFD" ? "Vu =" : "Va =";
    }
    if (muFormula) {
      muFormula.textContent = "WL²/8";
    }
    if (vuFormula) {
      vuFormula.textContent = "WL/2";
    }
  }

  function recompute() {
    if (!orderedLabelsUpper || !byUpperLabel) return;
    var method = methodSel && methodSel.value === "ASD" ? "ASD" : "LRFD";
    updateComboLabels(method);

    var dl = num(dlIn, 0);
    var ll = num(llIn, 0);
    var Lft = num(lenIn, 0);
    var E = num(EIn, 29000);
    var Fy = currentGradeFy();
    if (!Number.isFinite(Fy) || Fy <= 0) Fy = 50;

    var loads = WB.governingUniformLoad(method, dl, ll);
    if (comboAVal) comboAVal.value = fmtExcel(loads.V30);
    if (comboBVal) {
      if (method === "LRFD") {
        comboBVal.value = Number.isFinite(loads.AA30) ? fmtExcel(loads.AA30) : "";
      } else {
        comboBVal.value = "-";
      }
    }
    if (govVal) govVal.value = fmtExcel(loads.O26);

    var out = WB.computeShearDesign({
      method: method,
      dl: dl,
      ll: ll,
      Lft: Lft,
      E: E,
      Fy: Fy,
      orderedLabels: orderedLabelsUpper,
      byUpperLabel: byUpperLabel,
    });

    if (muVal) muVal.value = fmtExcel(out.Mu_kipft);
    if (vuVal) vuVal.value = fmtExcel(out.Vu_kips);

    if (out.lightest) {
      if (lineG38) lineG38.value = fmtExcel(out.lightest.weightPlf);
      if (lineG41) lineG41.value = fmtExcel(out.lightest.phiVnOrAllow);
      if (sectionNameOut) sectionNameOut.value = out.lightest.label;
    } else {
      if (lineG38) lineG38.value = "";
      if (lineG41) lineG41.value = "";
      if (sectionNameOut) sectionNameOut.value = "—";
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
      var on = btn.getAttribute("data-shear-view") === name;
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
