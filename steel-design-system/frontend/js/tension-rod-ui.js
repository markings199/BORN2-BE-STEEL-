(function () {
  "use strict";

  var section = document.getElementById("tensionRodSection");
  if (!section) return;

  var API = window.SteelAPI;

  /**
   * Workbook-aligned labels with HTML subscripts (Born2BeSteel `Tension Rod`).
   * Plain-text variants stay on the API response for consumers; UI uses these only.
   */
  var SHEET_LABELS = {
    LRFD: {
      demandLineHtml:
        '<span class="tr-demand-arrow" aria-hidden="true">\u2192</span> (LRFD METHOD) GOVERNING T<sub>u</sub> =',
      eq1Html: "1.2D<sub>L</sub> + 1.6L<sub>L</sub>",
      eq2Html: "T<sub>u</sub> = 1.4D<sub>L</sub>",
      strengthFormulaHtml:
        "T<sub>u</sub> = (0.75)(0.75)(F<sub>u</sub>)(A<sub>b</sub>)",
    },
    ASD: {
      demandLineHtml:
        '<span class="tr-demand-arrow" aria-hidden="true">\u2192</span> (ASD METHOD) ALLOWABLE T<sub>a</sub> =',
      eq1Html: "D<sub>L</sub> + L<sub>L</sub>",
      eq2Html: "T<sub>a</sub> =",
      strengthFormulaHtml: "T<sub>a</sub> = (0.75)(F<sub>u</sub>)(A<sub>b</sub>) / 2",
    },
  };

  function byId(id) {
    return document.getElementById(id);
  }

  var gradeSel = byId("tensionRodSteelGrade");
  var fyEl = byId("tensionRodFy");
  var fuEl = byId("tensionRodFu");
  var eEl = byId("tensionRodE");
  var dlEl = byId("tensionRodDL");
  var llEl = byId("tensionRodLL");
  var methodSel = byId("tensionRodDesignMethod");

  var demandLineEl = byId("tensionRodDemandLine");
  var eq1Label = byId("tensionRodEq1Label");
  var eq2Label = byId("tensionRodEq2Label");
  var tuEq1Out = byId("tensionRodTuEq1");
  var tuEq2Out = byId("tensionRodTuEq2");
  var tuGovOut = byId("tensionRodTuGov");

  var reqFormula1 = byId("tensionRodReqFormula1");
  var reqAbOut = byId("tensionRodRequiredAb");
  var dOut = byId("tensionRodSafeSection");

  var state = {
    method: "LRFD",
    grades: null,
  };

  /** `Tension Rod` sheet defaults (Born2BeSteel Final (2).xlsx). */
  var EXCEL_TENSION_ROD_DEFAULTS = {
    method: "LRFD", // N11
    grade: "A53 Gr. B", // O5
    fy: 35, // I12
    fu: 60, // I14
    deadLoadKips: 4, // I22
    liveLoadKips: 6, // I25
    modulusEKsi: 29000, // J31
  };

  var syncTimer = null;
  var syncGen = 0;

  function num(raw) {
    var n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  function fmt(n, digits) {
    if (!Number.isFinite(n)) return "--";
    var d = typeof digits === "number" ? digits : 4;
    return Number(n.toFixed(d)).toFixed(d);
  }

  function fmtCompact(n, digits) {
    if (!Number.isFinite(n)) return "--";
    var d = typeof digits === "number" ? digits : 1;
    return Number(n.toFixed(d)).toString();
  }

  function setInvalid(el, invalid, title) {
    if (!el) return;
    el.classList.toggle("is-invalid", !!invalid);
    if (invalid && title) el.setAttribute("title", title);
    else el.removeAttribute("title");
  }

  function setText(el, text) {
    if (!el) return;
    el.textContent = text == null ? "" : String(text);
  }

  function applyFormulaLabels(methodKey) {
    var key = methodKey === "ASD" ? "ASD" : "LRFD";
    var L = SHEET_LABELS[key];
    if (demandLineEl) demandLineEl.innerHTML = L.demandLineHtml;
    if (eq1Label) eq1Label.innerHTML = L.eq1Html;
    if (eq2Label) eq2Label.innerHTML = L.eq2Html;
    if (reqFormula1) reqFormula1.innerHTML = L.strengthFormulaHtml;
  }

  function getGradeList() {
    if (API && typeof API.listSteelGrades === "function") {
      return API.listSteelGrades()
        .then(function (res) {
          var list = res && Array.isArray(res.grades) ? res.grades : [];
          return list
            .map(function (g) {
              return { astm: String(g.astm || "").trim(), fy: Number(g.fy), fu: Number(g.fu) };
            })
            .filter(function (g) {
              return g.astm && Number.isFinite(g.fy) && Number.isFinite(g.fu);
            });
        })
        .catch(function () {
          return null;
        });
    }
    return Promise.resolve(null);
  }

  function getFallbackGrades() {
    var list = window.Born2BeSteel && window.Born2BeSteel.steelGrades ? window.Born2BeSteel.steelGrades : [];
    var out = (list || [])
      .map(function (g) {
        return { astm: String(g.astm || "").trim(), fy: Number(g.fy), fu: Number(g.fu) };
      })
      .filter(function (g) {
        return g.astm && Number.isFinite(g.fy) && Number.isFinite(g.fu);
      });
    var hasDefault = out.some(function (g) {
      return g.astm === EXCEL_TENSION_ROD_DEFAULTS.grade;
    });
    if (!hasDefault) {
      out.push({
        astm: EXCEL_TENSION_ROD_DEFAULTS.grade,
        fy: EXCEL_TENSION_ROD_DEFAULTS.fy,
        fu: EXCEL_TENSION_ROD_DEFAULTS.fu,
      });
    }
    return out;
  }

  function setMethod(next) {
    next = String(next || "").trim().toUpperCase();
    if (next !== "LRFD" && next !== "ASD") next = "LRFD";
    state.method = next;

    if (methodSel) methodSel.value = next;

    applyFormulaLabels(next);
    recompute();
  }

  function setGrade(astm) {
    if (!state.grades || !state.grades.length) return;
    var key = String(astm || "").trim();
    var g = state.grades.find(function (x) {
      return String(x.astm || "").trim() === key;
    });
    if (!g) g = state.grades[0];

    if (gradeSel) gradeSel.value = g.astm;
    if (fyEl) fyEl.value = fmtCompact(g.fy, 0);
    if (fuEl) fuEl.value = fmtCompact(g.fu, 0);
    recompute();
  }

  /** Same numeric path as backend `tensionRodDesignSheet` (fallback / instant paint). */
  function computeLocal(method, dl, ll, fu) {
    var combo1 = method === "LRFD" ? 1.2 * dl + 1.6 * ll : dl + ll;
    var combo2 = method === "LRFD" ? 1.4 * dl : null;
    var gov = method === "LRFD" ? Math.max(combo1, combo2 || 0) : combo1;
    var ab = fu > 0 ? gov / (0.75 * 0.75 * fu) : NaN;
    var d = ab > 0 ? Math.sqrt(ab / (Math.PI / 4)) : NaN;
    return {
      combo1Kips: combo1,
      combo2Kips: combo2,
      governingKips: gov,
      requiredAbIn2: ab,
      diameterIn: d,
    };
  }

  function applyNumbers(r) {
    setText(tuEq1Out, fmt(r.combo1Kips, 1));
    setText(
      tuEq2Out,
      r.combo2Kips == null || !Number.isFinite(r.combo2Kips) ? "--" : fmt(r.combo2Kips, 1)
    );
    setText(tuGovOut, fmt(r.governingKips, 1));
    setText(reqAbOut, Number.isFinite(r.requiredAbIn2) ? fmt(r.requiredAbIn2, 4) : "--");
    if (dOut) {
      dOut.value = Number.isFinite(r.diameterIn) ? fmt(r.diameterIn, 4) : "";
    }

    applyFormulaLabels(state.method);

    var result = byId("resultTensionRod");
    if (result) result.textContent = "";
  }

  function recompute() {
    var dl = num(dlEl ? dlEl.value : null);
    var ll = num(llEl ? llEl.value : null);
    var fu = num(fuEl ? fuEl.value : null);
    var eKsi = num(eEl ? eEl.value : null);

    var dlSafe = dl == null ? 0 : dl;
    var llSafe = ll == null ? 0 : ll;

    setInvalid(dlEl, dl != null && dl < 0, "Dead load must be ≥ 0.");
    setInvalid(llEl, ll != null && ll < 0, "Live load must be ≥ 0.");
    setInvalid(fuEl, !(fu != null && fu > 0), "Fu must be positive (set by steel grade).");
    setInvalid(eEl, eKsi != null && eKsi <= 0, "E must be greater than zero when entered.");

    var methodKey = state.method;
    var local =
      fu != null && fu > 0
        ? computeLocal(methodKey, dlSafe, llSafe, fu)
        : {
            combo1Kips: NaN,
            combo2Kips: methodKey === "ASD" ? null : NaN,
            governingKips: NaN,
            requiredAbIn2: NaN,
            diameterIn: NaN,
          };

    applyNumbers(local);
    scheduleServerSync(dlSafe, llSafe, fu, eKsi);
  }

  function scheduleServerSync(dlSafe, llSafe, fu, eKsi) {
    syncGen += 1;
    var gen = syncGen;
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(function () {
      runServerSync(gen, dlSafe, llSafe, fu, eKsi);
    }, 100);
  }

  function runServerSync(gen, dlSafe, llSafe, fu, eKsi) {
    if (gen !== syncGen) return;
    if (!API || typeof API.tensionRodDesign !== "function" || fu == null || !(fu > 0)) return;

    var payload = {
      method: state.method,
      deadLoadKips: dlSafe,
      liveLoadKips: llSafe,
      Fu: fu,
    };
    if (eKsi != null && eKsi > 0) payload.modulusEKsi = eKsi;

    API.tensionRodDesign(payload)
      .then(function (data) {
        if (gen !== syncGen || !data || !data.result) return;
        applyNumbers(data.result);
      })
      .catch(function () {
        /* Local compute already applied */
      });
  }

  function bind() {
    if (!section.__tensionRodBound) section.__tensionRodBound = true;

    var form = byId("formTensionRod");
    if (form && !form.__trSubmitBlocked) {
      form.__trSubmitBlocked = true;
      form.addEventListener("submit", function (e) {
        if (e && typeof e.preventDefault === "function") e.preventDefault();
        recompute();
      });
    }

    if (methodSel) {
      methodSel.addEventListener("change", function () {
        setMethod(methodSel.value);
      });
    }

    if (dlEl) dlEl.addEventListener("input", recompute);
    if (llEl) llEl.addEventListener("input", recompute);
    if (eEl) eEl.addEventListener("input", recompute);

    if (gradeSel) {
      gradeSel.addEventListener("change", function () {
        setGrade(gradeSel.value);
      });
    }
  }

  function init() {
    bind();
    getGradeList().then(function (list) {
      if (!list || !list.length) list = getFallbackGrades();
      state.grades = list && list.length ? list : [];
      if (state.grades && state.grades.length) {
        var hasDefault = state.grades.some(function (g) {
          return String(g.astm || "").trim() === EXCEL_TENSION_ROD_DEFAULTS.grade;
        });
        if (!hasDefault) {
          state.grades.push({
            astm: EXCEL_TENSION_ROD_DEFAULTS.grade,
            fy: EXCEL_TENSION_ROD_DEFAULTS.fy,
            fu: EXCEL_TENSION_ROD_DEFAULTS.fu,
          });
        }
      }
      if (gradeSel) {
        gradeSel.innerHTML = "";
        state.grades.forEach(function (g) {
          var opt = document.createElement("option");
          opt.value = g.astm;
          opt.textContent = g.astm;
          gradeSel.appendChild(opt);
        });
      }
      if (dlEl) dlEl.value = String(EXCEL_TENSION_ROD_DEFAULTS.deadLoadKips);
      if (llEl) llEl.value = String(EXCEL_TENSION_ROD_DEFAULTS.liveLoadKips);
      if (eEl) eEl.value = String(EXCEL_TENSION_ROD_DEFAULTS.modulusEKsi);
      setMethod(EXCEL_TENSION_ROD_DEFAULTS.method);
      setGrade(EXCEL_TENSION_ROD_DEFAULTS.grade);
      recompute();
    });
  }

  init();
})();
