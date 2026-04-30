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
    champions: [
      { tier: 1, designation: "W14X48", weightPlf: 48, Ag: 14.1, rx: 5.85, ry: 1.91, lambdaFlange: 6.75, lambdaWeb: 33.6 },
      { tier: 2, designation: "W12X40", weightPlf: 40, Ag: 11.7, rx: 5.13, ry: 1.94, lambdaFlange: 7.77, lambdaWeb: 33.6 },
      { tier: 3, designation: "W10X26", weightPlf: 26, Ag: 7.61, rx: 4.35, ry: 1.36, lambdaFlange: 6.56, lambdaWeb: 34 },
      { tier: 4, designation: "W8X24", weightPlf: 24, Ag: 7.08, rx: 3.42, ry: 1.61, lambdaFlange: 8.12, lambdaWeb: 25.9 },
    ],
  };

  function el(id) {
    return document.getElementById(id);
  }

  function num(inp, fallback) {
    if (!inp) return fallback || 0;
    var v = Number(inp.value);
    return Number.isFinite(v) ? v : fallback || 0;
  }

  function fmt(v, d) {
    if (!Number.isFinite(v)) return "--";
    return Number(v.toFixed(typeof d === "number" ? d : 4));
  }

  function kLookup(label) {
    var key = String(label || "").trim().toUpperCase();
    var row = TIERS.boundaryK.find(function (b) {
      return String(b.label).toUpperCase() === key;
    });
    return row ? row.K : 1;
  }

  function fyFromGrade(grade) {
    var g = String(grade || "").trim().toUpperCase();
    if (g === "A36") return 36;
    if (g === "A572") return 50;
    return 50; // A992 default in workbook sample
  }

  /** Demand combinations from workbook mode switch (`LRFD` / `ASD`). */
  function demandByMethod(method, dl, ll) {
    var isAsd = String(method || "LRFD").toUpperCase() === "ASD";
    if (isAsd) {
      return {
        combo1: dl + ll,
        combo2: null,
        governing: dl + ll,
      };
    }
    var c1 = 1.2 * dl + 1.6 * ll;
    var c2 = 1.4 * dl;
    return {
      combo1: c1,
      combo2: c2,
      governing: Math.min(c1, c2),
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
   * Excel row logic: R = max(KLx_ft)*12/rx, S = max(KLy_ft)*12/ry, T = max(R,S);
   * Pu only if section compact; SAFE iff phiPn > Pu_req (strict).
   */
  function strengthForSection(sec, state) {
    var cs = compactStatus(sec, state.E, state.Fy);
    if (!cs.overallCompact) {
      return {
        phiPn: NaN,
        remark: "UNSAFE",
        compact: cs,
        KLrX: NaN,
        KLrY: NaN,
        KLrGov: NaN,
      };
    }
    var R = (state.klxMaxFt * 12) / sec.rx;
    var S = (state.klyMaxFt * 12) / sec.ry;
    var T = Math.max(R, S);
    var fb = flexuralBucklingStress(state.Fy, state.E, T);
    var Pn = sec.Ag * fb.Fcr;
    var designStrength =
      state.method === "ASD" ? Pn / 1.67 : 0.9 * Pn;
    var remark = designStrength > state.demandPu ? "SAFE" : "UNSAFE";
    return {
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

  function fillBoundarySelect(sel) {
    if (!sel || sel.options.length) return;
    TIERS.boundaryK.forEach(function (b) {
      var o = document.createElement("option");
      o.value = b.label;
      o.textContent = b.label;
      sel.appendChild(o);
    });
  }

  function updateCompactnessPanel(sec, E, Fy) {
    var cs = compactStatus(sec, E, Fy);
    function set(idVal, idLim, idLbl, lambda, lim, ok, compactWord, slenderWord) {
      var v = el(idVal);
      var l = el(idLim);
      var lbl = el(idLbl);
      if (v) v.value = fmt(lambda, 4);
      if (l) l.value = fmt(lim, 4);
      if (lbl) {
        lbl.textContent = ok ? compactWord : slenderWord;
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
      "Compact flange",
      "Slender flange"
    );
    set(
      "compressionDesignWebLambda",
      "compressionDesignWebLim",
      "compressionDesignWebClass",
      sec.lambdaWeb,
      cs.lrWeb,
      cs.webOk,
      "Compact web",
      "Slender web"
    );
  }

  function recompute() {
    var methodSel = el("compressionDesignMethod");
    var method = methodSel ? String(methodSel.value || "LRFD").toUpperCase() : "LRFD";
    if (!designView.classList.contains("is-active")) return;

    var gradeSel = el("compressionDesignGrade");
    var fyIn = el("compressionDesignFy");
    var eIn = el("compressionDesignE");
    var dlIn = el("compressionDesignDl");
    var llIn = el("compressionDesignLl");

    if (gradeSel && fyIn) {
      fyIn.value = String(fyFromGrade(gradeSel.value));
    }
    var Fy = Math.max(1e-6, num(fyIn, 50));
    var E = Math.max(1e-6, num(eIn, 29000));
    var dl = Math.max(0, num(dlIn, 90));
    var ll = Math.max(0, num(llIn, 320));

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
    var probHead = el("compressionProbDemandHead");
    if (d1Lbl) d1Lbl.textContent = method === "ASD" ? "DL + LL" : "1.2DL + 1.6LL";
    if (d2Lbl) d2Lbl.textContent = method === "ASD" ? "-" : "1.4DL";
    if (dgLbl) dgLbl.textContent = method === "ASD" ? "Ta" : "Tu";
    if (probHead) probHead.textContent = method === "ASD" ? "Pa (kips)" : "Pu (kips)";
    if (d1) d1.value = fmt(demandCombo1, 3);
    if (d2) d2.value = Number.isFinite(demandCombo2) ? fmt(demandCombo2, 3) : "-";
    if (dg) dg.value = fmt(demandPu, 3);

    var klxMaxFt = readAxisRows("X");
    var klyMaxFt = readAxisRows("Y");

    var state = {
      method: method,
      E: E,
      Fy: Fy,
      demandPu: demandPu,
      klxMaxFt: klxMaxFt,
      klyMaxFt: klyMaxFt,
    };

    var results = TIERS.champions.map(function (sec) {
      return {
        sec: sec,
        out: strengthForSection(sec, state),
      };
    });

    results.forEach(function (row, idx) {
      var i = idx + 1;
      var wEl = el("compressionProbW" + i);
      var nEl = el("compressionProbName" + i);
      var pEl = el("compressionProbPu" + i);
      var rEl = el("compressionProbRm" + i);
      if (wEl) wEl.textContent = String(row.sec.weightPlf);
      if (nEl) nEl.textContent = row.sec.designation;
      if (pEl)
        pEl.textContent = Number.isFinite(row.out.phiPn)
          ? fmt(row.out.phiPn, 4)
          : "--";
      if (rEl) {
        rEl.textContent = row.out.remark;
        rEl.classList.toggle("is-safe", row.out.remark === "SAFE");
        rEl.classList.toggle("is-unsafe", row.out.remark === "UNSAFE");
      }
    });

    var adequate = results.filter(function (row) {
      return Number.isFinite(row.out.phiPn) && row.out.phiPn > demandPu;
    });
    adequate.sort(function (a, b) {
      return a.sec.weightPlf - b.sec.weightPlf;
    });

    var lightest = adequate.length ? adequate[0] : null;
    var safeSec = el("compressionSafeSection");
    var safeAg = el("compressionSafeAg");
    var safeRm = el("compressionSafeRemark");
    var safeRmLbl = el("compressionSafeRemarkLabel");

    if (lightest) {
      if (safeSec) safeSec.textContent = lightest.sec.designation;
      if (safeAg) safeAg.value = fmt(lightest.sec.Ag, 3);
      if (safeRm) safeRm.value = lightest.out.remark;
      if (safeRmLbl) {
        safeRmLbl.textContent = lightest.out.remark;
        safeRmLbl.classList.toggle("is-safe", lightest.out.remark === "SAFE");
        safeRmLbl.classList.toggle("is-unsafe", lightest.out.remark === "UNSAFE");
      }
      updateCompactnessPanel(lightest.sec, E, Fy);

      var govCaption = el("compressionKLGovCaption");
      var govVal = el("compressionKLGovValue");
      if (govCaption && govVal) {
        if (lightest.out.strongAxisGovernsKLr) {
          govCaption.textContent = "Assuming Klx Governs";
          govVal.textContent = fmt(klxMaxFt, 4);
        } else {
          govCaption.textContent = "Assuming Kly Governs";
          govVal.textContent = fmt(klyMaxFt, 4);
        }
      }
    } else {
      if (safeSec) safeSec.textContent = "NO SAFE SECTION";
      if (safeAg) safeAg.value = "--";
      if (safeRm) safeRm.value = "UNSAFE";
      if (safeRmLbl) {
        safeRmLbl.textContent = "UNSAFE";
        safeRmLbl.classList.remove("is-safe");
        safeRmLbl.classList.add("is-unsafe");
      }
      updateCompactnessPanel(TIERS.champions[TIERS.champions.length - 1], E, Fy);

      var gc = el("compressionKLGovCaption");
      var gv = el("compressionKLGovValue");
      if (gc) gc.textContent = "—";
      if (gv) gv.textContent = "--";
    }

    var dbg = el("resultCompression");
    if (dbg) {
      dbg.textContent = "";
      dbg.style.display = "none";
    }
  }

  function wire() {
    ["compressionDesignMethod", "compressionDesignGrade", "compressionDesignFy", "compressionDesignE", "compressionDesignDl", "compressionDesignLl"].forEach(function (id) {
      var node = el(id);
      if (!node) return;
      ["input", "change"].forEach(function (ev) {
        node.addEventListener(ev, recompute);
      });
    });

    ["X", "Y"].forEach(function (axis) {
      for (var i = 1; i <= 3; i++) {
        var cond = el("compression" + axis + i + "Cond");
        var Lin = el("compression" + axis + i + "L");
        fillBoundarySelect(cond);
        if (cond) cond.addEventListener("change", recompute);
        if (Lin) Lin.addEventListener("input", recompute);
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

    // Defaults matching workbook screenshot (`Compression-Design`)
    var x1 = el("compressionX1Cond");
    var x1l = el("compressionX1L");
    if (x1) x1.value = "FIXED-PINNED";
    if (x1l) x1l.value = "30";
    var y1 = el("compressionY1Cond");
    var y3 = el("compressionY3Cond");
    if (y1) y1.value = "PINNED-PINNED";
    if (y3) y3.value = "PINNED-PINNED";
    [["compressionX2Cond", "compressionX2L"], ["compressionX3Cond", "compressionX3L"]].forEach(function (pair) {
      var s = el(pair[0]);
      var L = el(pair[1]);
      if (s) s.value = "N/A";
      if (L) L.value = "";
    });
    var y2 = el("compressionY2Cond");
    var y2l = el("compressionY2L");
    if (y2) y2.value = "FIXED-PINNED";
    if (y2l) y2l.value = "14";

    recompute();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }
})();
