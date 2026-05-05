(function () {
  "use strict";
  var ENABLE_TENSION_DEBUG_TELEMETRY = false;
  var __nativeFetch = typeof window.fetch === "function" ? window.fetch.bind(window) : null;
  function fetch(url, opts) {
    var u = String(url || "");
    if (u.indexOf("127.0.0.1:7885/ingest") !== -1 || u.indexOf("127.0.0.1:7611/ingest") !== -1) {
      return Promise.resolve({ ok: false, skipped: true });
    }
    if (!__nativeFetch) return Promise.reject(new Error("fetch unavailable"));
    return __nativeFetch(url, opts);
  }

  var root = document.getElementById("tensionSection");
  if (!root) return;
  // #region agent log
  function dbg(runId, hypothesisId, location, message, data) {
    if (!ENABLE_TENSION_DEBUG_TELEMETRY) return;
    var payload = { sessionId: "99e7ea", id: "log_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8), runId: runId, hypothesisId: hypothesisId, location: location, message: message, data: data || {}, timestamp: Date.now() };
    try {
      localStorage.setItem("steel-debug-99e7ea-tail", JSON.stringify(payload));
    } catch (e) {}
    fetch("http://127.0.0.1:7885/ingest/0499c47d-70cd-429d-a2ae-82b51e1ec3cb", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "99e7ea" }, body: JSON.stringify(payload) }).catch(function () {});
  }
  dbg("pre-fix", "H0", "tension-page-ui.js:init", "Tension UI script initialized", { rootFound: true });
  // #endregion

  // #region agent log
  (function logTensionLayoutSnapshot() {
    if (!ENABLE_TENSION_DEBUG_TELEMETRY) return;
    function rect(el) {
      if (!el || !el.getBoundingClientRect) return null;
      var r = el.getBoundingClientRect();
      return {
        x: Math.round(r.x),
        y: Math.round(r.y),
        w: Math.round(r.width),
        h: Math.round(r.height),
        top: Math.round(r.top),
        left: Math.round(r.left),
        right: Math.round(r.right),
        bottom: Math.round(r.bottom),
      };
    }
    function overlap(a, b) {
      if (!a || !b) return false;
      return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
    }
    function send(data) {
      fetch('http://127.0.0.1:7611/ingest/6a837e42-6b94-4ac8-9453-30078a74f4d8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'978dc8'},body:JSON.stringify({sessionId:'978dc8',runId:window.__steelRunId||'pre-fix',hypothesisId:'H_TENSION_LAYOUT',location:'tension-page-ui.js:layoutSnapshot',message:'Tension layout snapshot',data:data,timestamp:Date.now()})}).catch(()=>{});
    }

    var shell = root.querySelector(".tension-shell");
    var grid3 = root.querySelector(".tension-grid-3");
    var grid2s = root.querySelectorAll(".tension-grid-2");
    var safe = root.querySelector(".safe-card");
    var guide = root.querySelector(".tension-guide");
    var connImg = document.getElementById("tensionConnectionImage");

    if (window.requestAnimationFrame) {
      window.requestAnimationFrame(function () {
        var rRoot = rect(root);
        var rShell = rect(shell);
        var rGrid3 = rect(grid3);
        var rSafe = rect(safe);
        var rGuide = rect(guide);
        var rImg = rect(connImg);

        var anyOverflow = shell ? (shell.scrollWidth > shell.clientWidth) : null;
        var g2Rects = [];
        for (var i = 0; i < grid2s.length; i++) g2Rects.push(rect(grid2s[i]));

        send({
          viewport: { w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio || 1 },
          root: rRoot,
          shell: rShell,
          grid3: rGrid3,
          grid2: g2Rects,
          safe: rSafe,
          guide: rGuide,
          connectionImage: rImg,
          overlaps: {
            safe_guide: overlap(rSafe, rGuide),
          },
          horizontalOverflow: anyOverflow,
        });
      });
    }
  })();
  // #endregion

  var viewButtons = root.querySelectorAll("[data-tension-view]");
  var analysisModeButtons = root.querySelectorAll("[data-tension-analysis-mode]");
  var analysisCalcNon = byId("analysisCalcNon");
  var analysisCalcStag = byId("analysisCalcStag");
  var viewMap = {
    design: document.getElementById("tensionViewDesign"),
    analysisNon: document.getElementById("tensionViewAnalysisNon"),
    analysisStag: document.getElementById("tensionViewAnalysisStag"),
  };
  var tensionShell = root.querySelector(".tension-shell");
  /** Apply `NS -Tension Analysis` workbook defaults once when user opens the Analysis Calculator tab (distinct from `Tension Design`). */
  var excelNsAnalysisCalculatorDefaultsApplied = false;
  /** Apply `S -Tension Analysis` workbook defaults once when user opens **Tension — Staggered** (plate `X45` is stagger-only; decoupled from non-stagger plate). */
  var excelStaggerAnalysisCalculatorDefaultsApplied = false;
  /** **`Tension Design`** workbook defaults (shared by **Design Calculator** + **Capacity and Demand Analysis**) — applied at end of catalog load. */
  var excelTensionDesignCalculatorDefaultsApplied = false;

  function enforceAnalysisScrollLayout() {
    // Runtime guard against conflicting CSS height/overflow rules.
    if (root) {
      root.style.overflowY = "auto";
      root.style.overflowX = "hidden";
    }
    if (tensionShell) {
      tensionShell.style.overflowY = "auto";
      tensionShell.style.overflowX = "hidden";
      tensionShell.style.height = "auto";
      tensionShell.style.minHeight = "0";
    }
    var analysisView = viewMap.analysisStag;
    if (analysisView) {
      analysisView.style.overflowY = "visible";
      analysisView.style.overflowX = "visible";
      analysisView.style.height = "auto";
    }
    if (analysisCalcNon) {
      analysisCalcNon.style.overflow = "visible";
      analysisCalcNon.style.maxHeight = "none";
      analysisCalcNon.style.height = "auto";
    }
    if (analysisCalcStag) {
      analysisCalcStag.style.overflow = "visible";
      analysisCalcStag.style.maxHeight = "none";
      analysisCalcStag.style.height = "auto";
    }
  }

  function setupTabAccessibility() {
    var tabsContainer = root.querySelector(".tension-top-tabs");
    if (tabsContainer) tabsContainer.setAttribute("role", "tablist");
    viewButtons.forEach(function (btn) {
      var viewName = btn.getAttribute("data-tension-view");
      var panel = viewName ? viewMap[viewName] : null;
      if (!panel) return;
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-controls", panel.id);
      btn.setAttribute("tabindex", "-1");
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", panel.id + "-tab");
      if (!btn.id) btn.id = panel.id + "-tab";
    });

    var subTabs = root.querySelectorAll("[data-tension-analysis-mode]");
    subTabs.forEach(function (btn) {
      btn.setAttribute("role", "tab");
      btn.setAttribute("tabindex", "-1");
      var mode = btn.getAttribute("data-tension-analysis-mode");
      var panel = mode === "non" ? analysisCalcNon : mode === "stag" ? analysisCalcStag : null;
      if (!panel) return;
      btn.setAttribute("aria-controls", panel.id);
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", panel.id + "-tab");
      if (!btn.id) btn.id = panel.id + "-tab";
    });
  }

  function wireArrowKeyNav(buttonList) {
    buttonList.forEach(function (btn, index) {
      btn.addEventListener("keydown", function (ev) {
        if (ev.key !== "ArrowRight" && ev.key !== "ArrowLeft") return;
        ev.preventDefault();
        var step = ev.key === "ArrowRight" ? 1 : -1;
        var next = (index + step + buttonList.length) % buttonList.length;
        buttonList[next].focus();
        buttonList[next].click();
      });
    });
  }

  function setView(name) {
    Object.keys(viewMap).forEach(function (k) {
      if (!viewMap[k]) return;
      var active = k === name;
      viewMap[k].classList.toggle("is-active", active);
      viewMap[k].setAttribute("aria-hidden", active ? "false" : "true");
    });
    viewButtons.forEach(function (btn) {
      var active = btn.getAttribute("data-tension-view") === name;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
      btn.setAttribute("tabindex", active ? "0" : "-1");
    });
    // #region agent log
    dbg("pre-fix", "H0", "tension-page-ui.js:setView", "Tension top view changed", { view: name });
    // #endregion
    enforceAnalysisScrollLayout();
    if (name === "analysisStag" && !excelNsAnalysisCalculatorDefaultsApplied) {
      if (applyExcelNsAnalysisCalculatorDefaults()) excelNsAnalysisCalculatorDefaultsApplied = true;
    }
    if (name === "analysisStag" || name === "analysisNon") recomputeAll();
  }

  viewButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      setView(btn.getAttribute("data-tension-view"));
    });
  });

  function setAnalysisMode(mode) {
    if (analysisCalcNon) {
      var isNon = mode === "non";
      analysisCalcNon.classList.toggle("is-active", isNon);
      analysisCalcNon.setAttribute("aria-hidden", isNon ? "false" : "true");
    }
    if (analysisCalcStag) {
      var isStag = mode === "stag";
      analysisCalcStag.classList.toggle("is-active", isStag);
      analysisCalcStag.setAttribute("aria-hidden", isStag ? "false" : "true");
    }
    if (mode === "stag") {
      if (!excelStaggerAnalysisCalculatorDefaultsApplied && candidateSections && candidateSections.length) {
        if (applyExcelStaggerAnalysisCalculatorDefaults()) excelStaggerAnalysisCalculatorDefaultsApplied = true;
      }
      if (analysisStagUnsupportedLc && unsupportedLc) analysisStagUnsupportedLc.value = unsupportedLc.value;
      syncShapeFromNonToStag();
    } else if (mode === "non") {
      if (analysisStagUnsupportedLc && unsupportedLc) unsupportedLc.value = analysisStagUnsupportedLc.value;
      syncShapeFromStagToNon();
    }
    analysisModeButtons.forEach(function (b) {
      var active = b.getAttribute("data-tension-analysis-mode") === mode;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-selected", active ? "true" : "false");
      b.setAttribute("tabindex", active ? "0" : "-1");
    });
    // Keep all analysis outputs synced when switching tabs.
    recomputeAll();
    enforceAnalysisScrollLayout();
    // #region agent log
    if (mode === "stag") logStaggeredLayoutSnapshot("post-fix");
    // #endregion
  }

  analysisModeButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var mode = btn.getAttribute("data-tension-analysis-mode");
      if (mode === "non" || mode === "stag") setAnalysisMode(mode);
    });
  });

  function byId(id) {
    return document.getElementById(id);
  }

  var steelSelect = byId("tensionSteelGrade");
  var fyInput = byId("tensionFy");
  var fuInput = byId("tensionFu");
  var methodSelect = byId("tensionMethod");
  var nominalDia = byId("tensionNominalDiameter");
  var boltType = byId("tensionBoltType");
  var boltDiaOut = byId("tensionBoltDiameter");
  var fastenersPerLine = byId("tensionFastenersPerLine");
  var gageLines = byId("tensionGageLines");
  var connectionSelect = byId("tensionConnection");
  var tensionNonStagConnectionSelect = byId("tensionNonStagConnectionSelect");
  var tensionStagConnectionSelect = byId("tensionStagConnectionSelect");
  var uOut = byId("tensionU");
  var connImage = byId("tensionConnectionImage");
  var dlInput = byId("tensionDL");
  var llInput = byId("tensionLL");
  var lengthFt = byId("tensionLengthFt");

  var demandEq1Label = byId("tensionDemandEq1Label");
  var demandEq2Label = byId("tensionDemandEq2Label");
  var demandGovLabel = byId("tensionDemandGovLabel");
  var demandEq1 = byId("tensionDemandEq1");
  var demandEq2 = byId("tensionDemandEq2");
  var demandGov = byId("tensionDemandGov");
  var minROut = byId("tensionMinR");
  var agYieldOut = byId("tensionAgYield");
  var anFractureOut = byId("tensionAnFracture");
  var agFractureOut = byId("tensionAgFracture");
  var safeSectionOut = byId("tensionSafeSection");
  var designSectionSelect = byId("tensionDesignSectionSelect");
  var designSectionPreview = byId("tensionDesignSectionPreview");
  var safeAgOut = byId("tensionSafeAg");
  var safeRemarkOut = byId("tensionSafeRemark");
  var cdCapacityTbody = byId("cdCapacityTbody");
  var cdDemandTbody = byId("cdDemandTbody");
  var cdSheetScrollSynced = false;

  var shapeSelect = byId("tensionShapeSelect");
  var nsAiscGrid = byId("nsAiscGrid");
  var nsShapeIcons = byId("nsShapeIcons");
  var nsTypeChips = byId("nsTypeChips");
  var shapeSelectStag = byId("tensionShapeSelectStag");
  var stagAiscGrid = byId("stagAiscGrid");
  var stagShapeIcons = byId("stagShapeIcons");
  var stagTypeChips = byId("stagSectionTypeChips");
  var shapeAg = byId("tensionShapeAg");
  var shapeRx = byId("tensionShapeRx");
  var shapeRy = byId("tensionShapeRy");
  var shapeT = byId("tensionShapeT");
  var shapeX = byId("tensionShapeXbar");
  var shapeY = byId("tensionShapeYbar");
  var shapeAgStag = byId("tensionShapeAgStag");
  var shapeRxStag = byId("tensionShapeRxStag");
  var shapeRyStag = byId("tensionShapeRyStag");
  var shapeTStag = byId("tensionShapeTStag");
  var shapeXStag = byId("tensionShapeXbarStag");
  var shapeYStag = byId("tensionShapeYbarStag");
  var plateThickness = byId("tensionPlateThickness");
  var plateAg = byId("tensionPlateAg");
  var lengthInOut = byId("tensionLengthIn");
  var analysisStagPlateLengthIn = byId("analysisStagPlateLengthIn");
  var analysisStagPlateThickness = byId("analysisStagPlateThickness");
  var analysisStagPlateAg = byId("analysisStagPlateAg");
  var analysisStagLengthIn = byId("analysisStagLengthIn");

  var case1Out = byId("tensionCase1");
  var case2Out = byId("tensionCase2");
  var case8Out = byId("tensionCase8");
  var uGovOut = byId("tensionUGoverning");
  var stressType = byId("tensionStressType");
  var unsupportedLc = byId("analysisUnsupportedLc");
  var analysisStagUnsupportedLc = byId("analysisStagUnsupportedLc");
  var plateLengthIn = byId("analysisPlateLengthIn");
  var analysisPlateLengthOverride = byId("analysisPlateLengthIn");

  var analysisMethodMirror = byId("analysisMethodMirror");
  var analysisSteelMirror = byId("analysisSteelMirror");
  var analysisFyMirror = byId("analysisFyMirror");
  var analysisFuMirror = byId("analysisFuMirror");
  var analysisDlMirror = byId("analysisDlMirror");
  var analysisLlMirror = byId("analysisLlMirror");
  var analysisLenMirror = byId("analysisLenMirror");
  var analysisNomDiaMirror = byId("analysisNomDiaMirror");
  var analysisBoltTypeMirror = byId("analysisBoltTypeMirror");
  var analysisHoleDiaMirror = byId("analysisHoleDiaMirror");
  var analysisFastMirror = byId("analysisFastMirror");
  var analysisGageMirror = byId("analysisGageMirror");
  var analysisStagMethodMirror = byId("analysisStagMethodMirror");
  var analysisStagSteelMirror = byId("analysisStagSteelMirror");
  var analysisStagFyMirror = byId("analysisStagFyMirror");
  var analysisStagFuMirror = byId("analysisStagFuMirror");
  var analysisStagDlMirror = byId("analysisStagDlMirror");
  var analysisStagLlMirror = byId("analysisStagLlMirror");
  var analysisStagLenMirror = byId("analysisStagLenMirror");
  var analysisStagNomDiaMirror = byId("analysisStagNomDiaMirror");
  var analysisStagBoltTypeMirror = byId("analysisStagBoltTypeMirror");
  var analysisStagHoleDiaMirror = byId("analysisStagHoleDiaMirror");
  var analysisStagFastMirror = byId("analysisStagFastMirror");
  var analysisStagGageMirror = byId("analysisStagGageMirror");
  var analysisStagCase1 = byId("analysisStagCase1");
  var analysisStagCase2 = byId("analysisStagCase2");
  var analysisStagCase8 = byId("analysisStagCase8");
  var analysisStagUGov = byId("analysisStagUGov");

  var analysisDemand1Label = byId("analysisDemand1Label");
  var analysisDemand2Label = byId("analysisDemand2Label");
  var analysisDemandGovLabel = byId("analysisDemandGovLabel");
  var analysisDemand1 = byId("analysisDemand1");
  var analysisDemand2 = byId("analysisDemand2");
  var analysisDemandGov = byId("analysisDemandGov");
  var analysisStagDemand1Label = byId("analysisStagDemand1Label");
  var analysisStagDemand2Label = byId("analysisStagDemand2Label");
  var analysisStagDemandGovLabel = byId("analysisStagDemandGovLabel");
  var analysisStagDemand1 = byId("analysisStagDemand1");
  var analysisStagDemand2 = byId("analysisStagDemand2");
  var analysisStagDemandGov = byId("analysisStagDemandGov");

  var analysisNetAn = byId("analysisNetAn");
  var analysisAe = byId("analysisAe");
  var analysisYieldLabel = byId("analysisYieldLabel");
  var analysisFracLabel = byId("analysisFracLabel");
  var analysisYieldCap = byId("analysisYieldCap");
  var analysisFracCap = byId("analysisFracCap");
  var analysisStagYieldLabel = byId("analysisStagYieldLabel");
  var analysisStagFracLabel = byId("analysisStagFracLabel");
  var analysisStagYieldCap = byId("analysisStagYieldCap");
  var analysisStagFracCap = byId("analysisStagFracCap");
  var analysisStagCriticalAn = byId("analysisStagCriticalAn");
  var analysisStagAe = byId("analysisStagAe");
  var analysisStagAeDemand = byId("analysisStagAeDemand");

  var analysisBsLt = byId("analysisBsLt");
  var analysisBsNt = byId("analysisBsNt");
  var analysisBsLv = byId("analysisBsLv");
  var analysisBsNv = byId("analysisBsNv");
  var analysisBsAgt = byId("analysisBsAgt");
  var analysisBsAnt = byId("analysisBsAnt");
  var analysisBsAvg = byId("analysisBsAvg");
  var analysisBsAvn = byId("analysisBsAvn");
  var analysisBlockShearCap = byId("analysisBlockShearCap");
  var analysisStagStressType = byId("analysisStagStressType");
  var analysisStagBlockShearCap = byId("analysisStagBlockShearCap");
  var analysisStagBsLt = byId("analysisStagBsLt");
  var analysisStagBsNt = byId("analysisStagBsNt");
  var analysisStagBsLv = byId("analysisStagBsLv");
  var analysisStagBsNv = byId("analysisStagBsNv");
  var analysisStagBsAgt = byId("analysisStagBsAgt");
  var analysisStagBsAnt = byId("analysisStagBsAnt");
  var analysisStagBsAvg = byId("analysisStagBsAvg");
  var analysisStagBsAvn = byId("analysisStagBsAvn");
  var analysisStagBsFt = byId("analysisStagBsFt");
  var analysisStagBsF1v = byId("analysisStagBsF1v");
  var analysisStagBsF2v = byId("analysisStagBsF2v");
  var analysisStagBsTn = byId("analysisStagBsTn");
  var analysisStagBsLrfdTu = byId("analysisStagBsLrfdTu");
  var analysisStagBsAsdTa = byId("analysisStagBsAsdTa");

  var analysisGoverningDisplay = byId("analysisGoverningDisplay");
  var analysisSafetyStatus = byId("analysisSafetyStatus");
  var analysisGoverningDisplayStag = byId("analysisGoverningDisplayStag");
  var analysisSafetyStatusStag = byId("analysisSafetyStatusStag");
  var analysisStagGovEqLabel = byId("analysisStagGovEqLabel");
  var analysisGovEqLabelNon = byId("analysisGovEqLabelNon");

  function enforceRequestedVisualLocks() {
    // Hard-apply styles in case cached/native select rendering ignores CSS.
    if (methodSelect) {
      methodSelect.style.textAlign = "center";
      methodSelect.style.textAlignLast = "center";
      methodSelect.style.paddingLeft = "0";
      methodSelect.style.paddingRight = "0";
      methodSelect.style.paddingTop = "0";
      methodSelect.style.paddingBottom = "0";
      methodSelect.style.height = "2.2rem";
      methodSelect.style.lineHeight = "2.2rem";
      methodSelect.style.appearance = "none";
      methodSelect.style.webkitAppearance = "none";
      methodSelect.style.mozAppearance = "none";
    }
    if (steelSelect) {
      steelSelect.style.color = "#c01919";
      steelSelect.style.fontWeight = "900";
    }
  }

  function enforceNonStaggeredFieldModes() {
    var nonRoot = byId("analysisCalcNon");
    if (!nonRoot) return;
    var computedInputs = nonRoot.querySelectorAll("input.out-green");
    computedInputs.forEach(function (el) {
      el.readOnly = true;
      el.setAttribute("aria-readonly", "true");
    });
    var userInputs = nonRoot.querySelectorAll("input.in-yellow, select.in-yellow");
    userInputs.forEach(function (el) {
      if (el.tagName === "INPUT") el.readOnly = false;
      el.removeAttribute("aria-readonly");
    });
  }

  function enforceStaggeredFieldModes() {
    var stagRoot = byId("analysisCalcStag");
    if (!stagRoot) return;
    var computedInputs = stagRoot.querySelectorAll("input.out-green");
    computedInputs.forEach(function (el) {
      el.readOnly = true;
      el.setAttribute("aria-readonly", "true");
    });
    var userInputs = stagRoot.querySelectorAll("input.in-yellow, select.in-yellow");
    userInputs.forEach(function (el) {
      if (el.tagName === "INPUT") el.readOnly = false;
      el.removeAttribute("aria-readonly");
    });
  }

  var sg1 = byId("tensionSg1");
  var g1 = byId("tensionG1");
  var g2 = byId("tensionG2");
  var path1 = byId("tensionPath1");
  var path2 = byId("tensionPath2");
  var path3 = byId("tensionPath3");
  var criticalAn = byId("tensionCriticalAn");

  function connectionSvgData(label, detail) {
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220">' +
      '<rect width="360" height="220" fill="#f7fbff"/>' +
      '<rect x="6" y="6" width="348" height="208" rx="9" fill="#ffffff" stroke="#9bb5c5" stroke-width="2"/>' +
      '<rect x="52" y="56" width="44" height="118" fill="#b8c9d3" stroke="#5e7787" stroke-width="2"/>' +
      '<rect x="108" y="96" width="196" height="38" fill="#d8e4ec" stroke="#6f8695" stroke-width="2"/>' +
      '<circle cx="146" cy="115" r="6" fill="#4f6b7b"/><circle cx="184" cy="115" r="6" fill="#4f6b7b"/>' +
      '<circle cx="222" cy="115" r="6" fill="#4f6b7b"/><circle cx="260" cy="115" r="6" fill="#4f6b7b"/>' +
      '<rect x="10" y="10" width="340" height="30" rx="6" fill="#e4f2fa"/>' +
      '<text x="180" y="30" text-anchor="middle" font-size="15" font-weight="700" fill="#1f4f68">' + label + "</text>" +
      '<text x="180" y="198" text-anchor="middle" font-size="13" font-weight="600" fill="#3b677f">' + detail + "</text>" +
      "</svg>";
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  }

  /**
   * Shear-lag illustrations for single angles (AISC 360 Table D3.1 Case 8 style: U = 1 − x̄/L).
   * Inline SVG avoids missing PNG assets and matches client sketches: web-only uses horizontal x̄ from the
   * vertical leg faying surface; flange-only uses vertical x̄ from the horizontal leg bearing plane.
   * Fasteners are drawn large and explicit — **three bolts in one line** per Case 8 / “No. of Fasteners per line”.
   */
  function shearLagAngleConnectionSvgDataUrl(kind) {
    var k = String(kind || "WEB").toUpperCase();

    /** Hex bolt head + washer — reads clearly at panel scale (client requested 3 visible fasteners). */
    function boltAt(cx, cy) {
      return (
        '<g transform="translate(' +
        cx +
        "," +
        cy +
        ')">' +
        '<circle cx="0" cy="0" r="10" fill="#94a3b8" stroke="#1e293b" stroke-width="2"/>' +
        '<polygon points="0,-7 6,-3.5 6,3.5 0,7 -6,3.5 -6,-3.5" fill="#cbd5e1" stroke="#475569" stroke-width="1.2"/>' +
        '<circle cx="0" cy="0" r="3.5" fill="#334155"/>' +
        "</g>"
      );
    }

    var svg;
    if (k === "WEB") {
      svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 248">' +
        '<defs><marker id="ahW" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#1f4f68"/></marker></defs>' +
        '<rect width="400" height="248" fill="#f7fbff"/>' +
        '<rect x="8" y="8" width="384" height="232" rx="10" fill="#ffffff" stroke="#9bb5c5" stroke-width="2"/>' +
        '<rect x="16" y="16" width="368" height="30" rx="6" fill="#e4f2fa"/>' +
        '<text x="200" y="37" text-anchor="middle" font-size="14" font-weight="700" fill="#1f4f68">WEB LEG ONLY (vertical leg to gusset)</text>' +
        '<text x="200" y="54" text-anchor="middle" font-size="11" font-weight="600" fill="#0f766e">3 bolts in one vertical line — fasteners per line = 3</text>' +
        '<rect x="38" y="66" width="30" height="150" fill="#c5d4dc" stroke="#5e7787" stroke-width="2"/>' +
        '<polygon points="68,66 68,188 238,188 238,204 68,204" fill="#d8e4ec" stroke="#5e7787" stroke-width="2"/>' +
        boltAt(74, 96) +
        boltAt(74, 138) +
        boltAt(74, 180) +
        '<line x1="138" y1="66" x2="138" y2="204" stroke="#7a9aad" stroke-width="1.5" stroke-dasharray="5,4"/>' +
        '<circle cx="138" cy="150" r="5" fill="#111827"/>' +
        '<line x1="68" y1="66" x2="68" y2="210" stroke="#1f4f68" stroke-width="2"/>' +
        '<line x1="68" y1="78" x2="138" y2="78" stroke="#1f4f68" stroke-width="1.5" marker-end="url(#ahW)" marker-start="url(#ahW)"/>' +
        '<text x="102" y="72" text-anchor="middle" font-size="15" font-weight="700" fill="#0c4a6e">x̄</text>' +
        '<text x="200" y="232" text-anchor="middle" font-size="11" fill="#3b677f">U = 1 − x̄/L · x̄ from gusset face to centroid</text>' +
        "</svg>";
    } else if (k === "FLANGE") {
      svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 248">' +
        '<defs><marker id="avF" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#1f4f68"/></marker></defs>' +
        '<rect width="400" height="248" fill="#f7fbff"/>' +
        '<rect x="8" y="8" width="384" height="232" rx="10" fill="#ffffff" stroke="#9bb5c5" stroke-width="2"/>' +
        '<rect x="16" y="16" width="368" height="30" rx="6" fill="#e4f2fa"/>' +
        '<text x="200" y="37" text-anchor="middle" font-size="14" font-weight="700" fill="#1f4f68">FLANGE LEG ONLY (horizontal leg bearing)</text>' +
        '<text x="200" y="54" text-anchor="middle" font-size="11" font-weight="600" fill="#0f766e">3 bolts in one horizontal line on bearing leg</text>' +
        '<rect x="36" y="176" width="280" height="20" fill="#c5d4dc" stroke="#5e7787" stroke-width="2"/>' +
        '<polygon points="96,176 96,88 124,88 124,176 264,176 264,192 96,192" fill="#d8e4ec" stroke="#5e7787" stroke-width="2"/>' +
        boltAt(128, 164) +
        boltAt(180, 164) +
        boltAt(232, 164) +
        '<line x1="308" y1="96" x2="308" y2="176" stroke="#7a9aad" stroke-width="1.5" stroke-dasharray="5,4"/>' +
        '<circle cx="308" cy="130" r="5" fill="#111827"/>' +
        '<line x1="308" y1="176" x2="308" y2="130" stroke="#1f4f68" stroke-width="1.5" marker-end="url(#avF)" marker-start="url(#avF)"/>' +
        '<text x="318" y="156" text-anchor="start" font-size="15" font-weight="700" fill="#0c4a6e">x̄</text>' +
        '<text x="200" y="232" text-anchor="middle" font-size="11" fill="#3b677f">x̄ is vertical ( ⊥ to horizontal faying surface )</text>' +
        "</svg>";
    } else {
      svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 248">' +
        '<rect width="400" height="248" fill="#f7fbff"/>' +
        '<rect x="8" y="8" width="384" height="232" rx="10" fill="#ffffff" stroke="#9bb5c5" stroke-width="2"/>' +
        '<rect x="16" y="16" width="368" height="30" rx="6" fill="#e4f2fa"/>' +
        '<text x="200" y="37" text-anchor="middle" font-size="14" font-weight="700" fill="#1f4f68">WEB &amp; FLANGE (both legs fastened)</text>' +
        '<text x="200" y="54" text-anchor="middle" font-size="11" font-weight="600" fill="#0f766e">3 bolts on web · 3 bolts on flange (each line)</text>' +
        '<rect x="32" y="74" width="26" height="118" fill="#c5d4dc" stroke="#5e7787" stroke-width="2"/>' +
        '<rect x="44" y="184" width="220" height="16" fill="#c5d4dc" stroke="#5e7787" stroke-width="2"/>' +
        '<polygon points="58,74 58,184 234,184 234,200 58,200" fill="#d8e4ec" stroke="#5e7787" stroke-width="2"/>' +
        boltAt(50, 102) +
        boltAt(50, 136) +
        boltAt(50, 170) +
        boltAt(105, 192) +
        boltAt(150, 192) +
        boltAt(195, 192) +
        '<circle cx="138" cy="138" r="5" fill="#111827"/>' +
        '<text x="200" y="228" text-anchor="middle" font-size="12" font-weight="600" fill="#166534">Both legs connected — U = 1.0 (this module)</text>' +
        "</svg>";
    }
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  }

  /** Client reference renders (`assets/tension-page/shear-lag-*.png`). SVG diagrams used only if a PNG fails to load. */
  var SHEAR_LAG_CONNECTION_IMAGES = {
    WEB: "assets/tension-page/shear-lag-web-leg.png",
    FLANGE: "assets/tension-page/shear-lag-flange-leg.png",
    FLANGE_WEB: "assets/tension-page/shear-lag-both-legs.png",
  };

  /** Sheet2 `N3:N5` → `O3:O5` (matches `Tension Design`!`V28`). */
  var TENSION_CONNECTION_U = {
    FLANGE: 0.6,
    WEB: 0.6,
    "FLANGES & WEB": 1,
  };

  /** Excel `Tension Design`!`J13` default grade (`Table48`). */
  var EXCEL_TENSION_DESIGN_STEEL_GRADE = "A572 Gr. 65";

  /** Excel `NS -Tension Analysis` sample inputs (distinct from `Tension Design` defaults). */
  var EXCEL_NS_TENSION_ANALYSIS_STEEL_GRADE = "A992";

  /**
   * Last-resort grades when `SteelGradesService` / `Born2BeSteel` are still empty (e.g. `main.js` exited early
   * before `Born2BeSteel` assignment, or `steel-grades.json` fetch pending/failed). Matches `steel-grades.json` subset.
   */
  var TENSION_FALLBACK_STEEL_GRADES = [
    { astm: "A36", fy: 36, fu: 58, notes: "", imgGroup: "carbon" },
    { astm: "A992", fy: 50, fu: 65, notes: "", imgGroup: "wshape" },
    { astm: "A572 Gr. 42", fy: 42, fu: 60, notes: "", imgGroup: "plate" },
    { astm: "A572 Gr. 50", fy: 50, fu: 65, notes: "", imgGroup: "beam" },
    { astm: "A572 Gr. 55", fy: 55, fu: 70, notes: "", imgGroup: "heavy" },
    { astm: "A572 Gr. 60", fy: 60, fu: 75, notes: "", imgGroup: "bridge" },
    { astm: "A572 Gr. 65", fy: 65, fu: 80, notes: "", imgGroup: "heavy" },
    { astm: "A53 Gr. B", fy: 35, fu: 60, notes: "", imgGroup: "pipe" },
    { astm: "A500 Gr. B", fy: 42, fu: 58, notes: "", imgGroup: "hss" },
    { astm: "A500 Gr. C", fy: 46, fu: 62, notes: "", imgGroup: "hss" },
  ];

  /**
   * Same sections / order as Excel `Tension(Capacity and Demand )` Table6 (`tension-capacity-angles.json`).
   * Populated in `loadTensionCatalog`; falls back to single-angle AISC rows if the export is missing.
   */
  function tensionDesignAngleCatalog() {
    if (tensionCapacityAnglesOrdered.length) return tensionCapacityAnglesOrdered;
    return candidateSections.filter(function (s) {
      return nsTypeOfSection(s) === "L";
    });
  }

  /**
   * Excel `Tension(Capacity and Demand )`!`Q`: `'Tension Design'!$Z$17*'Tension Design'!$Z$13*[t]`.
   * (`Z17` gage lines × `Z13` bolt/hole dia × thickness — not multiplied by `Z15` fasteners/line.)
   */
  function excelDesignAholeIn2(gageLines, boltDiaIn, sectionThicknessIn) {
    var gz = Math.max(1, num(gageLines, 1));
    var d = num(boltDiaIn, 0);
    var t = num(sectionThicknessIn, 0);
    if (!Number.isFinite(d) || d <= 0 || !Number.isFinite(t) || t <= 0) return NaN;
    return gz * d * t;
  }

  var FALLBACK_ANGLE_SECTIONS = [
    { name: "L4X4X3/8", family: "ANGLE", Ag: 2.88, weightLbFt: null, rx: 1.2, ry: 0.79, rmin: 0.79, t: 0.375, xbar: 1.16, ybar: 1.16 },
    { name: "L5X5X1/2", family: "ANGLE", Ag: 4.75, weightLbFt: null, rx: 1.5, ry: 1.0, rmin: 1.0, t: 0.5, xbar: 1.4, ybar: 1.4 },
    { name: "L6X6X1/2", family: "ANGLE", Ag: 5.75, weightLbFt: null, rx: 1.75, ry: 1.16, rmin: 1.16, t: 0.5, xbar: 1.64, ybar: 1.64 },
    { name: "L6X6X3/4", family: "ANGLE", Ag: 8.32, weightLbFt: null, rx: 1.78, ry: 1.18, rmin: 1.18, t: 0.75, xbar: 1.73, ybar: 1.73 },
    { name: "L6X6X1", family: "ANGLE", Ag: 10.7, weightLbFt: null, rx: 1.8, ry: 1.2, rmin: 1.2, t: 1.0, xbar: 1.82, ybar: 1.82 },
    { name: "L8X6X3/4", family: "ANGLE", Ag: 10.2, weightLbFt: null, rx: 2.12, ry: 1.34, rmin: 1.34, t: 0.75, xbar: 2.1, ybar: 1.55 },
    { name: "L10X10X1", family: "ANGLE", Ag: 19.0, weightLbFt: null, rx: 3.13, ry: 3.13, rmin: 3.13, t: 1.0, xbar: 2.82, ybar: 2.82 },
    { name: "L10X10X1-1/8", family: "ANGLE", Ag: 21.2, weightLbFt: null, rx: 3.12, ry: 3.12, rmin: 3.12, t: 1.125, xbar: 2.88, ybar: 2.88 },
    { name: "L12X12X1-3/8", family: "ANGLE", Ag: 30.9, weightLbFt: null, rx: 3.74, ry: 3.74, rmin: 3.74, t: 1.375, xbar: 3.47, ybar: 3.47 },
  ];

  var candidateSections = FALLBACK_ANGLE_SECTIONS.slice();
  /** Excel capacity table order (row 12 first); drives slenderness row index and lightest-`MINIFS` tie-break. */
  var tensionCapacityAnglesOrdered = [];
  var currentNsShapeFilter = "all";
  var currentNsTypeFilter = "all";
  var nsMasterShapeOptions = ["all", "ANGLE", "W", "HSS", "CHANNEL", "TEE", "PIPE", "OTHER"];
  var nsMasterTypeOptions = ["all", "L", "2L"];

  function mapUiConnectionToExcelKey(val) {
    if (val === "FLANGE_WEB") return "FLANGES & WEB";
    return val || "WEB";
  }

  function loadTensionCatalog(done) {
    Promise.all([
      fetch("data/aisc-sections.json").then(function (r) {
        return r.ok ? r.json() : Promise.reject(new Error("bad aisc response"));
      }),
      fetch("data/tension-capacity-angles.json").then(function (r) {
        return r.ok ? r.json() : Promise.reject(new Error("bad angle response"));
      }).catch(function () {
        return { sections: [] };
      }),
    ])
      .then(function (allPayloads) {
        var aiscPayload = allPayloads[0] || {};
        var anglePayload = allPayloads[1] || {};
        var aiscRows = aiscPayload.sections || [];
        var angleRows = anglePayload.sections || [];
        if (!aiscRows.length) throw new Error("empty aisc catalog");

        var angleByName = {};
        angleRows.forEach(function (row) {
          var key = String(row.designation || "").toUpperCase().trim();
          if (!key) return;
          angleByName[key] = row;
        });

        tensionCapacityAnglesOrdered = angleRows
          .map(function (row) {
            var name = String(row.designation || "").trim();
            if (!name) return null;
            return {
              name: name,
              family: "ANGLE",
              type: "L",
              Ag: Number(row.Ag) || 0,
              weightLbFt: Number.isFinite(Number(row.weightLbFt)) ? Number(row.weightLbFt) : null,
              rx: Number(row.rx) || 0,
              ry: Number(row.ry) || 0,
              rmin: Number(row.rmin) || 0,
              t: Number(row.t) || 0,
              xbar: Number(row.xbar) || 0,
              ybar: Number(row.ybar) || 0,
            };
          })
          .filter(function (row) {
            return !!row;
          });

        candidateSections = aiscRows
          .map(function (row) {
            var type = String(row && row.type || "").toUpperCase().trim();
            var name = row.aiscManualLabel || row.designation;
            if (!name) return null;
            var fam = nsFamilyFromType(type);
            var key = String(name).toUpperCase().trim();
            var angleOverride = angleByName[key];
            var rxVal = Number(row.rx);
            var ryVal = Number(row.ry);
            var tFromAisc =
              row.t != null ? Number(row.t)
                : row.tw != null ? Number(row.tw)
                : row.tf != null ? Number(row.tf)
                : NaN;
            var tVal = angleOverride && Number.isFinite(Number(angleOverride.t))
              ? Number(angleOverride.t)
              : (Number.isFinite(tFromAisc) ? tFromAisc : 0);
            var xbarVal =
              angleOverride && Number.isFinite(Number(angleOverride.xbar)) ? Number(angleOverride.xbar) : 0;
            var ybarVal =
              angleOverride && Number.isFinite(Number(angleOverride.ybar)) ? Number(angleOverride.ybar) : 0;
            var rminVal = Math.min(
              Number.isFinite(rxVal) ? rxVal : Infinity,
              Number.isFinite(ryVal) ? ryVal : Infinity
            );
            if (!Number.isFinite(rminVal)) rminVal = 0;
            return {
              name: name,
              family: fam,
              type: type || "OTHER",
              Ag: Number(row.Ag) || 0,
              weightLbFt: Number.isFinite(Number(row.weightPlf)) ? Number(row.weightPlf) : null,
              rx: Number.isFinite(rxVal) ? rxVal : 0,
              ry: Number.isFinite(ryVal) ? ryVal : 0,
              rmin: rminVal,
              t: tVal,
              xbar: xbarVal,
              ybar: ybarVal,
            };
          })
          .filter(function (row) { return !!row; });
      })
      .catch(function () {
        candidateSections = FALLBACK_ANGLE_SECTIONS.slice();
        tensionCapacityAnglesOrdered = [];
      })
      .finally(function () {
        if (typeof done === "function") done();
      });
  }

  var currentStagShapeFilter = "all";
  var currentStagTypeFilter = "all";

  function sectionFamily(sec) {
    if (sec && sec.family) return sec.family;
    var n = (sec && sec.name ? String(sec.name) : "").toUpperCase();
    if (n.indexOf("HSS") === 0) return "HSS";
    if (/^W\d/.test(n)) return "W";
    if (n.indexOf("L") === 0) return "ANGLE";
    return "OTHER";
  }

  function nsTypeOfSection(sec) {
    if (sec && sec.type) {
      return String(sec.type).toUpperCase().trim();
    }
    var n = (sec && sec.name ? String(sec.name) : "").toUpperCase();
    if (n.indexOf("2L") === 0) return "2L";
    if (n.indexOf("L") === 0) return "L";
    if (n.indexOf("HSS") === 0) return "HSS";
    if (/^W\d/.test(n)) return "W";
    return "OTHER";
  }

  function nsFamilyFromType(typeVal) {
    var t = String(typeVal || "").toUpperCase().trim();
    if (!t) return "OTHER";
    if (t === "L" || t === "2L") return "ANGLE";
    if (t === "W" || t === "S" || t === "M" || t === "HP") return "W";
    if (t === "C" || t === "MC") return "CHANNEL";
    if (t === "WT" || t === "ST" || t === "MT") return "TEE";
    if (t.indexOf("HSS") === 0) return "HSS";
    if (t === "PIPE") return "PIPE";
    return "OTHER";
  }

  function hydrateNsMasterOptionsFromAiscDataset(done) {
    fetch("data/aisc-sections.json")
      .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error("bad response")); })
      .then(function (payload) {
        var rows = (payload && payload.sections) || [];
        if (!rows.length) return;
        var famSeen = { all: true };
        var typeSeen = { all: true };
        var famOut = ["all"];
        var typeOut = ["all"];
        rows.forEach(function (row) {
          var type = String(row && row.type || "").toUpperCase().trim();
          if (type && !typeSeen[type]) {
            typeSeen[type] = true;
            typeOut.push(type);
          }
          var fam = nsFamilyFromType(type);
          if (fam && !famSeen[fam]) {
            famSeen[fam] = true;
            famOut.push(fam);
          }
        });
        nsMasterTypeOptions = typeOut;
        nsMasterShapeOptions = famOut;
      })
      .catch(function () {})
      .finally(function () {
        if (typeof done === "function") done();
      });
  }

  function nsShapeOptionsFromData() {
    var seen = {};
    var out = ["all"];
    candidateSections.forEach(function (s) {
      var fam = sectionFamily(s);
      if (!fam || seen[fam]) return;
      seen[fam] = true;
      out.push(fam);
    });
    return out;
  }

  function nsTypeOptionsFromData() {
    var seen = {};
    var out = ["all"];
    candidateSections.forEach(function (s) {
      var typ = nsTypeOfSection(s);
      if (!typ || seen[typ]) return;
      seen[typ] = true;
      out.push(typ);
    });
    return out;
  }

  function nsFilteredSections() {
    return candidateSections.filter(function (s) {
      var fam = sectionFamily(s);
      var typ = nsTypeOfSection(s);
      var okShape = currentNsShapeFilter === "all" || fam === currentNsShapeFilter;
      var okType = currentNsTypeFilter === "all" || typ === currentNsTypeFilter;
      return okShape && okType;
    });
  }

  function renderNonStaggeredSelector() {
    if (!shapeSelect || !candidateSections.length) return;

    if (nsShapeIcons) {
      var shapeLabels = { all: "All", ANGLE: "L / ∠", W: "W", HSS: "HSS", OTHER: "Other" };
      var shapeButtons = nsMasterShapeOptions.map(function (id) {
        return { id: id, label: shapeLabels[id] || id };
      });
      if (!shapeButtons.some(function (b) { return b.id === currentNsShapeFilter; })) {
        currentNsShapeFilter = "all";
      }
      nsShapeIcons.innerHTML = "";
      shapeButtons.forEach(function (item) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "ns-chip-btn" + (currentNsShapeFilter === item.id ? " is-active" : "");
        b.textContent = item.label;
        b.addEventListener("click", function () {
          currentNsShapeFilter = item.id;
          renderNonStaggeredSelector();
          recomputeAll();
        });
        nsShapeIcons.appendChild(b);
      });
    }

    if (nsTypeChips) {
      var types = nsMasterTypeOptions.slice();
      if (!types.some(function (t) { return t === currentNsTypeFilter; })) {
        currentNsTypeFilter = "all";
      }
      nsTypeChips.innerHTML = "";
      types.forEach(function (t) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "ns-chip-btn" + (currentNsTypeFilter === t ? " is-active" : "");
        b.textContent = t === "all" ? "All" : t;
        b.addEventListener("click", function () {
          currentNsTypeFilter = t;
          renderNonStaggeredSelector();
          recomputeAll();
        });
        nsTypeChips.appendChild(b);
      });
    }

    var list = nsFilteredSections();
    // Strict UX guard: never show an empty AISC_Manual_Label list.
    // If a chosen shape/type combo has no rows in the current non-staggered dataset,
    // fall back to the full non-staggered section list instead of rendering blank.
    if (!list.length) list = candidateSections.slice();
    var preferred = shapeSelect.value || (list[0] && list[0].name) || "";
    shapeSelect.innerHTML = "";
    list.forEach(function (s) {
      var o = document.createElement("option");
      o.value = s.name;
      o.textContent = s.name;
      shapeSelect.appendChild(o);
    });
    var pick = preferred && list.some(function (s) { return s.name === preferred; }) ? preferred : (list[0] ? list[0].name : "");
    if (pick) shapeSelect.value = pick;

    if (nsAiscGrid) {
      nsAiscGrid.innerHTML = "";
      list.forEach(function (s) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "ns-aisc-btn" + (s.name === shapeSelect.value ? " is-active" : "");
        b.textContent = s.name;
        b.addEventListener("click", function () {
          shapeSelect.value = s.name;
          renderNonStaggeredSelector();
          recomputeAll();
        });
        nsAiscGrid.appendChild(b);
      });
    }
  }

  function isStaggeredAnalysisActive() {
    return !!(analysisCalcStag && analysisCalcStag.classList.contains("is-active"));
  }

  function getActiveShapeSelect() {
    if (isStaggeredAnalysisActive() && shapeSelectStag) return shapeSelectStag;
    return shapeSelect;
  }

  function syncShapeFromStagToNon() {
    if (!shapeSelect || !shapeSelectStag) return;
    shapeSelect.value = shapeSelectStag.value;
  }

  function syncShapeFromNonToStag() {
    rebuildStagShapeOptions({ prefer: shapeSelect && shapeSelect.value });
  }

  function effectiveLcIn() {
    if (isStaggeredAnalysisActive() && analysisStagUnsupportedLc) {
      return Math.max(0.0001, num(analysisStagUnsupportedLc.value, 1));
    }
    return unsupportedLc ? Math.max(0.0001, num(unsupportedLc.value, 1)) : 1;
  }

  function activePlateLengthIn(defaultLen) {
    if (isStaggeredAnalysisActive() && analysisStagPlateLengthIn) {
      var linkedLen = num(lengthFt && lengthFt.value, 0) * 12;
      return linkedLen > 0 ? linkedLen : defaultLen;
    }
    return plateLengthIn ? num(plateLengthIn.value, defaultLen) : defaultLen;
  }

  function activePlateThicknessIn() {
    if (isStaggeredAnalysisActive() && analysisStagPlateThickness) {
      return num(analysisStagPlateThickness.value, 0);
    }
    return plateThickness ? num(plateThickness.value, 0) : 0;
  }

  /** `S -Tension Analysis` plate gross: W50 = X41×X45 (length × thickness). Else section Ag (P29). */
  function activeGrossAreaForStaggerExcel() {
    var s = shapeData();
    var tP = activePlateThicknessIn();
    var lenP = activePlateLengthIn(0);
    if (tP > 0 && lenP > 0) return tP * lenP;
    return num(s.Ag, 0);
  }

  /**
   * Sheet2 connection U for Analysis stagger path (`XLOOKUP` N9:N11 → O9:O11).
   * Differs from Design sheet `TENSION_CONNECTION_U` (N3:N5).
   */
  var STAG_ANALYSIS_CONNECTION_U = {
    FLANGE: 0.896,
    WEB: 0.896,
    "FLANGES & WEB": 1,
  };
  var STAG_ANALYSIS_CASE2 = 0.896;

  function stagAnalysisConnU() {
    var key = mapUiConnectionToExcelKey(connectionSelect && connectionSelect.value);
    var u = STAG_ANALYSIS_CONNECTION_U[key];
    return u != null ? u : STAG_ANALYSIS_CONNECTION_U.WEB;
  }

  /** Sheet2 T3/T2 via `IF(K51=3,T3,T2)` on S -Tension Analysis. */
  function stagAnalysisCase8U() {
    var nf = Math.max(1, Math.round(num(fastenersPerLine.value, 3)));
    return nf === 3 ? 0.6 : 0.8;
  }

  function governingUStaggerAnalysis() {
    return Math.max(stagAnalysisConnU(), STAG_ANALYSIS_CASE2, stagAnalysisCase8U());
  }

  /**
   * `NS -Tension Analysis` fracture demand area uses AM16 = AM13×Q48 where Q48 =
   * XLOOKUP(connection, Sheet2!N9:N11, O9:O11). For angles, O9/O10 both evaluate to
   * MAX(N53, R53) with N53 = Case 2 chain (Sheet2 T4) and R53 = IF(K51=3,T3,T2).
   * FLANGES & WEB maps to O11 = 1.
   */
  function nsFractureEffectiveFactor(case2, case8) {
    if (!connectionSelect || connectionSelect.value === "FLANGE_WEB") return 1;
    return Math.max(case2, case8);
  }

  function updateStagFilterButtonVisibility() {
    var fams = nsMasterShapeOptions && nsMasterShapeOptions.length ? nsMasterShapeOptions.slice() : ["all", "ANGLE", "HSS", "W"];
    fams.forEach(function (fam) {
      if (fam === "all") return;
      var count = candidateSections.filter(function (s) {
        return sectionFamily(s) === fam;
      }).length;
      var btn = root.querySelector('#analysisCalcStag [data-stag-shape-filter="' + fam + '"]');
      if (btn) btn.style.display = count ? "" : "none";
    });
  }

  function rebuildStagShapeOptions(opts) {
    opts = opts || {};
    if (!shapeSelectStag) return;
    var shapeFilter = currentStagShapeFilter || "all";
    var typeFilter = currentStagTypeFilter || "all";
    var list = candidateSections.filter(function (s) {
      var fam = sectionFamily(s);
      var typ = nsTypeOfSection(s);
      var okShape = shapeFilter === "all" || fam === shapeFilter;
      var okType = typeFilter === "all" || typ === typeFilter;
      return okShape && okType;
    });
    if (!list.length) list = candidateSections.slice();
    var preferred = opts.prefer;
    if (preferred == null || preferred === "") {
      preferred = (shapeSelectStag && shapeSelectStag.value) || (shapeSelect && shapeSelect.value) || "";
    }
    shapeSelectStag.innerHTML = "";
    list.forEach(function (s) {
      var o = document.createElement("option");
      o.value = s.name;
      o.textContent = s.name;
      shapeSelectStag.appendChild(o);
    });
    var pick = preferred && list.some(function (x) { return x.name === preferred; }) ? preferred : list[0] ? list[0].name : "";
    if (pick) {
      shapeSelectStag.value = pick;
      if (shapeSelect) shapeSelect.value = pick;
    }

    if (stagAiscGrid) {
      stagAiscGrid.innerHTML = "";
      list.forEach(function (s) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "ns-aisc-btn" + (s.name === shapeSelectStag.value ? " is-active" : "");
        b.textContent = s.name;
        b.addEventListener("click", function () {
          shapeSelectStag.value = s.name;
          if (shapeSelect) shapeSelect.value = s.name;
          rebuildStagShapeOptions({ prefer: s.name });
          recomputeAll();
        });
        stagAiscGrid.appendChild(b);
      });
    }
  }

  function renderStagTypeChips() {
    var host = stagTypeChips;
    if (!host) return;
    host.innerHTML = "";
    var types = nsMasterTypeOptions && nsMasterTypeOptions.length ? nsMasterTypeOptions.slice() : ["all"];
    types.forEach(function (typ) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ns-chip-btn" + (currentStagTypeFilter === typ ? " is-active" : "");
      b.setAttribute("data-stag-type-filter", typ);
      b.textContent = typ === "all" ? "All" : typ;
      host.appendChild(b);
    });
  }

  function setStagShapeFilter(next, opts) {
    opts = opts || {};
    currentStagShapeFilter = next || "all";
    root.querySelectorAll("#analysisCalcStag .ns-chip-btn[data-stag-shape-filter]").forEach(function (el) {
      var f = el.getAttribute("data-stag-shape-filter");
      var on = f === currentStagShapeFilter || (currentStagShapeFilter === "all" && f === "all");
      el.classList.toggle("is-active", on);
    });
    var preserve =
      shapeSelectStag && shapeSelectStag.value ? shapeSelectStag.value : shapeSelect && shapeSelect.value;
    rebuildStagShapeOptions({ prefer: preserve });
    if (!opts.skipRecompute) recomputeAll();
  }

  function setStagTypeFilter(next, opts) {
    opts = opts || {};
    currentStagTypeFilter = next || "all";
    root.querySelectorAll("#analysisCalcStag .ns-chip-btn[data-stag-type-filter]").forEach(function (el) {
      var t = el.getAttribute("data-stag-type-filter");
      var on = t === currentStagTypeFilter || (currentStagTypeFilter === "all" && t === "all");
      el.classList.toggle("is-active", on);
    });
    var preserve =
      shapeSelectStag && shapeSelectStag.value ? shapeSelectStag.value : shapeSelect && shapeSelect.value;
    rebuildStagShapeOptions({ prefer: preserve });
    if (!opts.skipRecompute) recomputeAll();
  }

  function initStagSectionUi() {
    if (!shapeSelectStag) return;
    if (stagShapeIcons) {
      var shapeLabels = { all: "All", ANGLE: "L / ∠", W: "W", HSS: "HSS", OTHER: "Other" };
      stagShapeIcons.innerHTML = "";
      nsMasterShapeOptions.forEach(function (id) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "ns-chip-btn";
        b.setAttribute("data-stag-shape-filter", id);
        b.textContent = shapeLabels[id] || id;
        stagShapeIcons.appendChild(b);
      });
    }
    updateStagFilterButtonVisibility();
    renderStagTypeChips();
    root.querySelectorAll("#analysisCalcStag .ns-chip-btn[data-stag-shape-filter]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var f = btn.getAttribute("data-stag-shape-filter") || "all";
        setStagShapeFilter(f, { skipRecompute: false });
      });
    });
    root.querySelectorAll("#analysisCalcStag .ns-chip-btn[data-stag-type-filter]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var t = btn.getAttribute("data-stag-type-filter") || "all";
        setStagTypeFilter(t, { skipRecompute: false });
      });
    });
    shapeSelectStag.addEventListener("change", function () {
      syncShapeFromStagToNon();
      recomputeAll();
    });
    shapeSelectStag.addEventListener("input", function () {
      syncShapeFromStagToNon();
      recomputeAll();
    });
    currentStagShapeFilter = "all";
    currentStagTypeFilter = "all";
    root.querySelectorAll("#analysisCalcStag .ns-chip-btn[data-stag-shape-filter]").forEach(function (el) {
      var f = el.getAttribute("data-stag-shape-filter");
      el.classList.toggle("is-active", f === "all");
    });
    root.querySelectorAll("#analysisCalcStag .ns-chip-btn[data-stag-type-filter]").forEach(function (el) {
      var t = el.getAttribute("data-stag-type-filter");
      el.classList.toggle("is-active", t === "all");
    });
    rebuildStagShapeOptions({ prefer: shapeSelect && shapeSelect.value });
  }

  function num(v, fallback) {
    var n = Number(v);
    return Number.isFinite(n) ? n : fallback || 0;
  }
  function fmt(v, d) {
    return Number(v).toFixed(typeof d === "number" ? d : 4);
  }
  function clamp(v, lo, hi) {
    return Math.min(hi, Math.max(lo, v));
  }
  function tensionGradesList() {
    var fromSvc =
      window.SteelGradesService && typeof window.SteelGradesService.getGrades === "function"
        ? window.SteelGradesService.getGrades()
        : null;
    if (fromSvc && fromSvc.length) return fromSvc;
    var fromBorn = window.Born2BeSteel && window.Born2BeSteel.steelGrades;
    if (fromBorn && fromBorn.length) return fromBorn;
    return TENSION_FALLBACK_STEEL_GRADES;
  }

  function currentGrade() {
    var steel = tensionGradesList();
    if (!steel || !steel.length) return null;
    var key = steelSelect && steelSelect.value;
    var found = steel.find(function (g) { return g.astm === key; });
    return found || steel[0];
  }

  function syncSteelFields() {
    var g = currentGrade();
    if (!g || !fyInput || !fuInput) return;
    fyInput.value = fmt(g.fy, 0);
    fuInput.value = fmt(g.fu, 0);
    if (window.Born2BeSteel && typeof window.Born2BeSteel.setActiveMaterial === "function") {
      window.Born2BeSteel.setActiveMaterial(g.astm);
    }
  }

  function calcBoltDiameter() {
    if (!nominalDia || !boltType || !boltDiaOut) return NaN;
    var n = num(nominalDia.value, 0);
    var out = boltType.value === "BOLT" ? n + 0.125 : n + 0.0625;
    boltDiaOut.value = fmt(out, 3);
    return out;
  }

  function calcU() {
    var key = mapUiConnectionToExcelKey(connectionSelect && connectionSelect.value);
    var u = TENSION_CONNECTION_U[key];
    if (u == null) u = TENSION_CONNECTION_U.WEB;
    if (uOut) uOut.value = fmt(u, 2);
    return u;
  }

  /** Mirrors Tension Design sheet inputs used by `Tension(Capacity and Demand )` columns Q,R,S. */
  function getTensionCapacityDemandInputs() {
    var fy = num(fyInput.value, 0);
    var fu = num(fuInput.value, 0);
    var dl = num(dlInput.value, 0);
    var ll = num(llInput.value, 0);
    var method = methodSelect.value;
    var u = num(uOut.value, 0);
    if (!Number.isFinite(u) || u <= 0) u = calcU();
    var gov;
    if (method === "LRFD") {
      gov = Math.max(1.2 * dl + 1.6 * ll, 1.4 * dl);
    } else {
      gov = dl + ll;
    }
    var lenFt = num(lengthFt.value, 0);
    var rReq = lenFt * 12 / 300;
    var anReq;
    if (method === "LRFD") {
      anReq = fu > 0 && u > 0 ? gov / (0.75 * fu * u) : NaN;
    } else {
      /** ASD tensile rupture (Born2BeSteel / Excel Design sheet): required An = Ta·Ωt·U / Fu with Ωt = 2. */
      anReq = fu > 0 && u > 0 ? (gov * 2 * u) / fu : NaN;
    }
    var boltDia = num(boltDiaOut.value, 0);
    if (!Number.isFinite(boltDia) || boltDia <= 0) boltDia = calcBoltDiameter();
    var nGage = Math.max(1, num(gageLines.value, 1));
    return {
      fy: fy,
      fu: fu,
      method: method,
      u: u,
      gov: gov,
      rReq: rReq,
      anReq: anReq,
      boltDia: boltDia,
      nGage: nGage,
    };
  }

  /**
   * Excel `Tension(Capacity and Demand )` row **n** (sheet row 12 = first): column **S** uses
   * `'Tension Design'!P(n+26)` vs `rmin` (second argument of `AND` with `R<n><Ag`).
   * So table row index **i** (0-based, row 12 → i=0) references **`P(38+i)`**.
   * In this workbook **`P38`** = `J28*12/300` and **`P48`** = fracture **`An`** demand (`P48`); other **`P39`…`P47`, `P49`…** are blank → **0**.
   */
  function excelTensionDesignPForCapacityRowIndex(rowIndex0, rReq, anReq) {
    var pRow = 38 + rowIndex0;
    if (pRow === 38) return rReq;
    if (pRow === 48) return anReq;
    return 0;
  }

  function fmtCdDecimal(n) {
    if (!Number.isFinite(n)) return "--";
    var s = (Math.round(n * 1e6) / 1e6).toFixed(6).replace(/\.?0+$/, "");
    return s === "" ? "0" : s;
  }

  function fmtCdNumberLoose(n) {
    if (!Number.isFinite(n)) return "--";
    if (Math.abs(n - Math.round(n)) < 1e-7) return String(Math.round(n));
    return fmtCdDecimal(n);
  }

  function bindCdSheetScrollSync() {
    if (cdSheetScrollSynced) return;
    var host = byId("tensionViewAnalysisNon");
    if (!host) return;
    var frames = host.querySelectorAll(".cd-sheet-grid .cd-sheet-frame");
    if (frames.length < 2) return;
    var left = frames[0];
    var right = frames[1];
    var syncing = false;
    left.addEventListener("scroll", function () {
      if (syncing) return;
      syncing = true;
      right.scrollTop = left.scrollTop;
      syncing = false;
    });
    right.addEventListener("scroll", function () {
      if (syncing) return;
      syncing = true;
      left.scrollTop = right.scrollTop;
      syncing = false;
    });
    cdSheetScrollSynced = true;
  }

  function renderCapacityDemandSpreadsheet() {
    if (!cdCapacityTbody || !cdDemandTbody) return;
    var ins = getTensionCapacityDemandInputs();
    cdCapacityTbody.innerHTML = "";
    cdDemandTbody.innerHTML = "";
    var anglesOnly = tensionDesignAngleCatalog();
    if (!anglesOnly.length) return;

    var fragCap = document.createDocumentFragment();
    var fragDem = document.createDocumentFragment();

    anglesOnly.forEach(function (s, i) {
      var trC = document.createElement("tr");
      var rmin = s.rmin != null ? s.rmin : Math.min(s.rx, s.ry);
      var w = s.weightLbFt;
      trC.innerHTML =
        "<td class=\"cd-left\">" +
        s.name +
        "</td>" +
        "<td class=\"cd-num\">" +
        fmtCdNumberLoose(s.Ag) +
        "</td>" +
        "<td class=\"cd-num\">" +
        (w != null && Number.isFinite(w) ? fmtCdNumberLoose(w) : "--") +
        "</td>" +
        "<td class=\"cd-num\">" +
        fmtCdNumberLoose(s.t) +
        "</td>" +
        "<td class=\"cd-num\">" +
        fmtCdNumberLoose(s.rx) +
        "</td>" +
        "<td class=\"cd-num\">" +
        fmtCdNumberLoose(s.ry) +
        "</td>" +
        "<td class=\"cd-num\">" +
        fmtCdNumberLoose(rmin) +
        "</td>";
      fragCap.appendChild(trC);

      var ahole = excelDesignAholeIn2(ins.nGage, ins.boltDia, s.t);
      var rDemand = ahole + ins.anReq;
      var pSlendOrFrac = excelTensionDesignPForCapacityRowIndex(i, ins.rReq, ins.anReq);
      var okArea = Number.isFinite(ins.anReq) && rDemand < s.Ag;
      var okSl = Number.isFinite(pSlendOrFrac) && pSlendOrFrac < rmin;
      var safe = okArea && okSl;

      var trD = document.createElement("tr");
      var tdA = document.createElement("td");
      tdA.className = "cd-left";
      tdA.textContent = s.name;
      var tdNet = document.createElement("td");
      tdNet.className = "cd-num";
      tdNet.textContent = Number.isFinite(ahole) ? fmtCdDecimal(ahole) : "--";
      var tdAg = document.createElement("td");
      tdAg.className = "cd-num";
      tdAg.textContent = Number.isFinite(ins.anReq) ? fmtCdDecimal(rDemand) : "--";
      var tdRm = document.createElement("td");
      tdRm.textContent = Number.isFinite(ins.anReq) ? (safe ? "SAFE" : "UNSAFE") : "—";
      tdRm.className = Number.isFinite(ins.anReq) ? (safe ? "cd-remark-safe" : "cd-remark-unsafe") : "cd-remark-unknown";
      trD.appendChild(tdA);
      trD.appendChild(tdNet);
      trD.appendChild(tdAg);
      trD.appendChild(tdRm);
      fragDem.appendChild(trD);
    });

    cdCapacityTbody.appendChild(fragCap);
    cdDemandTbody.appendChild(fragDem);
    bindCdSheetScrollSync();
  }

  function mirrorDesignToAnalysis() {
    var g = currentGrade();
    if (analysisMethodMirror) analysisMethodMirror.value = methodSelect ? methodSelect.value : "";
    if (analysisSteelMirror) analysisSteelMirror.value = g ? g.astm : "";
    if (analysisFyMirror) analysisFyMirror.value = fyInput ? fyInput.value : "";
    if (analysisFuMirror) analysisFuMirror.value = fuInput ? fuInput.value : "";
    if (analysisDlMirror) analysisDlMirror.value = dlInput ? dlInput.value : "";
    if (analysisLlMirror) analysisLlMirror.value = llInput ? llInput.value : "";
    if (analysisLenMirror) analysisLenMirror.value = lengthFt ? lengthFt.value : "";
    if (analysisNomDiaMirror) analysisNomDiaMirror.value = nominalDia ? nominalDia.value : "";
    if (analysisBoltTypeMirror) analysisBoltTypeMirror.value = boltType ? boltType.value : "";
    if (analysisHoleDiaMirror) analysisHoleDiaMirror.value = boltDiaOut ? boltDiaOut.value : "";
    if (analysisFastMirror) analysisFastMirror.value = fastenersPerLine ? fastenersPerLine.value : "";
    if (analysisGageMirror) analysisGageMirror.value = gageLines ? gageLines.value : "";
    if (analysisStagMethodMirror) analysisStagMethodMirror.value = analysisMethodMirror ? analysisMethodMirror.value : "";
    if (analysisStagSteelMirror) analysisStagSteelMirror.value = analysisSteelMirror ? analysisSteelMirror.value : "";
    if (analysisStagFyMirror) analysisStagFyMirror.value = analysisFyMirror ? analysisFyMirror.value : "";
    if (analysisStagFuMirror) analysisStagFuMirror.value = analysisFuMirror ? analysisFuMirror.value : "";
    if (analysisStagDlMirror) analysisStagDlMirror.value = analysisDlMirror ? analysisDlMirror.value : "";
    if (analysisStagLlMirror) analysisStagLlMirror.value = analysisLlMirror ? analysisLlMirror.value : "";
    if (analysisStagLenMirror) analysisStagLenMirror.value = analysisLenMirror ? analysisLenMirror.value : "";
    if (analysisStagNomDiaMirror) analysisStagNomDiaMirror.value = analysisNomDiaMirror ? analysisNomDiaMirror.value : "";
    if (analysisStagBoltTypeMirror) analysisStagBoltTypeMirror.value = analysisBoltTypeMirror ? analysisBoltTypeMirror.value : "";
    if (analysisStagHoleDiaMirror) analysisStagHoleDiaMirror.value = analysisHoleDiaMirror ? analysisHoleDiaMirror.value : "";
    if (analysisStagFastMirror) analysisStagFastMirror.value = analysisFastMirror ? analysisFastMirror.value : "";
    if (analysisStagGageMirror) analysisStagGageMirror.value = analysisGageMirror ? analysisGageMirror.value : "";
  }

  /**
   * One-time defaults when opening **Analysis Calculator** (`NS -Tension Analysis`), matching workbook snapshot:
   * LRFD, A992, DL 20 / LL 80 / length 12 ft, nominal bolt Ø 7/8 in, BOLT (+1/8), 6 fasteners × 2 gage lines,
   * FLANGES & WEB, Lc 10 in, block shear 9 / 3 & 7.5 / 2.5, uniform tension stress, plate t = 0, shape L8×4×1.
   * @returns {boolean} false if section catalog not ready (caller may retry on next navigation).
   */
  function applyExcelNsAnalysisCalculatorDefaults() {
    if (!candidateSections || !candidateSections.length) return false;

    if (methodSelect) methodSelect.value = "LRFD";
    if (analysisMethodMirror) analysisMethodMirror.value = "LRFD";

    var grades = window.Born2BeSteel && window.Born2BeSteel.steelGrades;
    var gNs = grades && grades.find(function (g) { return g.astm === EXCEL_NS_TENSION_ANALYSIS_STEEL_GRADE; });
    if (steelSelect && gNs) {
      steelSelect.value = gNs.astm;
      syncSteelFields();
    }
    if (analysisSteelMirror && gNs) analysisSteelMirror.value = gNs.astm;
    if (analysisStagSteelMirror && gNs) analysisStagSteelMirror.value = gNs.astm;

    if (dlInput) dlInput.value = "20";
    if (llInput) llInput.value = "80";
    if (lengthFt) lengthFt.value = "12";

    if (nominalDia) nominalDia.value = "0.875";
    if (boltType) boltType.value = "BOLT";

    if (fastenersPerLine) fastenersPerLine.value = "6";
    if (gageLines) gageLines.value = "2";

    if (connectionSelect) connectionSelect.value = "FLANGE_WEB";
    if (tensionNonStagConnectionSelect) tensionNonStagConnectionSelect.value = "FLANGE_WEB";
    if (tensionStagConnectionSelect) tensionStagConnectionSelect.value = "FLANGE_WEB";

    if (unsupportedLc) unsupportedLc.value = "10";
    if (analysisStagUnsupportedLc) analysisStagUnsupportedLc.value = "10";

    if (analysisBsLt) analysisBsLt.value = "9";
    if (analysisBsNt) analysisBsNt.value = "3";
    if (analysisBsLv) analysisBsLv.value = "7.5";
    if (analysisBsNv) analysisBsNv.value = "2.5";
    if (analysisStagBsLt && analysisBsLt) analysisStagBsLt.value = analysisBsLt.value;
    if (analysisStagBsNt && analysisBsNt) analysisStagBsNt.value = analysisBsNt.value;
    if (analysisStagBsLv && analysisBsLv) analysisStagBsLv.value = analysisBsLv.value;
    if (analysisStagBsNv && analysisBsNv) analysisStagBsNv.value = analysisBsNv.value;

    if (stressType) stressType.value = "1";
    if (analysisStagStressType) analysisStagStressType.value = "1";

    if (plateThickness) plateThickness.value = "0";
    /** Stagger sheet plate `X45` stays independent; first visit to **Staggered** applies `S -Tension Analysis` thickness via `applyExcelStaggerAnalysisCalculatorDefaults`. */

    function normShapeName(s) {
      return String(s || "")
        .toUpperCase()
        .replace(/\s+/g, "")
        .replace(/\u00d7/g, "X")
        .replace(/×/g, "X");
    }
    var pick = candidateSections.find(function (s) {
      return normShapeName(s.name) === "L8X4X1";
    });
    if (shapeSelect && pick) {
      shapeSelect.value = pick.name;
      renderNonStaggeredSelector();
      rebuildStagShapeOptions({ prefer: pick.name });
    }

    calcBoltDiameter();
    mirrorDesignToAnalysis();
    return true;
  }

  /**
   * First-time defaults for **`S -Tension Analysis`** (Excel snapshot): Q41 FLANGE, K41 3/4 in, K51 6, K53 2,
   * AZ40 NON-UNIFORM, AC40/AG40/AK40 = 1 / 1.5 / 1.5, plate **X45 = 5** on stagger card only (`analysisStagPlateThickness`).
   */
  function applyExcelStaggerAnalysisCalculatorDefaults() {
    if (!candidateSections || !candidateSections.length) return false;

    if (connectionSelect) connectionSelect.value = "FLANGE";
    if (tensionNonStagConnectionSelect) tensionNonStagConnectionSelect.value = "FLANGE";
    if (tensionStagConnectionSelect) tensionStagConnectionSelect.value = "FLANGE";

    if (nominalDia) nominalDia.value = "0.75";
    if (boltType) boltType.value = "BOLT";

    if (analysisStagPlateThickness) analysisStagPlateThickness.value = "5";

    if (stressType) stressType.value = "0.5";
    if (analysisStagStressType) analysisStagStressType.value = "0.5";

    if (sg1) sg1.value = "1";
    if (g1) g1.value = "1.5";
    if (g2) g2.value = "1.5";

    if (fastenersPerLine) fastenersPerLine.value = "6";
    if (gageLines) gageLines.value = "2";

    calcBoltDiameter();
    mirrorDesignToAnalysis();
    return true;
  }

  /**
   * Design Calculator ASD defaults (Born2BeSteel Design workbook behavior shown in UI reference): A572 Gr. 65, ASD,
   * DL/LL/length and bolt layout as below, connection WEB (U = 0.6). Yields Ta = 255 kips, fracture demand rows and
   * lightest safe L5×5×7/16 when formulas match calcDemandAndAreas / getTensionCapacityDemandInputs.
   */
  function applyExcelTensionDesignCalculatorDefaults() {
    if (!candidateSections || !candidateSections.length) return false;

    if (methodSelect) methodSelect.value = "ASD";
    if (analysisMethodMirror) analysisMethodMirror.value = "ASD";

    var grades = tensionGradesList();
    var gTd = grades && grades.find(function (g) { return g.astm === EXCEL_TENSION_DESIGN_STEEL_GRADE; });
    if (steelSelect && gTd) {
      steelSelect.value = gTd.astm;
      syncSteelFields();
    }
    if (analysisSteelMirror && gTd) analysisSteelMirror.value = gTd.astm;
    if (analysisStagSteelMirror && gTd) analysisStagSteelMirror.value = gTd.astm;

    if (dlInput) dlInput.value = "115";
    if (llInput) llInput.value = "140";
    if (lengthFt) lengthFt.value = "12.02";

    if (nominalDia) nominalDia.value = "0.75";
    if (boltType) boltType.value = "BOLT";

    if (fastenersPerLine) fastenersPerLine.value = "3";
    if (gageLines) gageLines.value = "1";

    if (connectionSelect) connectionSelect.value = "WEB";
    if (tensionNonStagConnectionSelect) tensionNonStagConnectionSelect.value = "WEB";
    if (tensionStagConnectionSelect) tensionStagConnectionSelect.value = "WEB";

    calcBoltDiameter();
    mirrorDesignToAnalysis();
    return true;
  }

  function calcDemandAndAreas() {
    if (
      !methodSelect ||
      !demandEq1 ||
      !demandEq2 ||
      !demandGov ||
      !minROut ||
      !agYieldOut ||
      !anFractureOut ||
      !agFractureOut
    ) {
      return { gov: NaN, reqAg: NaN };
    }

    var fy = num(fyInput && fyInput.value, 0);
    var fu = num(fuInput && fuInput.value, 0);
    var dl = num(dlInput && dlInput.value, 0);
    var ll = num(llInput && llInput.value, 0);
    var method = methodSelect.value || "ASD";
    var u = calcU();
    var tLoad1;
    var tLoad2;
    var gov;

    if (method === "LRFD") {
      if (demandEq1Label) demandEq1Label.textContent = "Tu = 1.2DL + 1.6LL";
      if (demandEq2Label) demandEq2Label.textContent = "Wu = 1.4DL";
      if (demandGovLabel) demandGovLabel.textContent = "Tu";
      tLoad1 = 1.2 * dl + 1.6 * ll;
      tLoad2 = 1.4 * dl;
      gov = Math.max(tLoad1, tLoad2);
    } else {
      if (demandEq1Label) demandEq1Label.textContent = "Ta=DL+LL";
      if (demandEq2Label) demandEq2Label.textContent = "-";
      if (demandGovLabel) demandGovLabel.textContent = "Ta";
      tLoad1 = dl + ll;
      tLoad2 = 0;
      gov = tLoad1;
    }
    demandEq1.value = fmt(tLoad1, 3);
    demandEq2.value = method === "LRFD" ? fmt(tLoad2, 3) : "-";
    demandGov.value = fmt(gov, 3);

    var lenFt = num(lengthFt && lengthFt.value, 0);
    var rReq = lenFt * 12 / 300;
    minROut.value = fmt(rReq, 4);

    var agYieldDisplay;
    var anFracture;
    if (method === "LRFD") {
      agYieldDisplay = fy > 0 ? gov / (0.9 * fy) : NaN;
      anFracture = fu > 0 && u > 0 ? gov / (0.75 * fu * u) : NaN;
    } else {
      agYieldDisplay = fu > 0 && u > 0 ? (gov * 1.67 * u) / fu : NaN;
      /** ASD: required An = Ta·Ωt·U / Fu (Ωt = 2), matching Design Calculator fracture row + MINIFS scan. */
      anFracture = fu > 0 && u > 0 ? (gov * 2 * u) / fu : NaN;
    }
    agYieldOut.value = Number.isFinite(agYieldDisplay) ? fmt(agYieldDisplay, 4) : "--";
    anFractureOut.value = Number.isFinite(anFracture) ? fmt(anFracture, 4) : "--";
    var agFractureDisplay = Number.isFinite(anFracture) ? anFracture / 0.85 : NaN;
    agFractureOut.value = Number.isFinite(agFractureDisplay) ? fmt(agFractureDisplay, 4) : "--";

    var boltDia = num(boltDiaOut && boltDiaOut.value, 0);
    if (!Number.isFinite(boltDia) || boltDia <= 0) boltDia = calcBoltDiameter();
    var nGage = Math.max(1, num(gageLines && gageLines.value, 1));
    var anReq = anFracture;

    var anglesForDesign = tensionDesignAngleCatalog();

    function rowSafe(s, idxInAngleTable) {
      if (!Number.isFinite(anReq) || !Number.isFinite(rReq) || !s) return false;
      var ahole = excelDesignAholeIn2(nGage, boltDia, s.t);
      var bigR = ahole + anReq;
      var rmin = s.rmin != null ? s.rmin : Math.min(s.rx, s.ry);
      var pSecond = excelTensionDesignPForCapacityRowIndex(idxInAngleTable, rReq, anReq);
      return bigR < s.Ag && pSecond < rmin;
    }

    var picked = null;
    for (var si = 0; si < anglesForDesign.length; si++) {
      var cand = anglesForDesign[si];
      if (!rowSafe(cand, si)) continue;
      if (!picked || cand.Ag < picked.Ag - 1e-9) picked = cand;
    }

    if (!picked || !anglesForDesign.length) {
      if (safeSectionOut) {
        if ("value" in safeSectionOut) safeSectionOut.value = "--";
        safeSectionOut.textContent = "--";
      }
      if (designSectionPreview) designSectionPreview.value = "--";
      if (safeAgOut) safeAgOut.value = "--";
      if (safeRemarkOut) {
        safeRemarkOut.value = "NO SAFE SECTION";
        if (safeRemarkOut.classList) {
          safeRemarkOut.classList.toggle("is-safe", false);
          safeRemarkOut.classList.toggle("is-unsafe", true);
        }
      }
      dbg("post-fix", "H_non_comp", "tension-page-ui.js:calcDemandAndAreas", "Design demand / Excel tension capacity scan", {
        method: method,
        gov: gov,
        u: u,
        rReq: rReq,
        anReq: anReq,
        pick: null,
      });
      return { gov: gov, reqAg: NaN };
    }

    if (safeSectionOut) {
      if ("value" in safeSectionOut) safeSectionOut.value = picked.name;
      safeSectionOut.textContent = picked.name;
    }
    if (designSectionPreview) designSectionPreview.value = picked.name;
    if (designSectionSelect) designSectionSelect.value = picked.name;
    if (safeAgOut) safeAgOut.value = fmt(picked.Ag, 2);
    if (safeRemarkOut) {
      safeRemarkOut.value = "SAFE";
      if (safeRemarkOut.classList) {
        safeRemarkOut.classList.toggle("is-safe", true);
        safeRemarkOut.classList.toggle("is-unsafe", false);
      }
    }
    dbg("post-fix", "H_non_comp", "tension-page-ui.js:calcDemandAndAreas", "Design demand / Excel tension capacity scan", {
      method: method,
      dl: dl,
      ll: ll,
      gov: gov,
      u: u,
      rReq: rReq,
      anReq: anReq,
      minSafeAg: picked.Ag,
      pickedSection: picked.name,
      pickedAg: picked.Ag,
    });

    return { gov: gov, reqAg: picked.Ag };
  }

  function populateShapes() {
    if (!shapeSelect || !candidateSections.length) return;
    currentNsShapeFilter = "all";
    currentNsTypeFilter = "all";
    shapeSelect.innerHTML = "";
    var first = candidateSections[0] ? candidateSections[0].name : "";
    if (first) shapeSelect.value = first;
    if (designSectionSelect) {
      var designAngles = tensionDesignAngleCatalog();
      designSectionSelect.innerHTML = "";
      designAngles.forEach(function (s) {
        var opt = document.createElement("option");
        opt.value = s.name;
        opt.textContent = s.name;
        designSectionSelect.appendChild(opt);
      });
      designSectionSelect.value = designAngles[0] ? designAngles[0].name : first || "";
    }
    renderNonStaggeredSelector();
    rebuildStagShapeOptions({ prefer: shapeSelect.value });
  }

  function shapeData() {
    var sel = getActiveShapeSelect();
    var val = sel && sel.value ? sel.value : shapeSelect && shapeSelect.value;
    var found = candidateSections.find(function (s) { return s.name === val; }) || candidateSections[0];
    // #region agent log
    dbg("pre-fix", "H_sec", "tension-page-ui.js:shapeData", "Active shape select", {
      staggeredActive: isStaggeredAnalysisActive(),
      selectId: sel ? sel.id : null,
      value: val
    });
    // #endregion
    return found;
  }

  function calcNonStaggered() {
    var s = shapeData();
    shapeAg.value = fmt(s.Ag, 3);
    shapeRx.value = fmt(s.rx, 3);
    shapeRy.value = fmt(s.ry, 3);
    shapeT.value = fmt(s.t, 3);
    shapeX.value = fmt(s.xbar, 3);
    shapeY.value = fmt(s.ybar, 3);
    if (shapeAgStag) shapeAgStag.value = shapeAg.value;
    if (shapeRxStag) shapeRxStag.value = shapeRx.value;
    if (shapeRyStag) shapeRyStag.value = shapeRy.value;
    if (shapeTStag) shapeTStag.value = shapeT.value;
    if (shapeXStag) shapeXStag.value = shapeX.value;
    if (shapeYStag) shapeYStag.value = shapeY.value;

    var lengthIn = num(lengthFt.value, 0) * 12;
    var plateLen = activePlateLengthIn(lengthIn);
    lengthInOut.value = fmt(plateLen, 3);
    var tPlate = activePlateThicknessIn();
    /** `NS -Tension Analysis` / `S -Tension Analysis`: W50 = X41×X45 (plate length × thickness). */
    var agPlate = tPlate > 0 && plateLen > 0 ? tPlate * plateLen : 0;
    plateAg.value = fmt(agPlate, 3);
    if (analysisStagPlateLengthIn) {
      analysisStagPlateLengthIn.value = fmt(lengthIn, 3);
    }
    if (analysisStagPlateAg) analysisStagPlateAg.value = fmt(agPlate, 3);
    if (analysisStagLengthIn) analysisStagLengthIn.value = lengthInOut.value;
    // #region agent log
    dbg("post-fix", "H_plate", "tension-page-ui.js:calcNonStaggered", "Staggered plate card values", {
      stagActive: isStaggeredAnalysisActive(),
      plateLen: plateLen,
      plateThickness: tPlate,
      plateAg: agPlate
    });
    // #endregion

    var case1 = 1;
    var lc = effectiveLcIn();
    var case2;
    var case8;
    var uGov;
    if (isStaggeredAnalysisActive()) {
      case2 = STAG_ANALYSIS_CASE2;
      case8 = stagAnalysisCase8U();
      uGov = governingUStaggerAnalysis();
    } else {
      case2 = Math.max(0, 1 - s.xbar / lc);
      case8 = stagAnalysisCase8U();
      uGov = connectionSelect.value === "FLANGE_WEB" ? 1 : Math.max(case2, case8);
    }
    case1Out.value = fmt(case1, 3);
    case2Out.value = fmt(case2, 4);
    case8Out.value = fmt(case8, 4);
    uGovOut.value = fmt(uGov, 4);
    if (analysisStagCase1) analysisStagCase1.value = fmt(case1, 4);
    if (analysisStagCase2) analysisStagCase2.value = fmt(case2, 4);
    if (analysisStagCase8) analysisStagCase8.value = fmt(case8, 4);
    if (analysisStagUGov) analysisStagUGov.value = fmt(uGov, 4);

    var fy = num(fyInput.value, 0);
    var fu = num(fuInput.value, 0);
    var stressFactor = num(stressType.value, 1);
    var agUse = isStaggeredAnalysisActive()
      ? activeGrossAreaForStaggerExcel()
      : agPlate > 0
        ? agPlate
        : s.Ag;
    var dh = num(calcBoltDiameter(), 0);
    var nHolesNet = Math.max(1, num(gageLines.value, 1));
    var anUse;
    var aeUse;
    if (isStaggeredAnalysisActive()) {
      var critNetStag = criticalAn ? num(criticalAn.value, NaN) : NaN;
      var uConnFrac = stagAnalysisConnU();
      var bc15Excel = Number.isFinite(critNetStag) ? critNetStag * uConnFrac : NaN;
      anUse = Number.isFinite(critNetStag) ? Math.max(1e-6, critNetStag) : 0.0001;
      aeUse = Number.isFinite(bc15Excel) ? Math.max(1e-6, bc15Excel) : 0.0001;
    } else {
      anUse = Math.max(0.0001, agUse - nHolesNet * dh * s.t);
      var q48Ns = nsFractureEffectiveFactor(case2, case8);
      aeUse = Math.max(0.0001, anUse * q48Ns);
    }

    if (analysisNetAn) analysisNetAn.value = fmt(anUse, 3);
    if (analysisAe) analysisAe.value = fmt(aeUse, 3);

    var method = methodSelect.value;
    var demand = num(demandGov.value, 0);
    var phiY = 0.9;
    var phiR = 0.75;
    var omegaY = 1.67;
    var omegaR = 2.0;
    var yieldCap = method === "LRFD" ? phiY * fy * agUse : (fy * agUse) / omegaY;
    /**
     * Fracture: NS `AI25` = φ×Fu×`AM16`; stagger `AX25` = φ×Fu×`BC15` (`BC15`=`AH52`×`Q48`).
     * Excel does **not** apply tension stress-type (`AZ40`) to fracture — only block shear uses UNIFORM / NON-UNIFORM.
     */
    var fracCap =
      method === "LRFD"
        ? phiR * fu * aeUse
        : (fu * aeUse) / omegaR;
    var critAnForStag = criticalAn ? num(criticalAn.value, NaN) : NaN;
    var uConnStag = stagAnalysisConnU();
    var aeStaggeredDemand = Number.isFinite(critAnForStag)
      ? Math.max(1e-6, critAnForStag * uConnStag)
      : aeUse;
    if (analysisStagAeDemand) analysisStagAeDemand.value = fmt(aeStaggeredDemand, 3);
    var fracCapStagPanel =
      method === "LRFD"
        ? phiR * fu * aeStaggeredDemand
        : (fu * aeStaggeredDemand) / omegaR;
    if (analysisYieldLabel) analysisYieldLabel.textContent = method === "LRFD" ? "Tu" : "Ta";
    if (analysisFracLabel) analysisFracLabel.textContent = method === "LRFD" ? "Tu" : "Ta";
    if (analysisYieldCap) analysisYieldCap.value = fmt(yieldCap, 3);
    if (analysisFracCap) analysisFracCap.value = fmt(fracCap, 3);
    if (analysisStagYieldLabel) analysisStagYieldLabel.textContent = method === "LRFD" ? "Tu = " : "Ta = ";
    if (analysisStagFracLabel) analysisStagFracLabel.textContent = method === "LRFD" ? "Tu = " : "Ta = ";
    if (analysisStagYieldCap) analysisStagYieldCap.value = fmt(yieldCap, 3);
    if (analysisStagFracCap) analysisStagFracCap.value = fmt(fracCapStagPanel, 3);

    // Demand panel mirrors design demand equations
    if (analysisDemand1Label) analysisDemand1Label.textContent = demandEq1Label ? demandEq1Label.textContent : "Tu";
    if (analysisDemand2Label) analysisDemand2Label.textContent = demandEq2Label ? demandEq2Label.textContent : "-";
    if (analysisDemandGovLabel) analysisDemandGovLabel.textContent = demandGovLabel ? demandGovLabel.textContent : (method === "LRFD" ? "Tu" : "Ta");
    if (analysisDemand1) analysisDemand1.value = demandEq1 ? demandEq1.value : fmt(0, 3);
    if (analysisDemand2) analysisDemand2.value = demandEq2 ? demandEq2.value : "-";
    if (analysisDemandGov) analysisDemandGov.value = demandGov ? demandGov.value : fmt(demand, 3);
    if (analysisStagDemand1Label) analysisStagDemand1Label.textContent = analysisDemand1Label ? analysisDemand1Label.textContent : (method === "LRFD" ? "Tu = 1.2DL + 1.6LL" : "Ta = DL + LL");
    if (analysisStagDemand2Label) analysisStagDemand2Label.textContent = analysisDemand2Label ? analysisDemand2Label.textContent : (method === "LRFD" ? "Wu = 1.4DL" : "-");
    if (analysisStagDemandGovLabel) analysisStagDemandGovLabel.textContent = analysisDemandGovLabel ? analysisDemandGovLabel.textContent : (method === "LRFD" ? "Tu" : "Ta");
    if (analysisStagDemand1) analysisStagDemand1.value = analysisDemand1 ? analysisDemand1.value : fmt(0, 3);
    if (analysisStagDemand2) analysisStagDemand2.value = analysisDemand2 ? analysisDemand2.value : "-";
    if (analysisStagDemandGov) analysisStagDemandGov.value = analysisDemandGov ? analysisDemandGov.value : fmt(demand, 3);

    // Block shear — non-stagger: legacy rn1/rn2 path; stagger: `S -Tension Analysis` AQ50 / AS52
    var lt = analysisBsLt ? num(analysisBsLt.value, 0) : 0;
    var lv = analysisBsLv ? num(analysisBsLv.value, 0) : 0;
    var nt = analysisBsNt ? Math.max(0, num(analysisBsNt.value, 0)) : 0;
    var nv = analysisBsNv ? Math.max(0, num(analysisBsNv.value, 0)) : 0;
    var tUse = s.t;
    var agt = Math.max(0, lt * tUse);
    var avg = Math.max(0, lv * tUse);
    var ant = Math.max(0.0001, agt - nt * dh * tUse);
    var avn = Math.max(0.0001, avg - nv * dh * tUse);
    if (analysisBsAgt) analysisBsAgt.value = fmt(agt, 3);
    if (analysisBsAvg) analysisBsAvg.value = fmt(avg, 3);
    if (analysisBsAnt) analysisBsAnt.value = fmt(ant, 3);
    if (analysisBsAvn) analysisBsAvn.value = fmt(avn, 3);
    if (analysisStagBsLt) analysisStagBsLt.value = fmt(lt, 3);
    if (analysisStagBsNt) analysisStagBsNt.value = Number.isInteger(nt) ? String(nt) : fmt(nt, 4).replace(/\.?0+$/, "");
    if (analysisStagBsLv) analysisStagBsLv.value = fmt(lv, 3);
    if (analysisStagBsNv)
      analysisStagBsNv.value = Number.isInteger(nv) ? String(nv) : fmt(nv, 4).replace(/\.?0+$/, "");
    if (analysisStagBsAgt) analysisStagBsAgt.value = fmt(agt, 3);
    if (analysisStagBsAnt) analysisStagBsAnt.value = fmt(ant, 3);
    if (analysisStagBsAvg) analysisStagBsAvg.value = fmt(avg, 3);
    if (analysisStagBsAvn) analysisStagBsAvn.value = fmt(avn, 3);

    var phiBs = 0.75;
    var omegaBs = 2.0;
    var bsCap;
    var bsFt = NaN;
    var bsF1v = NaN;
    var bsF2v = NaN;
    var bsTn = NaN;
    var bsLrfd = NaN;
    var bsAsd = NaN;
    if (isStaggeredAnalysisActive()) {
      var aq40 = avg;
      var aq46 = Math.max(1e-6, aq40 - nv * dh * tUse);
      var aw50 = 0.6 * fu * aq46;
      var bc50Bs = 0.6 * fy * aq40;
      var tensCoeff = num(stressType.value, 1);
      var ax43 = tensCoeff * agt * fu;
      var aq50 = Math.min(aw50, bc50Bs) + ax43;
      bsFt = ax43;
      bsF1v = aw50;
      bsF2v = bc50Bs;
      bsTn = aq50;
      bsLrfd = phiBs * aq50;
      bsAsd = aq50 / omegaBs;
      bsCap = method === "LRFD" ? bsLrfd : bsAsd;
    } else {
      var tensCoeffNs = num(stressType.value, 1);
      /** `NS -Tension Analysis` AC50 = MIN(AH50, AN50) + AI43 (tension rupture uses gross Agt×Fu×coeff). */
      var ah50Ns = 0.6 * fu * avn;
      var an50Ns = 0.6 * fy * avg;
      var ai43Ns = tensCoeffNs * agt * fu;
      var ac50Ns = Math.min(ah50Ns, an50Ns) + ai43Ns;
      bsFt = ai43Ns;
      bsF1v = ah50Ns;
      bsF2v = an50Ns;
      bsTn = ac50Ns;
      bsLrfd = phiBs * ac50Ns;
      bsAsd = ac50Ns / omegaBs;
      bsCap = method === "LRFD" ? bsLrfd : bsAsd;
    }
    if (analysisBlockShearCap) analysisBlockShearCap.value = fmt(bsCap, 3);
    if (analysisStagBlockShearCap) analysisStagBlockShearCap.value = fmt(bsCap, 3);
    if (analysisStagBsFt) analysisStagBsFt.value = fmt(bsFt, 3);
    if (analysisStagBsF1v) analysisStagBsF1v.value = fmt(bsF1v, 3);
    if (analysisStagBsF2v) analysisStagBsF2v.value = fmt(bsF2v, 3);
    if (analysisStagBsTn) analysisStagBsTn.value = fmt(bsTn, 3);
    if (analysisStagBsLrfdTu) analysisStagBsLrfdTu.value = fmt(bsLrfd, 3);
    if (analysisStagBsAsdTa) analysisStagBsAsdTa.value = fmt(bsAsd, 3);
    if (analysisStagStressType && stressType) {
      analysisStagStressType.value = stressType.value;
    }

    var govCap = Math.min(yieldCap, fracCap, bsCap);
    /** `NS -Tension Analysis`!`AO57`: `IF(AH56>AF17,"SAFE!","UNSAFE :<")` — strict **greater than**. */
    var isSafe = demand > 0 && govCap > demand;
    if (analysisGovEqLabelNon) analysisGovEqLabelNon.textContent = method === "LRFD" ? "Tu =" : "Ta =";
    if (analysisGoverningDisplay) analysisGoverningDisplay.textContent = demand === 0 ? "--" : fmt(govCap, 3);
    if (analysisSafetyStatus) {
      analysisSafetyStatus.textContent = demand === 0 ? "--" : isSafe ? "SAFE!" : "UNSAFE :<";
      if (demand === 0) {
        analysisSafetyStatus.classList.remove("is-safe", "is-unsafe");
      } else {
        analysisSafetyStatus.classList.toggle("is-safe", isSafe);
        analysisSafetyStatus.classList.toggle("is-unsafe", !isSafe);
      }
    }

    // Staggered governing uses same fracture basis as the panel (fracCapStagPanel / aeStaggeredDemand).
    var govCapStag = Math.min(yieldCap, fracCapStagPanel, bsCap);
    var safeStag = demand > 0 && govCapStag > demand;
    if (analysisStagGovEqLabel) analysisStagGovEqLabel.textContent = method === "LRFD" ? "Tu =" : "Ta =";
    if (analysisGoverningDisplayStag) analysisGoverningDisplayStag.textContent = demand === 0 ? "--" : fmt(govCapStag, 3);
    if (analysisSafetyStatusStag) {
      analysisSafetyStatusStag.textContent = demand === 0 ? "--" : (safeStag ? "SAFE!" : "UNSAFE :<");
      if (demand === 0) {
        analysisSafetyStatusStag.classList.remove("is-safe", "is-unsafe");
      } else {
        analysisSafetyStatusStag.classList.toggle("is-safe", safeStag);
        analysisSafetyStatusStag.classList.toggle("is-unsafe", !safeStag);
      }
    }
    // #region agent log
    dbg("post-fix", "H_non_comp", "tension-page-ui.js:calcNonStaggered", "Non-staggered computation flow consistency", {
      plateLen: plateLen,
      plateThickness: tPlate,
      plateAg: agPlate,
      plateLogicOk: tPlate > 0 ? Math.abs(agPlate - tPlate * plateLen) < 1e-6 : agPlate === 0,
      case1: case1,
      case2: case2,
      case8: case8,
      uGov: uGov,
      anUse: anUse,
      aeUse: aeUse,
      stressFactor: stressFactor,
      yieldCap: yieldCap,
      fracCap: fracCap,
      bsCap: bsCap,
      govCap: govCap,
      govCapIsMin: Math.abs(govCap - Math.min(yieldCap, fracCap, bsCap)) < 1e-9,
      demand: demand,
      safe: isSafe,
      safeRuleOk: demand > 0 ? isSafe === (govCap > demand) : true,
      nonFiniteDetected: [plateLen, tPlate, agPlate, case1, case2, case8, uGov, anUse, aeUse, yieldCap, fracCap, bsCap, govCap, demand].some(function (v) { return !Number.isFinite(v); })
    });
    // #endregion
  }

  /**
   * `Tension(Capacity…)` / `S -Tension Analysis` stagger paths AC51, AC53, AC55 → AH52 = MIN(...).
   * See workbook formulas on `S -Tension Analysis` (LET/XLOOKUP alongside `Tension-pivot`).
   */
  function calcStaggered() {
    var s = shapeData();
    var activeAg = activeGrossAreaForStaggerExcel();
    var dHole = num(calcBoltDiameter(), 0);
    var t = num(s.t, s.t);
    var sg1Val = num(sg1.value, 0);
    var g1Val = num(g1.value, 0);
    var g2Raw = g2 ? g2.value : "";
    var g2Blank =
      g2Raw === "" || g2Raw === null || (typeof g2Raw === "string" && String(g2Raw).trim() === "");
    var g2Val = g2Blank ? 0 : num(g2.value, 0);

    var ac51 = NaN;
    if (Number.isFinite(activeAg) && dHole > 0 && t > 0) {
      ac51 = g2Blank ? activeAg - 1 * dHole * t : activeAg - 2 * dHole * t;
    }

    var ac53 = NaN;
    if (Number.isFinite(activeAg) && dHole > 0 && t > 0 && g1Val > 0) {
      ac53 = activeAg - 2 * dHole * t + (sg1Val * sg1Val * t) / (4 * g1Val);
    }

    var ac55 = NaN;
    if (
      Number.isFinite(activeAg) &&
      dHole > 0 &&
      t > 0 &&
      g1Val > 0 &&
      g2Val > 0 &&
      !g2Blank
    ) {
      ac55 =
        activeAg -
        3 * dHole * t +
        (sg1Val * sg1Val * t) / (4 * g1Val) +
        (sg1Val * sg1Val * t) / (4 * g2Val);
    }

    var candidates = [ac51, ac53, ac55].filter(function (x) {
      return Number.isFinite(x);
    });
    var crit = candidates.length ? Math.min.apply(null, candidates) : NaN;

    if (path1) path1.value = Number.isFinite(ac51) ? fmt(ac51, 4) : "--";
    if (path2) path2.value = Number.isFinite(ac53) ? fmt(ac53, 4) : "--";
    if (path3) path3.value = Number.isFinite(ac55) ? fmt(ac55, 4) : "--";
    if (criticalAn) criticalAn.value = Number.isFinite(crit) ? fmt(crit, 4) : "--";
    if (analysisStagCriticalAn)
      analysisStagCriticalAn.value = Number.isFinite(crit) ? fmt(crit, 4) : "--";

    var uConn = stagAnalysisConnU();
    if (analysisStagAe && Number.isFinite(crit)) {
      analysisStagAe.value = fmt(Math.max(1e-6, crit * uConn), 4);
    } else if (analysisStagAe) {
      analysisStagAe.value = "--";
    }
  }

  function renderConnectionImage() {
    if (!connImage) return;
    var key = connectionSelect && connectionSelect.value ? connectionSelect.value : "WEB";
    var src =
      (SHEAR_LAG_CONNECTION_IMAGES && SHEAR_LAG_CONNECTION_IMAGES[key]) ||
      SHEAR_LAG_CONNECTION_IMAGES.WEB;
    // #region agent log
    dbg("post-fix", "H_conn_img", "tension-page-ui.js:renderConnectionImage", "Connection image mapping snapshot", {
      selectedConnection: key,
      clientAsset: src
    });
    // #endregion
    connImage.onerror = function () {
      connImage.onerror = null;
      connImage.src = shearLagAngleConnectionSvgDataUrl(key);
    };
    connImage.alt =
      key === "FLANGE"
        ? "Single angle: horizontal leg (flange) bearing — x̄ perpendicular to faying surface"
        : key === "FLANGE_WEB"
          ? "Single angle: both legs fastened — U = 1.0"
          : "Single angle: vertical leg (web) to gusset — x̄ from connection plane to centroid";
    connImage.src = src;
  }

  function recomputeAll() {
    if (tensionNonStagConnectionSelect && connectionSelect) {
      tensionNonStagConnectionSelect.value = connectionSelect.value;
    }
    if (tensionStagConnectionSelect && connectionSelect) {
      tensionStagConnectionSelect.value = connectionSelect.value;
    }
    syncSteelFields();
    calcBoltDiameter();
    calcU();
    calcDemandAndAreas();
    mirrorDesignToAnalysis();
    renderConnectionImage();
    calcStaggered();
    calcNonStaggered();
    renderCapacityDemandSpreadsheet();
    enforceRequestedVisualLocks();
    enforceNonStaggeredFieldModes();
    enforceStaggeredFieldModes();
    // #region agent log
    dbg("post-fix", "H5", "tension-page-ui.js:recomputeAll", "Post-fix recompute heartbeat", {
      activeTopView: (function () {
        var activeBtn = root.querySelector(".tension-tab.is-active");
        return activeBtn ? activeBtn.getAttribute("data-tension-view") : null;
      })(),
      activeAnalysisMode: (function () {
        var activeMode = root.querySelector(".tension-subtab.is-active");
        return activeMode ? activeMode.getAttribute("data-tension-analysis-mode") : null;
      })()
    });
    var stag = byId("analysisCalcStag");
    if (ENABLE_TENSION_DEBUG_TELEMETRY && stag && stag.classList.contains("is-active") && window.requestAnimationFrame) {
      window.requestAnimationFrame(function () {
        logStaggeredLayoutSnapshot("post-fix");
      });
    }
    var non = byId("analysisCalcNon");
    if (ENABLE_TENSION_DEBUG_TELEMETRY && non && non.classList.contains("is-active") && window.requestAnimationFrame) {
      window.requestAnimationFrame(function () {
        logNonStaggeredLayoutSnapshot("post-fix");
      });
    }
    // #region agent log
    (function () {
      if (!ENABLE_TENSION_DEBUG_TELEMETRY) return;
      var activeTop = root.querySelector(".tension-tab.is-active");
      if (!activeTop || activeTop.getAttribute("data-tension-view") !== "design") return;
      var panel = byId("tensionSection");
      var view = byId("tensionViewDesign");
      var card = panel ? panel.querySelector(".cd-view-card") : null;
      var demandCard = view ? view.querySelector(".design-demand-card") : null;
      var safeCard = view ? view.querySelector(".safe-section-card") : null;
      var disclaimerCard = view ? view.querySelector(".disclaimer-card") : null;
      if (!view || !panel) return;
      function rect(el) {
        if (!el || !el.getBoundingClientRect) return null;
        var r = el.getBoundingClientRect();
        return { top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height) };
      }
      var vr = rect(view);
      var cr = rect(card);
      var pr = rect(panel);
      dbg("post-fix", "H_design_bottom", "tension-page-ui.js:recomputeAll", "Design view bottom visibility snapshot", {
        viewRect: vr,
        cardRect: cr,
        panelRect: pr,
        viewOverflow: window.getComputedStyle ? window.getComputedStyle(view).overflow : null,
        viewOverflowY: window.getComputedStyle ? window.getComputedStyle(view).overflowY : null,
        panelScrollH: panel.scrollHeight,
        panelClientH: panel.clientHeight,
        viewScrollH: view.scrollHeight,
        viewClientH: view.clientHeight,
        cardToViewBottomPx: cr && vr ? cr.bottom - vr.bottom : null,
        viewToPanelBottomPx: vr && pr ? vr.bottom - pr.bottom : null,
        demandRect: rect(demandCard),
        safeRect: rect(safeCard),
        disclaimerRect: rect(disclaimerCard),
        demandStyles: demandCard && window.getComputedStyle ? {
          minHeight: window.getComputedStyle(demandCard).minHeight,
          height: window.getComputedStyle(demandCard).height,
          overflow: window.getComputedStyle(demandCard).overflow
        } : null,
        safeStyles: safeCard && window.getComputedStyle ? {
          minHeight: window.getComputedStyle(safeCard).minHeight,
          height: window.getComputedStyle(safeCard).height,
          overflow: window.getComputedStyle(safeCard).overflow
        } : null,
        disclaimerStyles: disclaimerCard && window.getComputedStyle ? {
          minHeight: window.getComputedStyle(disclaimerCard).minHeight,
          height: window.getComputedStyle(disclaimerCard).height,
          overflow: window.getComputedStyle(disclaimerCard).overflow
        } : null,
        safeVsDemandBottomDeltaPx: (rect(safeCard) && vr) ? (rect(safeCard).bottom - rect(demandCard).bottom) : null,
        disclaimerVsDemandBottomDeltaPx: (rect(disclaimerCard) && rect(demandCard)) ? (rect(disclaimerCard).bottom - rect(demandCard).bottom) : null
      });
    })();
    // #endregion
    // #endregion
  }

  // #region agent log
  function logStaggeredLayoutSnapshot(runId) {
    if (!ENABLE_TENSION_DEBUG_TELEMETRY) return;
    var stagRoot = byId("analysisCalcStag");
    // #region agent log
    var yfMiniProbe = stagRoot ? stagRoot.querySelector(".analysis-stag-center .analysis-mini-grid") : null;
    dbg(runId, "H8", "tension-page-ui.js:logStaggeredLayoutSnapshot", "Staggered snapshot gate", {
      hasRoot: !!stagRoot,
      subviewActive: stagRoot ? stagRoot.classList.contains("is-active") : false,
      miniGridCols: yfMiniProbe && window.getComputedStyle ? window.getComputedStyle(yfMiniProbe).gridTemplateColumns : null
    });
    // #endregion
    if (!stagRoot || !stagRoot.classList.contains("is-active")) return;

    function rect(el) {
      if (!el || !el.getBoundingClientRect) return null;
      var r = el.getBoundingClientRect();
      return {
        x: Math.round(r.x),
        y: Math.round(r.y),
        w: Math.round(r.width),
        h: Math.round(r.height),
        right: Math.round(r.right),
        bottom: Math.round(r.bottom)
      };
    }
    function css(el, key) {
      if (!el || !window.getComputedStyle) return null;
      return window.getComputedStyle(el)[key];
    }

    var grid = stagRoot.querySelector(".analysis-grid");
    var inputCol = stagRoot.querySelector(".analysis-stag-input");
    var leftCol = stagRoot.querySelector(".analysis-stag-left");
    var centerCol = stagRoot.querySelector(".analysis-stag-center");
    var rightCol = stagRoot.querySelector(".analysis-stag-right");
    var image = stagRoot.querySelector(".analysis-stag-combined-image");
    var blockShear = stagRoot.querySelector(".analysis-block-shear");
    var blockRows = blockShear ? blockShear.querySelectorAll(".t-row") : [];
    var situationCards = stagRoot.querySelectorAll(".analysis-situation-card");
    (function () {
      var stack = stagRoot.querySelector(".analysis-stag-stack");
      var card = stagRoot.closest(".analysis-calculator-card");
      var cw = card ? card.getBoundingClientRect().width : 0;
      dbg(runId, "H_fit", "tension-page-ui.js:logStaggeredLayoutSnapshot", "Panel width vs stack (100vw bug check)", {
        innerWidth: window.innerWidth,
        cardW: card ? Math.round(cw) : null,
        stackClientW: stack ? stack.clientWidth : null,
        stackScrollW: stack ? stack.scrollWidth : null,
        gridClientW: grid ? grid.clientWidth : null,
        gridScrollW: grid ? grid.scrollWidth : null,
        stackOverflowPx: stack ? stack.scrollWidth - stack.clientWidth : null
      });
    })();
    (function () {
      var sec = stagRoot ? stagRoot.querySelector(".analysis-stag-section-card") : null;
      var bs = stagRoot ? stagRoot.querySelector(".analysis-block-shear") : null;
      var sit = stagRoot ? stagRoot.querySelector(".analysis-stag-center") : null;
      dbg(runId, "H_compact", "tension-page-ui.js:logStaggeredLayoutSnapshot", "Card heights (content-hug check)", {
        sectionCardH: sec ? Math.round(sec.getBoundingClientRect().height) : null,
        blockShearH: bs ? Math.round(bs.getBoundingClientRect().height) : null,
        situationGridCols: sit && window.getComputedStyle ? window.getComputedStyle(sit).gridTemplateColumns : null,
        situationDisplay: sit && window.getComputedStyle ? window.getComputedStyle(sit).display : null
      });
    })();

    dbg(runId, "H1", "tension-page-ui.js:logStaggeredLayoutSnapshot", "Grid/column proportions", { viewport: { w: window.innerWidth, h: window.innerHeight }, gridRect: rect(grid), gridCols: css(grid, "gridTemplateColumns"), inputRect: rect(inputCol), situationRect: rect(leftCol), centerRect: rect(centerCol), rightRect: rect(rightCol) });
    dbg(runId, "H2", "tension-page-ui.js:logStaggeredLayoutSnapshot", "Situation image structure", { situationCards: situationCards.length, imageRect: rect(image), imageHeight: css(image, "height"), imageObjectFit: css(image, "objectFit") });
    (function () {
      var imgs = stagRoot.querySelectorAll(".analysis-situation-card .analysis-stag-combined-image, .analysis-situation-card .analysis-stag-situation-image");
      var figs = stagRoot.querySelectorAll(".analysis-situation-card .analysis-stag-situation-figure");
      var c0 = situationCards[0] ? rect(situationCards[0]) : null;
      var c1 = situationCards[1] ? rect(situationCards[1]) : null;
      var i0 = imgs[0] ? rect(imgs[0]) : null;
      var i1 = imgs[1] ? rect(imgs[1]) : null;
      var f0 = figs[0] ? rect(figs[0]) : null;
      var f1 = figs[1] ? rect(figs[1]) : null;
      dbg(runId, "H_imgfill", "tension-page-ui.js:logStaggeredLayoutSnapshot", "Situation image fill check", {
        card0H: c0 ? c0.h : null,
        card1H: c1 ? c1.h : null,
        image0H: i0 ? i0.h : null,
        image1H: i1 ? i1.h : null,
        figure0H: f0 ? f0.h : null,
        figure1H: f1 ? f1.h : null,
        image0Src: imgs[0] ? imgs[0].getAttribute("src") : null,
        image1Src: imgs[1] ? imgs[1].getAttribute("src") : null,
        figureMode: figs.length ? "background-sprite" : "img-tag"
      });
    })();
    (function () {
      var br = rect(blockShear);
      var rr = rect(rightCol);
      var overhangPx = br && rr ? br.right - rr.right : null;
      dbg(runId, "H6", "tension-page-ui.js:logStaggeredLayoutSnapshot", "Block shear vs right column edges", { blockRect: br, rightColRect: rr, blockRightOverhangPx: overhangPx });
    })();
    (function () {
      var yfMini = stagRoot.querySelector(".analysis-stag-right .analysis-mini-grid");
      var yfCards = yfMini ? yfMini.querySelectorAll(".tension-card") : [];
      var c0 = yfCards[0] ? rect(yfCards[0]) : null;
      var c1 = yfCards[1] ? rect(yfCards[1]) : null;
      var shearMini = stagRoot.querySelector(".analysis-stag-input .analysis-mini-grid");
      var sRows = shearMini ? shearMini.querySelectorAll(".t-row") : [];
      var s0 = sRows[0] ? rect(sRows[0]) : null;
      var s1 = sRows[1] ? rect(sRows[1]) : null;
      dbg(runId, "H7", "tension-page-ui.js:logStaggeredLayoutSnapshot", "Mini-grid gutters (yield/fracture + shear lag)", {
        yieldGutterPx: c0 && c1 ? c1.x - c0.right : null,
        shearLagGutterPx: s0 && s1 ? s1.x - s0.right : null,
        yieldCard0w: c0 ? c0.w : null,
        yieldCard1w: c1 ? c1.w : null
      });
    })();
    (function () {
      var sitStack = stagRoot.querySelector(".analysis-stag-center");
      var demandCard = stagRoot.querySelector(".analysis-stag-right .analysis-stag-demand-ae .tension-card");
      var blockCard = stagRoot.querySelector(".analysis-stag-right .analysis-block-shear");
      var pathCard = stagRoot.querySelector(".analysis-stag-pathing-card");
      var plateCard = stagRoot.querySelector(".analysis-stag-plates-card");
      var guideCard = stagRoot.querySelector(".analysis-stag-user-guide-inline");
      var govCard = stagRoot.querySelector(".analysis-governing-stag-inline");
      var detailsCard = stagRoot.querySelector(".analysis-stag-right .analysis-stag-details-card");
      dbg(runId, "H_swap", "tension-page-ui.js:logStaggeredLayoutSnapshot", "Position swap check (situation vs demand)", {
        situationParent: sitStack ? sitStack.className : null,
        demandParent: demandCard && demandCard.parentElement ? demandCard.parentElement.className : null,
        pathParent: pathCard && pathCard.parentElement ? pathCard.parentElement.className : null,
        plateParent: plateCard && plateCard.parentElement ? plateCard.parentElement.className : null,
        situationTop: sitStack ? Math.round(sitStack.getBoundingClientRect().top) : null,
        demandTop: demandCard ? Math.round(demandCard.getBoundingClientRect().top) : null,
        pathTop: pathCard ? Math.round(pathCard.getBoundingClientRect().top) : null,
        plateTop: plateCard ? Math.round(plateCard.getBoundingClientRect().top) : null,
        guideTop: guideCard ? Math.round(guideCard.getBoundingClientRect().top) : null,
        govTop: govCard ? Math.round(govCard.getBoundingClientRect().top) : null,
        blockTop: blockCard ? Math.round(blockCard.getBoundingClientRect().top) : null,
        demandBelowBlock: demandCard && blockCard ? demandCard.getBoundingClientRect().top >= blockCard.getBoundingClientRect().bottom - 1 : null,
        pathBelowSection: pathCard && pathCard.previousElementSibling ? pathCard.previousElementSibling.classList.contains("analysis-stag-section-card") : null,
        plateBelowPathing: plateCard && pathCard ? plateCard.getBoundingClientRect().top >= pathCard.getBoundingClientRect().bottom - 1 : null,
        guideBelowSituation2: guideCard && sitStack ? guideCard.getBoundingClientRect().top >= sitStack.getBoundingClientRect().bottom - 1 : null,
        govBelowStaggeredDetails: govCard && detailsCard ? govCard.getBoundingClientRect().top >= detailsCard.getBoundingClientRect().bottom - 1 : null
      });
    })();
    (function () {
      var shearInput = stagRoot.querySelector(".analysis-stag-shear-card .t-row input");
      var plateInput = stagRoot.querySelector(".analysis-stag-plates-card .t-row input");
      var s = rect(shearInput);
      var p = rect(plateInput);
      dbg(runId, "H_align", "tension-page-ui.js:logStaggeredLayoutSnapshot", "Shear Lag vs For Plates input alignment", {
        shearInputRect: s,
        plateInputRect: p,
        alignedLeftPx: s && p ? s.x - p.x : null,
        alignedWidthPx: s && p ? s.w - p.w : null
      });
    })();
    // #region agent log
    (function () {
      var shearRows = stagRoot.querySelectorAll(".analysis-stag-shear-card .t-row");
      var rowMetrics = [];
      for (var i = 0; i < shearRows.length; i++) {
        var row = shearRows[i];
        var label = row.querySelector("span");
        var input = row.querySelector("input,select");
        var ir = rect(input);
        rowMetrics.push({
          idx: i,
          label: label ? label.textContent : null,
          inputX: ir ? ir.x : null,
          inputW: ir ? ir.w : null,
          labelClientW: label ? Math.round(label.clientWidth) : null,
          labelScrollW: label ? Math.round(label.scrollWidth) : null,
          labelClipped: label ? label.scrollWidth > label.clientWidth + 1 : null
        });
      }
      dbg(runId, "H_shear_rows", "tension-page-ui.js:logStaggeredLayoutSnapshot", "Shear Lag row-by-row alignment", {
        rowCount: shearRows.length,
        rows: rowMetrics
      });
    })();
    // #endregion
    // #region agent log
    (function () {
      var shearCard = stagRoot.querySelector(".analysis-stag-shear-card");
      var plateCard = stagRoot.querySelector(".analysis-stag-plates-card");
      var pathCard = stagRoot.querySelector(".analysis-stag-pathing-card");
      var leftColumn = stagRoot.querySelector(".analysis-stag-left");
      var guideCard = stagRoot.querySelector(".analysis-stag-user-guide-inline");
      var govCard = stagRoot.querySelector(".analysis-governing-stag-inline");
      var govValue = stagRoot.querySelector(".analysis-governing-stag-inline .stag-excel-value");
      var govStatus = stagRoot.querySelector(".analysis-governing-stag-inline .stag-excel-status");
      var sr = rect(shearCard);
      var pr = rect(plateCard);
      var par = rect(pathCard);
      var lr = rect(leftColumn);
      var gr = rect(guideCard);
      var grv = rect(govCard);
      dbg(runId, "H_bottom_band", "tension-page-ui.js:logStaggeredLayoutSnapshot", "Bottom band card alignment (shear/plates/guide)", {
        shear: sr,
        shearStyles: shearCard && window.getComputedStyle ? {
          borderTop: window.getComputedStyle(shearCard).borderTop,
          borderRight: window.getComputedStyle(shearCard).borderRight,
          borderBottom: window.getComputedStyle(shearCard).borderBottom,
          borderLeft: window.getComputedStyle(shearCard).borderLeft,
          borderRadius: window.getComputedStyle(shearCard).borderRadius,
          boxShadow: window.getComputedStyle(shearCard).boxShadow,
          background: window.getComputedStyle(shearCard).backgroundColor
        } : null,
        pathing: par,
        plates: pr,
        leftColumn: lr,
        guide: gr,
        governing: grv,
        pathingMinusPlatesGapPx: par && pr ? pr.y - par.bottom : null,
        leftColumnBottomGapPx: lr && pr ? lr.bottom - pr.bottom : null,
        shearMinusPlatesBottomPx: sr && pr ? sr.bottom - pr.bottom : null,
        platesMinusGuideBottomPx: pr && gr ? pr.bottom - gr.bottom : null,
        shearMinusGuideBottomPx: sr && gr ? sr.bottom - gr.bottom : null,
        guideMinusGovTopPx: gr && grv ? gr.bottom - grv.y : null,
        govValueFontSize: govValue && window.getComputedStyle ? window.getComputedStyle(govValue).fontSize : null,
        govStatusFontSize: govStatus && window.getComputedStyle ? window.getComputedStyle(govStatus).fontSize : null
      });
    })();
    // #endregion
    dbg(runId, "H3", "tension-page-ui.js:logStaggeredLayoutSnapshot", "Block shear content density", { blockShearRows: blockRows.length, blockRect: rect(blockShear), blockHeader: blockShear ? blockShear.querySelector("h4") ? blockShear.querySelector("h4").textContent : null : null });
    dbg(runId, "H4", "tension-page-ui.js:logStaggeredLayoutSnapshot", "Card density and row sizing", { cardCount: stagRoot.querySelectorAll(".tension-card").length, rowCount: stagRoot.querySelectorAll(".t-row").length, rowInputHeight: css(stagRoot.querySelector(".t-row input"), "height"), rowFontSize: css(stagRoot.querySelector(".t-row"), "fontSize") });
    // #region agent log
    (function () {
      var shearCard = stagRoot.querySelector(".analysis-stag-shear-card");
      var platesCard = stagRoot.querySelector(".analysis-stag-plates-card");
      var pathingCard = stagRoot.querySelector(".analysis-stag-pathing-card");
      var guideCard = stagRoot.querySelector(".analysis-stag-user-guide-inline");
      var situation1 = stagRoot.querySelector(".analysis-stag-center .analysis-stag-situations");
      var sr = rect(shearCard);
      var pr = rect(platesCard);
      var par = rect(pathingCard);
      var gr = rect(guideCard);
      var s1 = rect(situation1);
      fetch('http://127.0.0.1:7885/ingest/0499c47d-70cd-429d-a2ae-82b51e1ec3cb',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'9c1ad2'},body:JSON.stringify({sessionId:'9c1ad2',runId:runId,hypothesisId:'H_STAG_ALIGN',location:'tension-page-ui.js:logStaggeredLayoutSnapshot',message:'Staggered card line alignment snapshot',data:{shearCard:sr,platesCard:pr,pathingCard:par,guideCard:gr,situation1:s1,shearMinHeight:shearCard && window.getComputedStyle ? window.getComputedStyle(shearCard).minHeight : null,platesMinHeight:platesCard && window.getComputedStyle ? window.getComputedStyle(platesCard).minHeight : null,shearMarginTop:shearCard && window.getComputedStyle ? window.getComputedStyle(shearCard).marginTop : null,shearInlineStyleMargin:shearCard ? shearCard.style.margin : null,platesMarginTop:platesCard && window.getComputedStyle ? window.getComputedStyle(platesCard).marginTop : null,shearBorder:shearCard && window.getComputedStyle ? window.getComputedStyle(shearCard).border : null,shearOutline:shearCard && window.getComputedStyle ? window.getComputedStyle(shearCard).outline : null,s1MarginBottom:situation1 && window.getComputedStyle ? window.getComputedStyle(situation1).marginBottom : null,shearMinusPlatesBottomPx:sr && pr ? sr.bottom - pr.bottom : null,pathingMinusPlatesTopGapPx:par && pr ? pr.y - par.bottom : null,platesMinusGuideBottomPx:pr && gr ? pr.bottom - gr.bottom : null},timestamp:Date.now()})}).catch(()=>{});
    })();
    // #endregion
    // #region agent log
    (function () {
      var shearCard = stagRoot.querySelector(".analysis-stag-shear-card");
      var platesCard = stagRoot.querySelector(".analysis-stag-plates-card");
      var shearHead = shearCard ? shearCard.querySelector("h4") : null;
      var plateHead = platesCard ? platesCard.querySelector("h4") : null;
      var shearRows = shearCard ? shearCard.querySelectorAll(".t-row") : [];
      var plateRows = platesCard ? platesCard.querySelectorAll(".t-row") : [];
      function sumHeights(rows) {
        var t = 0;
        for (var i = 0; i < rows.length; i++) t += Math.round(rows[i].getBoundingClientRect().height);
        return t;
      }
      fetch('http://127.0.0.1:7885/ingest/0499c47d-70cd-429d-a2ae-82b51e1ec3cb',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'9c1ad2'},body:JSON.stringify({sessionId:'9c1ad2',runId:runId,hypothesisId:'H_STAG_INTERNAL',location:'tension-page-ui.js:logStaggeredLayoutSnapshot',message:'Internal spacing breakdown (shear vs plates)',data:{shearCardH:shearCard ? Math.round(shearCard.getBoundingClientRect().height) : null,platesCardH:platesCard ? Math.round(platesCard.getBoundingClientRect().height) : null,shearHeadH:shearHead ? Math.round(shearHead.getBoundingClientRect().height) : null,plateHeadH:plateHead ? Math.round(plateHead.getBoundingClientRect().height) : null,shearRowsCount:shearRows.length,plateRowsCount:plateRows.length,shearRowsTotalH:sumHeights(shearRows),plateRowsTotalH:sumHeights(plateRows),shearPaddingTop:shearCard && window.getComputedStyle ? window.getComputedStyle(shearCard).paddingTop : null,shearPaddingBottom:shearCard && window.getComputedStyle ? window.getComputedStyle(shearCard).paddingBottom : null,platePaddingTop:platesCard && window.getComputedStyle ? window.getComputedStyle(platesCard).paddingTop : null,platePaddingBottom:platesCard && window.getComputedStyle ? window.getComputedStyle(platesCard).paddingBottom : null},timestamp:Date.now()})}).catch(()=>{});
    })();
    // #endregion
  }
  // #endregion

  // #region agent log
  function logNonStaggeredLayoutSnapshot(runId) {
    if (!ENABLE_TENSION_DEBUG_TELEMETRY) return;
    var nonRoot = byId("analysisCalcNon");
    if (!nonRoot || !nonRoot.classList.contains("is-active")) return;
    function rect(el) {
      if (!el || !el.getBoundingClientRect) return null;
      var r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), right: Math.round(r.right), bottom: Math.round(r.bottom) };
    }
    var boltCard = nonRoot.querySelector(".analysis-col-left > .tension-card:last-child");
    var guide = nonRoot.querySelector(".bolt-guide-legend");
    var platesCard = nonRoot.querySelector(".analysis-for-plates");
    var plateInstructions = nonRoot.querySelector(".analysis-for-plates .plate-instructions");
    var blockShearCard = nonRoot.querySelector(".analysis-block-shear");
    var blockRows = nonRoot.querySelectorAll(".analysis-block-shear .t-row");
    var governing = nonRoot.querySelector(".analysis-governing");
    var br = rect(boltCard);
    var gr = rect(guide);
    var pr = rect(platesCard);
    var pir = rect(plateInstructions);
    var bsr = rect(blockShearCard);
    var gor = rect(governing);
    dbg(runId, "H_non_space", "tension-page-ui.js:logNonStaggeredLayoutSnapshot", "Non-staggered spacing snapshot (bolt/plates/blockshear)", {
      boltCard: br,
      boltGuide: gr,
      forPlatesCard: pr,
      plateInstructions: pir,
      blockShearCard: bsr,
      governingCard: gor,
      blockShearRowCount: blockRows.length,
      boltGuideGapBottomPx: br && gr ? br.bottom - gr.bottom : null,
      plateInstructionsGapBottomPx: pr && pir ? pr.bottom - pir.bottom : null,
      blockShearGapToGovPx: bsr && gor ? gor.y - bsr.bottom : null
    });
    // #region agent log
    fetch('http://127.0.0.1:7885/ingest/0499c47d-70cd-429d-a2ae-82b51e1ec3cb',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'9c1ad2'},body:JSON.stringify({sessionId:'9c1ad2',runId:runId,hypothesisId:'H_NS1',location:'tension-page-ui.js:logNonStaggeredLayoutSnapshot',message:'Check fixed min-height values on legend and instructions',data:{boltGuideMinHeight:guide && window.getComputedStyle ? window.getComputedStyle(guide).minHeight : null,plateInstructionsMinHeight:plateInstructions && window.getComputedStyle ? window.getComputedStyle(plateInstructions).minHeight : null,boltGuideGapBottomPx:br && gr ? br.bottom - gr.bottom : null,plateInstructionsGapBottomPx:pr && pir ? pr.bottom - pir.bottom : null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    // #region agent log
    fetch('http://127.0.0.1:7885/ingest/0499c47d-70cd-429d-a2ae-82b51e1ec3cb',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'9c1ad2'},body:JSON.stringify({sessionId:'9c1ad2',runId:runId,hypothesisId:'H_NS2',location:'tension-page-ui.js:logNonStaggeredLayoutSnapshot',message:'Check card sizing and flex behavior for bottom cards',data:{boltCardHeight:boltCard && window.getComputedStyle ? window.getComputedStyle(boltCard).height : null,boltCardMinHeight:boltCard && window.getComputedStyle ? window.getComputedStyle(boltCard).minHeight : null,platesCardHeight:platesCard && window.getComputedStyle ? window.getComputedStyle(platesCard).height : null,platesCardMinHeight:platesCard && window.getComputedStyle ? window.getComputedStyle(platesCard).minHeight : null,boltCardDisplay:boltCard && window.getComputedStyle ? window.getComputedStyle(boltCard).display : null,boltCardJustify:boltCard && window.getComputedStyle ? window.getComputedStyle(boltCard).justifyContent : null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    // #region agent log
    fetch('http://127.0.0.1:7885/ingest/0499c47d-70cd-429d-a2ae-82b51e1ec3cb',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'9c1ad2'},body:JSON.stringify({sessionId:'9c1ad2',runId:runId,hypothesisId:'H_NS3',location:'tension-page-ui.js:logNonStaggeredLayoutSnapshot',message:'Check content density against container height',data:{boltRowCount:boltCard ? boltCard.querySelectorAll('.t-row').length : 0,platesRowCount:platesCard ? platesCard.querySelectorAll('.t-row').length : 0,boltCardContentHeight:boltCard ? boltCard.scrollHeight : null,boltCardClientHeight:boltCard ? boltCard.clientHeight : null,platesCardContentHeight:platesCard ? platesCard.scrollHeight : null,platesCardClientHeight:platesCard ? platesCard.clientHeight : null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    // #region agent log
    fetch('http://127.0.0.1:7885/ingest/0499c47d-70cd-429d-a2ae-82b51e1ec3cb',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'9c1ad2'},body:JSON.stringify({sessionId:'9c1ad2',runId:runId,hypothesisId:'H_NS4',location:'tension-page-ui.js:logNonStaggeredLayoutSnapshot',message:'Check wrapper spacing around fill/instruction blocks',data:{boltFillPaddingBottom:boltCard && window.getComputedStyle ? window.getComputedStyle(boltCard.querySelector('.bolt-spec-fill') || boltCard).paddingBottom : null,legendMarginBottom:guide && window.getComputedStyle ? window.getComputedStyle(guide).marginBottom : null,instructionsMarginBottom:plateInstructions && window.getComputedStyle ? window.getComputedStyle(plateInstructions).marginBottom : null,instructionsPaddingBottom:plateInstructions && window.getComputedStyle ? window.getComputedStyle(plateInstructions).paddingBottom : null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    // #region agent log
    fetch('http://127.0.0.1:7885/ingest/0499c47d-70cd-429d-a2ae-82b51e1ec3cb',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'9c1ad2'},body:JSON.stringify({sessionId:'9c1ad2',runId:runId,hypothesisId:'H_NS5',location:'tension-page-ui.js:logNonStaggeredLayoutSnapshot',message:'Non-staggered card border/line consistency snapshot',data:{boltCardBorder:boltCard && window.getComputedStyle ? window.getComputedStyle(boltCard).border : null,platesCardBorder:platesCard && window.getComputedStyle ? window.getComputedStyle(platesCard).border : null,boltCardOutline:boltCard && window.getComputedStyle ? window.getComputedStyle(boltCard).outline : null,platesCardOutline:platesCard && window.getComputedStyle ? window.getComputedStyle(platesCard).outline : null,boltRows:boltCard ? boltCard.querySelectorAll('.t-row').length : 0,platesRows:platesCard ? platesCard.querySelectorAll('.t-row').length : 0},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }
  // #endregion

  function initSteelOptions() {
    if (!steelSelect) return;
    var grades = tensionGradesList();
    if (!grades || !grades.length) return;
    steelSelect.innerHTML = "";
    grades.forEach(function (g) {
      var o = document.createElement("option");
      o.value = g.astm;
      o.textContent = g.astm;
      steelSelect.appendChild(o);
    });
    var selected =
      window.Born2BeSteel &&
      window.Born2BeSteel.getSelectedGrade &&
      window.Born2BeSteel.getSelectedGrade();
    var excelGrade = grades.find(function (g) {
      return g.astm === EXCEL_TENSION_DESIGN_STEEL_GRADE;
    });
    steelSelect.value = excelGrade
      ? excelGrade.astm
      : selected
        ? selected.astm
        : grades[0].astm;
    if (analysisSteelMirror && analysisSteelMirror.tagName === "SELECT") {
      analysisSteelMirror.innerHTML = "";
      grades.forEach(function (g) {
        var o2 = document.createElement("option");
        o2.value = g.astm;
        o2.textContent = g.astm;
        analysisSteelMirror.appendChild(o2);
      });
      analysisSteelMirror.value = steelSelect.value;
    }
    if (analysisStagSteelMirror && analysisStagSteelMirror.tagName === "SELECT") {
      analysisStagSteelMirror.innerHTML = "";
      grades.forEach(function (g) {
        var o3 = document.createElement("option");
        o3.value = g.astm;
        o3.textContent = g.astm;
        analysisStagSteelMirror.appendChild(o3);
      });
      analysisStagSteelMirror.value = steelSelect.value;
    }
  }

  function wireNonStaggeredInputMirrors() {
    if (analysisMethodMirror && methodSelect) {
      analysisMethodMirror.addEventListener("change", function () {
        methodSelect.value = analysisMethodMirror.value;
        recomputeAll();
      });
    }
    if (analysisSteelMirror && steelSelect) {
      analysisSteelMirror.addEventListener("change", function () {
        steelSelect.value = analysisSteelMirror.value;
        recomputeAll();
      });
    }
    if (analysisDlMirror && dlInput) {
      analysisDlMirror.addEventListener("input", function () {
        dlInput.value = analysisDlMirror.value;
        recomputeAll();
      });
    }
    if (analysisLlMirror && llInput) {
      analysisLlMirror.addEventListener("input", function () {
        llInput.value = analysisLlMirror.value;
        recomputeAll();
      });
    }
    if (analysisLenMirror && lengthFt) {
      analysisLenMirror.addEventListener("input", function () {
        lengthFt.value = analysisLenMirror.value;
        recomputeAll();
      });
    }
    if (analysisNomDiaMirror && nominalDia) {
      analysisNomDiaMirror.addEventListener("input", function () {
        nominalDia.value = analysisNomDiaMirror.value;
        recomputeAll();
      });
    }
    if (analysisBoltTypeMirror && boltType) {
      analysisBoltTypeMirror.addEventListener("change", function () {
        boltType.value = analysisBoltTypeMirror.value;
        recomputeAll();
      });
    }
    if (analysisFastMirror && fastenersPerLine) {
      analysisFastMirror.addEventListener("input", function () {
        fastenersPerLine.value = analysisFastMirror.value;
        recomputeAll();
      });
    }
    if (analysisGageMirror && gageLines) {
      analysisGageMirror.addEventListener("input", function () {
        gageLines.value = analysisGageMirror.value;
        recomputeAll();
      });
    }
  }

  function wireStaggeredInputMirrors() {
    if (analysisStagMethodMirror && methodSelect) {
      analysisStagMethodMirror.addEventListener("change", function () {
        methodSelect.value = analysisStagMethodMirror.value;
        recomputeAll();
      });
    }
    if (analysisStagSteelMirror && steelSelect) {
      analysisStagSteelMirror.addEventListener("change", function () {
        steelSelect.value = analysisStagSteelMirror.value;
        recomputeAll();
      });
    }
    if (analysisStagDlMirror && dlInput) {
      analysisStagDlMirror.addEventListener("input", function () {
        dlInput.value = analysisStagDlMirror.value;
        recomputeAll();
      });
    }
    if (analysisStagLlMirror && llInput) {
      analysisStagLlMirror.addEventListener("input", function () {
        llInput.value = analysisStagLlMirror.value;
        recomputeAll();
      });
    }
    if (analysisStagLenMirror && lengthFt) {
      analysisStagLenMirror.addEventListener("input", function () {
        lengthFt.value = analysisStagLenMirror.value;
        recomputeAll();
      });
    }
    if (analysisStagNomDiaMirror && nominalDia) {
      analysisStagNomDiaMirror.addEventListener("input", function () {
        nominalDia.value = analysisStagNomDiaMirror.value;
        recomputeAll();
      });
    }
    if (analysisStagBoltTypeMirror && boltType) {
      analysisStagBoltTypeMirror.addEventListener("change", function () {
        boltType.value = analysisStagBoltTypeMirror.value;
        recomputeAll();
      });
    }
    if (analysisStagFastMirror && fastenersPerLine) {
      analysisStagFastMirror.addEventListener("input", function () {
        fastenersPerLine.value = analysisStagFastMirror.value;
        recomputeAll();
      });
    }
    if (analysisStagGageMirror && gageLines) {
      analysisStagGageMirror.addEventListener("input", function () {
        gageLines.value = analysisStagGageMirror.value;
        recomputeAll();
      });
    }
    if (analysisStagBsLt && analysisBsLt) {
      analysisStagBsLt.addEventListener("input", function () {
        analysisBsLt.value = analysisStagBsLt.value;
        recomputeAll();
      });
    }
    if (analysisStagBsNt && analysisBsNt) {
      analysisStagBsNt.addEventListener("input", function () {
        analysisBsNt.value = analysisStagBsNt.value;
        recomputeAll();
      });
    }
    if (analysisStagBsLv && analysisBsLv) {
      analysisStagBsLv.addEventListener("input", function () {
        analysisBsLv.value = analysisStagBsLv.value;
        recomputeAll();
      });
    }
    if (analysisStagBsNv && analysisBsNv) {
      analysisStagBsNv.addEventListener("input", function () {
        analysisBsNv.value = analysisStagBsNv.value;
        recomputeAll();
      });
    }
    if (analysisStagStressType && stressType) {
      analysisStagStressType.addEventListener("change", function () {
        stressType.value = analysisStagStressType.value;
        recomputeAll();
      });
    }
  }

  [
    steelSelect,
    methodSelect,
    nominalDia,
    boltType,
    fastenersPerLine,
    gageLines,
    connectionSelect,
    dlInput,
    llInput,
    lengthFt,
    plateThickness,
    stressType,
    unsupportedLc,
    analysisStagUnsupportedLc,
    plateLengthIn,
    analysisStagPlateLengthIn,
    analysisStagPlateThickness,
    analysisBsLt,
    analysisBsNt,
    analysisBsLv,
    analysisBsNv,
    sg1,
    g1,
    g2,
  ].forEach(function (el) {
    if (!el) return;
    el.addEventListener("input", recomputeAll);
    el.addEventListener("change", recomputeAll);
  });

  if (tensionNonStagConnectionSelect && connectionSelect) {
    tensionNonStagConnectionSelect.addEventListener("change", function () {
      connectionSelect.value = tensionNonStagConnectionSelect.value;
      recomputeAll();
    });
  }
  if (tensionStagConnectionSelect && connectionSelect) {
    tensionStagConnectionSelect.addEventListener("change", function () {
      connectionSelect.value = tensionStagConnectionSelect.value;
      recomputeAll();
    });
  }

  if (shapeSelect) {
    function onPrimaryShapeChange() {
      renderNonStaggeredSelector();
      rebuildStagShapeOptions({ prefer: shapeSelect.value });
      recomputeAll();
    }
    shapeSelect.addEventListener("input", onPrimaryShapeChange);
    shapeSelect.addEventListener("change", onPrimaryShapeChange);
  }
  if (designSectionSelect) {
    designSectionSelect.addEventListener("change", function () {
      if (designSectionPreview) designSectionPreview.value = designSectionSelect.value || "--";
      if (shapeSelect && designSectionSelect.value) {
        shapeSelect.value = designSectionSelect.value;
        renderNonStaggeredSelector();
        rebuildStagShapeOptions({ prefer: shapeSelect.value });
      }
      recomputeAll();
    });
  }

  wireNonStaggeredInputMirrors();
  wireStaggeredInputMirrors();
  enforceRequestedVisualLocks();
  enforceNonStaggeredFieldModes();
  enforceStaggeredFieldModes();
  setupTabAccessibility();
  wireArrowKeyNav(Array.prototype.slice.call(viewButtons));
  wireArrowKeyNav(Array.prototype.slice.call(analysisModeButtons));

  function runTensionCatalogAndExcelDefaultsPipeline() {
    loadTensionCatalog(function () {
      hydrateNsMasterOptionsFromAiscDataset(function () {
        populateShapes();
        initStagSectionUi();
        /** Excel `NS -Tension Analysis` inputs as initial master state (matches workbook on load). */
        if (applyExcelNsAnalysisCalculatorDefaults()) excelNsAnalysisCalculatorDefaultsApplied = true;
        /** Excel `S -Tension Analysis` defaults applied at load so stagger inputs match workbook without opening the sub-tab. */
        if (applyExcelStaggerAnalysisCalculatorDefaults()) excelStaggerAnalysisCalculatorDefaultsApplied = true;
        /** Last: Design Calculator + Capacity and Demand (Tension Design shared inputs). */
        if (applyExcelTensionDesignCalculatorDefaults()) {
          excelTensionDesignCalculatorDefaultsApplied = true;
          /** Shared fields were overwritten — allow one-time NS / stagger reapplies on those tabs. */
          excelNsAnalysisCalculatorDefaultsApplied = false;
          excelStaggerAnalysisCalculatorDefaultsApplied = false;
        }
        setView("design");
        setAnalysisMode("non");
        recomputeAll();
        if (typeof window.requestAnimationFrame === "function") {
          window.requestAnimationFrame(function () {
            recomputeAll();
          });
        }
        enforceAnalysisScrollLayout();
      });
    });
  }

  /** Populate `#tensionSteelGrade`; retry fetch once if options are still empty after `ensureLoaded`. */
  function bootstrapTensionModuleUi() {
    initSteelOptions();
    var hasOpts = steelSelect && steelSelect.options && steelSelect.options.length > 0;
    if (!hasOpts && window.SteelGradesService && typeof window.SteelGradesService.reloadFromFetch === "function") {
      window.SteelGradesService.reloadFromFetch().then(function () {
        initSteelOptions();
        runTensionCatalogAndExcelDefaultsPipeline();
      }).catch(function () {
        initSteelOptions();
        runTensionCatalogAndExcelDefaultsPipeline();
      });
      return;
    }
    runTensionCatalogAndExcelDefaultsPipeline();
  }

  if (window.SteelGradesService && typeof window.SteelGradesService.onUpdate === "function") {
    window.SteelGradesService.onUpdate(function () {
      if (!steelSelect) return;
      var grades = tensionGradesList();
      if (!grades.length) return;
      if (steelSelect.options.length === grades.length) return;
      var keep = steelSelect.value;
      initSteelOptions();
      if (keep && [].some.call(steelSelect.options, function (o) { return o.value === keep; })) {
        steelSelect.value = keep;
      }
      syncSteelFields();
      recomputeAll();
    });
  }

  function scheduleTensionModuleBootstrap() {
    function kickoff() {
      var svc = window.SteelGradesService;
      if (svc && typeof svc.ensureLoaded === "function") {
        svc.ensureLoaded().then(bootstrapTensionModuleUi).catch(bootstrapTensionModuleUi);
      } else {
        bootstrapTensionModuleUi();
      }
    }
    if (typeof window !== "undefined" && typeof window.setTimeout === "function") {
      window.setTimeout(kickoff, 0);
    } else {
      kickoff();
    }
  }
  scheduleTensionModuleBootstrap();

  if (typeof MutationObserver !== "undefined" && root) {
    var __tensionActiveMo = new MutationObserver(function () {
      if (!root.classList.contains("active-panel")) return;
      recomputeAll();
    });
    __tensionActiveMo.observe(root, { attributes: true, attributeFilter: ["class"] });
    if (root.classList.contains("active-panel") && typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(function () {
        recomputeAll();
      });
    }
  }

  window.addEventListener("resize", enforceAnalysisScrollLayout);
})();

