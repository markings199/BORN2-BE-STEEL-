(function () {
  "use strict";

  var section = document.getElementById("tensionRodSection");
  if (!section) return;

  var API = window.SteelAPI;

  function byId(id) {
    return document.getElementById(id);
  }

  var gradeSel = byId("tensionRodSteelGrade");
  var fyEl = byId("tensionRodFy");
  var fuEl = byId("tensionRodFu");
  var eEl = byId("tensionRodE");
  var dlEl = byId("tensionRodDL");
  var llEl = byId("tensionRodLL");
  var methodBig = byId("tensionRodMethodBig");

  var govLabel = byId("tensionRodGovLabel");
  var eq1Label = byId("tensionRodEq1Label");
  var eq2Label = byId("tensionRodEq2Label");
  var tuEq1Out = byId("tensionRodTuEq1");
  var tuEq2Out = byId("tensionRodTuEq2");
  var tuGovOut = byId("tensionRodTuGov");

  var reqFormula1 = byId("tensionRodReqFormula1");
  var reqAbOut = byId("tensionRodRequiredAb");
  var dOut = byId("tensionRodSafeSection");
  var methodTag = byId("tensionRodMethodTag");

  var state = {
    method: "LRFD",
    grades: null,
  };

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
    return (list || [])
      .map(function (g) {
        return { astm: String(g.astm || "").trim(), fy: Number(g.fy), fu: Number(g.fu) };
      })
      .filter(function (g) {
        return g.astm && Number.isFinite(g.fy) && Number.isFinite(g.fu);
      });
  }

  function setMethod(next) {
    next = String(next || "").trim().toUpperCase();
    if (next !== "LRFD" && next !== "ASD") next = "LRFD";
    state.method = next;

    setText(methodBig, next);

    var methodBtns = section.querySelectorAll("[data-tr-method]");
    Array.prototype.forEach.call(methodBtns, function (btn) {
      var active = String(btn.getAttribute("data-tr-method") || "").toUpperCase() === next;
      btn.classList.toggle("is-primary", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });

    /* Excel `Tension Rod`: N22, N23, N29, R29, X13 */
    if (govLabel) govLabel.textContent = next === "LRFD" ? "GOVERNING Tu =" : "ALLOWABLE Ta =";
    if (methodTag) methodTag.textContent = next === "LRFD" ? "(LRFD METHOD)" : "(ASD METHOD)";
    if (eq1Label) eq1Label.textContent = next === "LRFD" ? "1.2DL+1.6LL" : "DL+LL";
    if (eq2Label) eq2Label.textContent = next === "LRFD" ? "Tu =1.4DL" : "Ta =";
    if (reqFormula1) {
      reqFormula1.textContent =
        next === "LRFD" ? "Tu =(0.75)(0.75)(Fu)(Ab)" : "Ta=(0.75)(Fu)(Ab)/2";
    }

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

    /* Excel N31, R31, O25 — demand */
    var eq1 =
      state.method === "LRFD" ? 1.2 * dlSafe + 1.6 * llSafe : dlSafe + llSafe;
    var eq2 = state.method === "LRFD" ? 1.4 * dlSafe : null;
    var gov = state.method === "LRFD" ? Math.max(eq1, eq2 || 0) : eq1;

    setText(tuEq1Out, fmt(eq1, 1));
    setText(tuEq2Out, state.method === "LRFD" ? fmt(eq2, 1) : "--");
    setText(tuGovOut, fmt(gov, 1));

    /*
     * Excel Y23 = O25/(0.75*0.75*I14) — workbook uses this factor block for both LRFD and ASD.
     * X13 text differs for ASD but Y23 does not branch on N11.
     */
    var ab = fu != null && fu > 0 ? gov / (0.75 * 0.75 * fu) : null;
    var d = ab != null && ab > 0 ? Math.sqrt(ab / (Math.PI / 4)) : null;

    setText(reqAbOut, fmt(ab, 4));
    setText(dOut, d == null ? "--" : fmt(d, 4));

    var result = byId("resultTensionRod");
    if (result) result.textContent = "";
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

    section.querySelectorAll("[data-tr-method]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setMethod(btn.getAttribute("data-tr-method"));
      });
    });

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
      if (gradeSel) {
        gradeSel.innerHTML = "";
        state.grades.forEach(function (g) {
          var opt = document.createElement("option");
          opt.value = g.astm;
          opt.textContent = g.astm;
          gradeSel.appendChild(opt);
        });
      }
      /* Excel O5 default grade */
      var preferred = state.grades.find(function (g) {
        return String(g.astm).trim() === "A53 Gr. B";
      });
      setMethod("LRFD");
      setGrade(preferred ? preferred.astm : state.grades[0] ? state.grades[0].astm : "");
      recompute();
    });
  }

  init();
})();
