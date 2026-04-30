(function () {
  "use strict";

  var root = document.getElementById("bendingSection");
  if (!root) return;

  function byId(id) {
    return document.getElementById(id);
  }

  var gradeSel = byId("bendingDesignGrade");
  var fyEl = byId("bendingDesignFy");
  var eEl = byId("bendingDesignE");
  var dlEl = byId("bendingDesignDL");
  var llEl = byId("bendingDesignLL");
  var spanEl = byId("bendingDesignSpan");
  var methodChip = byId("bendingDesignMethodChip");
  var manualMuEl = byId("bendingDesignManualMu");
  var manualIxEl = byId("bendingDesignManualIx");
  var deflDivisorEl = byId("bendingDesignDeflDivisor");

  var btnWithoutDefl = byId("bendingDesignBtnWithoutDefl");
  var btnConsiderDefl = byId("bendingDesignBtnConsiderDefl");
  var btnConsiderWeight = byId("bendingDesignBtnConsiderWeight");
  var btnIgnoreWeight = byId("bendingDesignBtnIgnoreWeight");

  var capWithoutDefl = byId("bendingDesignCapWithoutDefl");
  var capConsiderDefl = byId("bendingDesignCapConsiderDefl");

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
  var safeIx = byId("bendingDesignSafeIx");
  var safeRemark = byId("bendingDesignSafeRemark");
  var methodTag = byId("bendingDesignMethodTag");
  var phiMnLbl = byId("bendingDesignPhiMnLbl");
  var resultBendingDesign = byId("resultBendingDesign");

  var state = {
    method: "LRFD",
    deflectionMode: "without considering deflection",
    beamWeightMode: "consider beam weight",
    grades: [],
    catalog: [],
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

  function lfSection(sec) {
    return sec.bf / (2 * sec.tf);
  }

  function lwSection(sec) {
    return (sec.d - 2 * sec.tf) / sec.tw;
  }

  function mnNominalKipFt(sec, fy, E) {
    var Mp_ft = (fy * sec.Zx) / 12;
    var lf = lfSection(sec);
    var lw = lwSection(sec);
    var Kc = 4 / Math.sqrt(lw);
    var lp = 0.38 * Math.sqrt(E / fy);
    var lr = 1 * Math.sqrt(E / fy);

    var cls =
      lf < lp ? "COMPACT" : lf < lr ? "NON-COMPACT" : "SLENDER";

    if (cls === "COMPACT") return Mp_ft;

    if (cls === "NON-COMPACT") {
      var mnYield_ft = (0.7 * fy * sec.Sx) / 12;
      return Mp_ft - (Mp_ft - mnYield_ft) * ((lf - lp) / (lr - lp));
    }

    var MnSlender_kip_in = (0.9 * E * Kc * sec.Sx) / (lf * lf);
    return MnSlender_kip_in / 12;
  }

  function phiMnKipFt(Mn_ft, method) {
    if (!Number.isFinite(Mn_ft)) return null;
    if (method === "LRFD") return 0.9 * Mn_ft;
    return Mn_ft / 1.67;
  }

  function wuGoverning(method, DL, LL) {
    if (method === "ASD") return DL + LL;
    var n = 1.2 * DL + 1.6 * LL;
    var s = 1.4 * DL;
    return Math.max(n, s);
  }

  function lineLoadWithBeam(method, DL, LL, wSelfPlf, beamWeightNorm) {
    var wKlf = wSelfPlf / 1000;
    if (beamWeightNorm === "ignore beam weight") {
      return method === "ASD"
        ? 0
        : method === "LRFD"
          ? 0
          : null;
    }
    if (method === "ASD") return DL + LL + wKlf;
    if (method === "LRFD") return 1.2 * (DL + wKlf) + 1.6 * LL;
    return null;
  }

  function muDemandFromW(wKlf, L_ft) {
    return (wKlf * L_ft * L_ft) / 8;
  }

  function ixRequiredExcel(LL_klf, L_ft, E_ksi, divisor) {
    var L_in = L_ft * 12;
    var w_kip_per_in = LL_klf / 12;
    return (
      (divisor * 5 * w_kip_per_in * Math.pow(L_in, 4)) / (384 * E_ksi * L_in)
    );
  }

  function parseCatalog(json) {
    var list = json && Array.isArray(json.sections) ? json.sections : [];
    return list
      .filter(function (s) {
        return String(s.type || "").toUpperCase() === "W";
      })
      .map(function (s) {
        return {
          label: String(s.aiscManualLabel || s.designation || "").trim(),
          weightPlf: Number(s.weightPlf),
          Zx: Number(s.Zx),
          Sx: Number(s.Sx),
          Ix: Number(s.Ix),
          bf: Number(s.bf),
          tf: Number(s.tf),
          tw: Number(s.tw),
          d: Number(s.d),
        };
      })
      .filter(function (s) {
        return (
          s.label &&
          [s.weightPlf, s.Zx, s.Sx, s.Ix, s.bf, s.tf, s.tw, s.d].every(
            Number.isFinite
          )
        );
      })
      .sort(function (a, b) {
        return a.weightPlf - b.weightPlf;
      });
  }

  function lightestSafe(sec0) {
    var method = state.method;
    var fy = sec0.fy;
    var E = sec0.E;
    var DL = sec0.DL;
    var LL = sec0.LL;
    var L_ft = sec0.L_ft;
    var wGov = sec0.wGov;
    var O39 = sec0.O39;
    var manualMu = sec0.manualMu;
    var ixReq = sec0.ixReq;
    var manualIx = sec0.manualIx;
    var deflNorm = sec0.deflectionNorm;
    var bwNorm = sec0.beamWeightNorm;

    var activeMuDefl =
      manualMu > 0 ? manualMu : O39;

    var noDeflDemand = function (Sdem) {
      return Math.max(O39, Sdem);
    };

    var ixLimit = manualIx > 0 ? manualIx : ixReq;

    var pick = null;

    for (var i = 0; i < state.catalog.length; i++) {
      var sec = state.catalog[i];
      var Rline = lineLoadWithBeam(method, DL, LL, sec.weightPlf, bwNorm);
      if (Rline == null) continue;
      var Sdem = muDemandFromW(Rline, L_ft);
      var Mn_ft = mnNominalKipFt(sec, fy, E);
      var phiMn = phiMnKipFt(Mn_ft, method);
      if (!Number.isFinite(phiMn)) continue;

      var okMoment = false;
      var okIx = true;

      if (deflNorm === "considering deflection") {
        /*
         * Capacity sheet columns `T` (moment) and `U` (Ix) are evaluated per row.
         * MINIFS on column `U` alone can pick an overly light section that fails `T`;
         * requiring both matches the reference screenshot (e.g. W12×16 vs W10×12).
         */
        okMoment = phiMn > activeMuDefl;
        okIx = sec.Ix > ixLimit;
      } else {
        var demand = noDeflDemand(Sdem);
        okMoment = phiMn > demand;
      }

      if (okMoment && okIx) {
        pick = {
          sec: sec,
          phiMn: phiMn,
          Mn_ft: Mn_ft,
          Sdem: Sdem,
        };
        break;
      }
    }

    return pick;
  }

  function syncMethodUi() {
    var m = state.method;
    if (methodChip) methodChip.textContent = m;
    root.querySelectorAll("[data-bd-method]").forEach(function (btn) {
      var on =
        String(btn.getAttribute("data-bd-method") || "").toUpperCase() === m;
      btn.classList.toggle("is-primary", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
    if (methodTag)
      methodTag.textContent =
        m === "LRFD" ? "(LRFD METHOD)" : "(ASD METHOD)";

    if (outWuLbl) outWuLbl.textContent = m === "LRFD" ? "GOVERNING Wu =" : "ALLOWABLE Wa =";
    if (outCombo1Lbl)
      outCombo1Lbl.textContent =
        m === "LRFD" ? "1.2DL+1.6LL" : "DL+LL";
    if (outCombo2Lbl)
      outCombo2Lbl.textContent = m === "LRFD" ? "1.4DL" : "—";

    var capLbl =
      m === "LRFD"
        ? "CAPACITY ANALYSIS"
        : "CAPACITY ANALYSIS (ASD)";
    if (capWithoutDefl) capWithoutDefl.textContent = capLbl + " without considering deflection";
    if (capConsiderDefl) capConsiderDefl.textContent = capLbl + " considering deflection";

    syncDeflectionButtons();
    syncBeamWeightButtons();
    syncCapModeButtons();
  }

  function syncDeflectionButtons() {
    var key = normalizeMode(state.deflectionMode);
    var without = key === normalizeMode("without considering deflection");
    if (btnWithoutDefl)
      btnWithoutDefl.classList.toggle("is-selected", without);
    if (btnConsiderDefl)
      btnConsiderDefl.classList.toggle("is-selected", !without);
  }

  function syncBeamWeightButtons() {
    var key = normalizeMode(state.beamWeightMode);
    var ignore = key === normalizeMode("ignore beam weight");
    if (btnConsiderWeight)
      btnConsiderWeight.classList.toggle("is-selected", !ignore);
    if (btnIgnoreWeight) btnIgnoreWeight.classList.toggle("is-selected", ignore);
  }

  function syncCapModeButtons() {
    var key = normalizeMode(state.deflectionMode);
    var without = key === normalizeMode("without considering deflection");
    if (capWithoutDefl) capWithoutDefl.classList.toggle("is-active-mode", without);
    if (capConsiderDefl)
      capConsiderDefl.classList.toggle("is-active-mode", !without);
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
    syncDeflectionButtons();
    syncCapModeButtons();
    recompute();
  }

  function setBeamWeightMode(label) {
    state.beamWeightMode = normalizeMode(label);
    syncBeamWeightButtons();
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
    var wGov = wuGoverning(method, dlS, llS);

    if (outCombo1) outCombo1.textContent = fmtLoose(combo1, 1);
    if (outCombo2)
      outCombo2.textContent =
        method === "LRFD" && combo2 != null ? fmtLoose(combo2, 1) : "—";
    if (outWuGov) outWuGov.textContent = fmtLoose(wGov, 1);

    var O39 =
      fy != null &&
      E != null &&
      L_ft != null &&
      L_ft > 0 &&
      Number.isFinite(wGov)
        ? muDemandFromW(wGov, L_ft)
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
        ? ixRequiredExcel(llS, L_ft, E, deflDiv)
        : null;

    setOut(outIxReq, fmt(ixReq, 5));
    if (outIxFormula)
      outIxFormula.textContent =
        "Δmax = 5 w L⁴ / (384 E Ix);  w = LL (kip/ft);  L (" +
        (L_ft != null ? fmtLoose(L_ft, 2) : "--") +
        " ft);  E (" +
        (E != null ? fmtLoose(E, 0) : "--") +
        " ksi);  δallow = L / (" +
        (deflDiv != null ? String(deflDiv) : "--") +
        ").";

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
      safeSection.textContent = pick && pick.sec ? pick.sec.label : "--";
    setOut(
      safeWeight,
      pick && pick.sec ? fmtLoose(pick.sec.weightPlf, 0) : "--"
    );
    setOut(
      safePhiMn,
      pick && Number.isFinite(pick.phiMn) ? fmtLoose(pick.phiMn, 2) : "--"
    );
    setOut(safeIx, pick && pick.sec ? fmtLoose(pick.sec.Ix, 0) : "--");

    if (safeRemark) {
      if (!pick)
        setOut(
          safeRemark,
          fy && E && L_ft && state.catalog.length
            ? "No W-shape satisfies Excel-style checks."
            : "--"
        );
      else
        setOut(
          safeRemark,
          deflectionNorm === "considering deflection"
            ? "Lightest section with φMn > governing Mu and Ix > required."
            : "φMn > max(Mu from Wu, Mu from factored w incl. beam weight when enabled)."
        );
    }

    if (resultBendingDesign) resultBendingDesign.textContent = "";
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

    if (btnWithoutDefl)
      btnWithoutDefl.addEventListener("click", function () {
        setDeflectionMode("without considering deflection");
      });
    if (btnConsiderDefl)
      btnConsiderDefl.addEventListener("click", function () {
        setDeflectionMode("considering deflection");
      });
    if (btnConsiderWeight)
      btnConsiderWeight.addEventListener("click", function () {
        setBeamWeightMode("consider beam weight");
      });
    if (btnIgnoreWeight)
      btnIgnoreWeight.addEventListener("click", function () {
        setBeamWeightMode("ignore beam weight");
      });

    if (capWithoutDefl)
      capWithoutDefl.addEventListener("click", function () {
        setDeflectionMode("without considering deflection");
      });
    if (capConsiderDefl)
      capConsiderDefl.addEventListener("click", function () {
        setDeflectionMode("considering deflection");
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
        state.catalog = parseCatalog(json);
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
