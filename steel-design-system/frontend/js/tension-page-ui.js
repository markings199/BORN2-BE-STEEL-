(function () {
  "use strict";

  var root = document.getElementById("tensionSection");
  if (!root) return;
  // #region agent log
  function dbg(runId, hypothesisId, location, message, data) {
    var payload = { sessionId: "99e7ea", id: "log_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8), runId: runId, hypothesisId: hypothesisId, location: location, message: message, data: data || {}, timestamp: Date.now() };
    try {
      localStorage.setItem("steel-debug-99e7ea-tail", JSON.stringify(payload));
    } catch (e) {}
    fetch("http://127.0.0.1:7885/ingest/0499c47d-70cd-429d-a2ae-82b51e1ec3cb", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "99e7ea" }, body: JSON.stringify(payload) }).catch(function () {});
    // #region agent log
    fetch("http://127.0.0.1:7885/ingest/0499c47d-70cd-429d-a2ae-82b51e1ec3cb", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "9c1ad2" }, body: JSON.stringify({ sessionId: "9c1ad2", id: payload.id, runId: runId, hypothesisId: hypothesisId, location: location, message: message, data: data || {}, timestamp: payload.timestamp }) }).catch(function () {});
    // #endregion
  }
  dbg("pre-fix", "H0", "tension-page-ui.js:init", "Tension UI script initialized", { rootFound: true });
  // #endregion

  // #region agent log
  (function logTensionLayoutSnapshot() {
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
    if (name === "analysisStag") recomputeAll();
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
      if (analysisStagUnsupportedLc && unsupportedLc) analysisStagUnsupportedLc.value = unsupportedLc.value;
      if (analysisStagPlateLengthIn && plateLengthIn) analysisStagPlateLengthIn.value = plateLengthIn.value;
      if (analysisStagPlateThickness && plateThickness) analysisStagPlateThickness.value = plateThickness.value;
      syncShapeFromNonToStag();
    } else if (mode === "non") {
      if (analysisStagUnsupportedLc && unsupportedLc) unsupportedLc.value = analysisStagUnsupportedLc.value;
      if (analysisStagPlateLengthIn && plateLengthIn) plateLengthIn.value = analysisStagPlateLengthIn.value;
      if (analysisStagPlateThickness && plateThickness) plateThickness.value = analysisStagPlateThickness.value;
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
  var safeAgOut = byId("tensionSafeAg");
  var safeRemarkOut = byId("tensionSafeRemark");

  var shapeSelect = byId("tensionShapeSelect");
  var shapeSelectStag = byId("tensionShapeSelectStag");
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

  var analysisGoverningDisplay = byId("analysisGoverningDisplay");
  var analysisSafetyStatus = byId("analysisSafetyStatus");
  var analysisGoverningDisplayStag = byId("analysisGoverningDisplayStag");
  var analysisSafetyStatusStag = byId("analysisSafetyStatusStag");
  var analysisStagGovEqLabel = byId("analysisStagGovEqLabel");

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

  var connectionImageByType = {
    // Use the clearest reference image for design-view visibility.
    WEB: "assets/tension-page/tension-detail-2.png",
    FLANGE: "assets/tension-page/tension-detail-1.png",
    FLANGE_WEB: "assets/tension-page/tension-detail-3.png",
  };

  var candidateSections = [
    { name: "L4X4X3/8", family: "ANGLE", Ag: 2.88, rx: 1.2, ry: 0.79, t: 0.375, xbar: 1.16, ybar: 1.16 },
    { name: "L5X5X1/2", family: "ANGLE", Ag: 4.75, rx: 1.5, ry: 1.0, t: 0.5, xbar: 1.4, ybar: 1.4 },
    { name: "L6X6X1/2", family: "ANGLE", Ag: 5.75, rx: 1.75, ry: 1.16, t: 0.5, xbar: 1.64, ybar: 1.64 },
    { name: "L6X6X3/4", family: "ANGLE", Ag: 8.32, rx: 1.78, ry: 1.18, t: 0.75, xbar: 1.73, ybar: 1.73 },
    { name: "L6X6X1", family: "ANGLE", Ag: 10.7, rx: 1.8, ry: 1.2, t: 1.0, xbar: 1.82, ybar: 1.82 },
    { name: "L8X6X3/4", family: "ANGLE", Ag: 10.2, rx: 2.12, ry: 1.34, t: 0.75, xbar: 2.1, ybar: 1.55 },
    { name: "L10X10X1", family: "ANGLE", Ag: 19.0, rx: 3.13, ry: 3.13, t: 1.0, xbar: 2.82, ybar: 2.82 },
    { name: "L10X10X1-1/8", family: "ANGLE", Ag: 21.2, rx: 3.12, ry: 3.12, t: 1.125, xbar: 2.88, ybar: 2.88 },
    { name: "L12X12X1-3/8", family: "ANGLE", Ag: 30.9, rx: 3.74, ry: 3.74, t: 1.375, xbar: 3.47, ybar: 3.47 },
  ];

  var currentStagShapeFilter = "all";

  function sectionFamily(sec) {
    if (sec && sec.family) return sec.family;
    var n = (sec && sec.name ? String(sec.name) : "").toUpperCase();
    if (n.indexOf("HSS") === 0) return "HSS";
    if (/^W\d/.test(n)) return "W";
    if (n.indexOf("L") === 0) return "ANGLE";
    return "OTHER";
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
      return num(analysisStagPlateLengthIn.value, defaultLen);
    }
    return plateLengthIn ? num(plateLengthIn.value, defaultLen) : defaultLen;
  }

  function activePlateThicknessIn() {
    if (isStaggeredAnalysisActive() && analysisStagPlateThickness) {
      return num(analysisStagPlateThickness.value, 0);
    }
    return plateThickness ? num(plateThickness.value, 0) : 0;
  }

  function updateStagFilterButtonVisibility() {
    var fams = ["ANGLE", "HSS", "W"];
    fams.forEach(function (fam) {
      var count = candidateSections.filter(function (s) {
        return sectionFamily(s) === fam;
      }).length;
      var btn = root.querySelector('[data-stag-shape-filter="' + fam + '"]');
      if (btn) btn.style.display = count ? "" : "none";
    });
  }

  function rebuildStagShapeOptions(opts) {
    opts = opts || {};
    if (!shapeSelectStag) return;
    var filter = currentStagShapeFilter || "all";
    var list = candidateSections.filter(function (s) {
      var fam = sectionFamily(s);
      return filter === "all" || fam === filter;
    });
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
  }

  function renderStagTypeChips() {
    var host = byId("stagSectionTypeChips");
    if (!host) return;
    host.innerHTML = "";
    var seen = {};
    candidateSections.forEach(function (s) {
      var fam = sectionFamily(s);
      if (fam === "OTHER") return;
      seen[fam] = true;
    });
    var labels = { ANGLE: "L / ∠", HSS: "HSS", W: "W" };
    Object.keys(seen).forEach(function (fam) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "stag-type-chip";
      b.setAttribute("data-stag-shape-filter", fam);
      b.textContent = labels[fam] || fam;
      host.appendChild(b);
    });
  }

  function setStagShapeFilter(next, opts) {
    opts = opts || {};
    currentStagShapeFilter = next || "all";
    root.querySelectorAll(".stag-shape-btn[data-stag-shape-filter], .stag-type-chip[data-stag-shape-filter]").forEach(function (el) {
      var f = el.getAttribute("data-stag-shape-filter");
      var on = f === currentStagShapeFilter || (currentStagShapeFilter === "all" && f === "all");
      el.classList.toggle("is-active", on);
    });
    var preserve =
      shapeSelectStag && shapeSelectStag.value ? shapeSelectStag.value : shapeSelect && shapeSelect.value;
    rebuildStagShapeOptions({ prefer: preserve });
    if (!opts.skipRecompute) recomputeAll();
  }

  function initStagSectionUi() {
    if (!shapeSelectStag) return;
    updateStagFilterButtonVisibility();
    renderStagTypeChips();
    root.querySelectorAll(".stag-shape-btn[data-stag-shape-filter], .stag-type-chip[data-stag-shape-filter]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var f = btn.getAttribute("data-stag-shape-filter") || "all";
        setStagShapeFilter(f, { skipRecompute: false });
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
    root.querySelectorAll(".stag-shape-btn[data-stag-shape-filter], .stag-type-chip[data-stag-shape-filter]").forEach(function (el) {
      var f = el.getAttribute("data-stag-shape-filter");
      el.classList.toggle("is-active", f === "all");
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
  function currentGrade() {
    var steel = window.Born2BeSteel && window.Born2BeSteel.steelGrades;
    if (!steel || !steel.length) return null;
    var key = steelSelect && steelSelect.value;
    var found = steel.find(function (g) { return g.astm === key; });
    return found || steel[0];
  }

  function syncSteelFields() {
    var g = currentGrade();
    if (!g) return;
    fyInput.value = fmt(g.fy, 0);
    fuInput.value = fmt(g.fu, 0);
    if (window.Born2BeSteel && typeof window.Born2BeSteel.setActiveMaterial === "function") {
      window.Born2BeSteel.setActiveMaterial(g.astm);
    }
  }

  function calcBoltDiameter() {
    var n = num(nominalDia.value, 0);
    var out = boltType.value === "BOLT" ? n + 0.125 : n + 0.0625;
    boltDiaOut.value = fmt(out, 3);
    return out;
  }

  function calcU() {
    var conn = connectionSelect.value;
    var nFast = num(fastenersPerLine.value, 0);
    var u = 1;
    if (conn === "FLANGE_WEB") {
      u = 1;
    } else {
      u = nFast >= 4 ? 0.8 : 0.6;
    }
    uOut.value = fmt(u, 2);
    return u;
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

  function calcDemandAndAreas() {
    var fy = num(fyInput.value, 0);
    var fu = num(fuInput.value, 0);
    var dl = num(dlInput.value, 0);
    var ll = num(llInput.value, 0);
    var method = methodSelect.value;
    var tLoad1;
    var tLoad2;
    var gov;

    if (method === "LRFD") {
      demandEq1Label.textContent = "Tu = 1.2DL + 1.6LL";
      demandEq2Label.textContent = "Wu = 1.4DL";
      demandGovLabel.textContent = "Tu";
      tLoad1 = 1.2 * dl + 1.6 * ll;
      tLoad2 = 1.4 * dl;
      gov = Math.max(tLoad1, tLoad2);
      agYieldOut.value = fmt(gov / (0.9 * fy), 4);
      anFractureOut.value = fmt(gov / (0.75 * fu), 4);
      agFractureOut.value = fmt(gov / (0.75 * fy), 4);
    } else {
      demandEq1Label.textContent = "Ta = DL + LL";
      demandEq2Label.textContent = "-";
      demandGovLabel.textContent = "Ta";
      tLoad1 = dl + ll;
      tLoad2 = 0;
      gov = tLoad1;
      agYieldOut.value = fmt((gov * 1.67) / fy, 4);
      anFractureOut.value = fmt((gov * 2.0) / fu, 4);
      agFractureOut.value = fmt((gov * 2.0) / fy, 4);
    }
    demandEq1.value = fmt(tLoad1, 3);
    demandEq2.value = method === "LRFD" ? fmt(tLoad2, 3) : "-";
    demandGov.value = fmt(gov, 3);

    var rMin = Math.max(0.3, Math.sqrt(num(agYieldOut.value, 0)) / 6);
    minROut.value = fmt(rMin, 4);

    var reqAg = Math.max(num(agYieldOut.value, 0), num(agFractureOut.value, 0));
    var picked = candidateSections
      .filter(function (s) { return s.Ag >= reqAg; })
      .sort(function (a, b) { return a.Ag - b.Ag; })[0];
    if (!picked) picked = candidateSections[candidateSections.length - 1];
    safeSectionOut.textContent = picked.name;
    safeAgOut.value = fmt(picked.Ag, 3);
    safeRemarkOut.value = picked.Ag >= reqAg ? "SAFE" : "NOT SAFE";
    if (safeRemarkOut && safeRemarkOut.classList) {
      var isSafe = safeRemarkOut.value === "SAFE";
      safeRemarkOut.classList.toggle("is-safe", isSafe);
      safeRemarkOut.classList.toggle("is-unsafe", !isSafe);
    }
    // #region agent log
    dbg("post-fix", "H_non_comp", "tension-page-ui.js:calcDemandAndAreas", "Non-staggered demand/required-area consistency", {
      method: method,
      dl: dl,
      ll: ll,
      tLoad1: tLoad1,
      tLoad2: tLoad2,
      gov: gov,
      demandEqOk: method === "LRFD" ? Math.abs(gov - Math.max(1.2 * dl + 1.6 * ll, 1.4 * dl)) < 1e-9 : Math.abs(gov - (dl + ll)) < 1e-9,
      reqAg: reqAg,
      pickedSection: picked ? picked.name : null,
      pickedAg: picked ? picked.Ag : null,
      sectionMeetsReq: picked ? picked.Ag >= reqAg : null
    });
    // #endregion

    return { gov: gov, reqAg: reqAg };
  }

  function populateShapes() {
    if (!shapeSelect) return;
    shapeSelect.innerHTML = "";
    candidateSections.forEach(function (s) {
      var o = document.createElement("option");
      o.value = s.name;
      o.textContent = s.name;
      shapeSelect.appendChild(o);
    });
    shapeSelect.value = candidateSections[0].name;
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
    var agPlate = tPlate > 0 ? tPlate * Math.max(1, plateLen / 12) : 0;
    plateAg.value = fmt(agPlate, 3);
    if (analysisStagPlateLengthIn && plateLengthIn && !isStaggeredAnalysisActive()) {
      analysisStagPlateLengthIn.value = plateLengthIn.value;
    }
    if (analysisStagPlateThickness && plateThickness && !isStaggeredAnalysisActive()) {
      analysisStagPlateThickness.value = plateThickness.value;
    }
    if (analysisStagPlateAg) analysisStagPlateAg.value = plateAg.value;
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
    var case2 = Math.max(0, 1 - s.xbar / lc);
    var case8 = calcU();
    var uGov = connectionSelect.value === "FLANGE_WEB" ? 1 : Math.max(case2, case8);
    case1Out.value = fmt(case1, 3);
    case2Out.value = fmt(case2, 3);
    case8Out.value = fmt(case8, 3);
    uGovOut.value = fmt(uGov, 3);
    if (analysisStagCase1) analysisStagCase1.value = fmt(case1, 3);
    if (analysisStagCase2) analysisStagCase2.value = fmt(case2, 3);
    if (analysisStagCase8) analysisStagCase8.value = fmt(case8, 3);
    if (analysisStagUGov) analysisStagUGov.value = fmt(uGov, 3);

    var fy = num(fyInput.value, 0);
    var fu = num(fuInput.value, 0);
    var stressFactor = num(stressType.value, 1);
    var agUse = agPlate > 0 ? agPlate : s.Ag;
    var dh = num(calcBoltDiameter(), 0);
    var nHolesNet = Math.max(1, num(gageLines.value, 1)); // simple default per guide: gage lines influence net path
    var anUse = Math.max(0.0001, agUse - nHolesNet * dh * s.t);
    var aeUse = Math.max(0.0001, uGov * anUse);

    if (analysisNetAn) analysisNetAn.value = fmt(anUse, 3);
    if (analysisAe) analysisAe.value = fmt(aeUse, 3);

    var method = methodSelect.value;
    var demand = num(demandGov.value, 0);
    var phiY = 0.9;
    var phiR = 0.75;
    var omegaY = 1.67;
    var omegaR = 2.0;
    var yieldCap = method === "LRFD" ? phiY * fy * agUse : (fy * agUse) / omegaY;
    var fracCap = method === "LRFD" ? phiR * fu * aeUse * stressFactor : (fu * aeUse * stressFactor) / omegaR;
    var critAnForStag = criticalAn ? num(criticalAn.value, NaN) : NaN;
    var aeStaggeredDemand = Number.isFinite(critAnForStag) ? uGov * Math.max(0.0001, critAnForStag) : aeUse;
    if (analysisStagAeDemand) analysisStagAeDemand.value = fmt(aeStaggeredDemand, 3);
    var fracCapStagPanel = method === "LRFD" ? phiR * fu * aeStaggeredDemand * stressFactor : (fu * aeStaggeredDemand * stressFactor) / omegaR;
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

    // Block shear (simplified, educational)
    var lt = analysisBsLt ? num(analysisBsLt.value, 0) : 0;
    var lv = analysisBsLv ? num(analysisBsLv.value, 0) : 0;
    var nt = analysisBsNt ? Math.max(0, Math.round(num(analysisBsNt.value, 0))) : 0;
    var nv = analysisBsNv ? Math.max(0, Math.round(num(analysisBsNv.value, 0))) : 0;
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
    if (analysisStagBsNt) analysisStagBsNt.value = String(nt);
    if (analysisStagBsLv) analysisStagBsLv.value = fmt(lv, 3);
    if (analysisStagBsNv) analysisStagBsNv.value = String(nv);
    if (analysisStagBsAgt) analysisStagBsAgt.value = fmt(agt, 3);
    if (analysisStagBsAnt) analysisStagBsAnt.value = fmt(ant, 3);
    if (analysisStagBsAvg) analysisStagBsAvg.value = fmt(avg, 3);
    if (analysisStagBsAvn) analysisStagBsAvn.value = fmt(avn, 3);

    var ubs = 1.0;
    // AISC block shear nominal strengths (simplified)
    var rn1 = 0.6 * fu * avn + ubs * fu * ant;
    var rn2 = 0.6 * fy * avg + ubs * fu * ant;
    var rn = Math.min(rn1, rn2);
    var phiBs = 0.75;
    var omegaBs = 2.0;
    var bsCap = method === "LRFD" ? phiBs * rn : rn / omegaBs;
    if (analysisBlockShearCap) analysisBlockShearCap.value = fmt(bsCap, 3);
    if (analysisStagBlockShearCap) analysisStagBlockShearCap.value = fmt(bsCap, 3);
    if (analysisStagStressType && stressType) {
      analysisStagStressType.value = stressType.options[stressType.selectedIndex].text;
    }

    var govCap = Math.min(yieldCap, fracCap, bsCap);
    var isSafe = govCap >= demand && demand > 0;
    if (analysisGoverningDisplay) analysisGoverningDisplay.textContent = fmt(govCap, 3) + " kips";
    if (analysisSafetyStatus) analysisSafetyStatus.textContent = demand === 0 ? "--" : (isSafe ? "SAFE" : "UNSAFE");

    // Staggered governing uses same fracture basis as the panel (fracCapStagPanel / aeStaggeredDemand).
    var govCapStag = Math.min(yieldCap, fracCapStagPanel, bsCap);
    var safeStag = govCapStag >= demand && demand > 0;
    if (analysisStagGovEqLabel) analysisStagGovEqLabel.textContent = method === "LRFD" ? "Tu =" : "Ta =";
    if (analysisGoverningDisplayStag) analysisGoverningDisplayStag.textContent = demand === 0 ? "--" : fmt(govCapStag, 3);
    if (analysisSafetyStatusStag) {
      analysisSafetyStatusStag.textContent = demand === 0 ? "--" : (safeStag ? "SAFE" : "UNSAFE");
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
      plateLogicOk: tPlate > 0 ? Math.abs(agPlate - (tPlate * Math.max(1, plateLen / 12))) < 1e-9 : agPlate === 0,
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
      safeRuleOk: demand > 0 ? (isSafe === (govCap >= demand)) : true,
      nonFiniteDetected: [plateLen, tPlate, agPlate, case1, case2, case8, uGov, anUse, aeUse, yieldCap, fracCap, bsCap, govCap, demand].some(function (v) { return !Number.isFinite(v); })
    });
    // #endregion
  }

  function calcStaggered() {
    var s = shapeData();
    var ag = num(s.Ag, s.Ag);
    var dHole = num(calcBoltDiameter(), 0);
    var g1Val = num(g1.value, 0);
    var g2Val = num(g2.value, 0);
    var sg1Val = num(sg1.value, 0);
    var t = num(s.t, s.t);

    var base = Math.max(0, ag - dHole * t * Math.max(1, num(gageLines.value, 1)));
    var p1 = base + (g2Val === 0 ? 0 : (sg1Val * sg1Val) / Math.max(1, 4 * g1Val));
    var p2 = base + (sg1Val * sg1Val) / Math.max(1, 4 * Math.max(0.0001, g1Val + g2Val));
    var p3 = base + (sg1Val * sg1Val) / Math.max(1, 4 * Math.max(0.0001, g1Val - g2Val || g1Val));
    var crit = Math.min(p1, p2, p3);
    path1.value = fmt(p1, 4);
    path2.value = fmt(p2, 4);
    path3.value = fmt(p3, 4);
    criticalAn.value = fmt(crit, 4);
    if (analysisStagCriticalAn) analysisStagCriticalAn.value = fmt(crit, 4);
    var lcStag = effectiveLcIn();
    var case2Stag = Math.max(0, 1 - s.xbar / lcStag);
    var case8Stag = calcU();
    var uStag =
      connectionSelect && connectionSelect.value === "FLANGE_WEB" ? 1 : Math.max(case2Stag, case8Stag);
    if (analysisStagAe) analysisStagAe.value = fmt(Math.max(0.0001, uStag * crit), 4);
  }

  function renderConnectionImage() {
    if (!connImage) return;
    var key = connectionSelect && connectionSelect.value ? connectionSelect.value : "WEB";
    var src = connectionImageByType[key] || connectionImageByType.WEB;
    // #region agent log
    dbg("post-fix", "H_conn_img", "tension-page-ui.js:renderConnectionImage", "Connection image mapping snapshot", {
      selectedConnection: key,
      mappedSrc: src,
      availableKeys: Object.keys(connectionImageByType || {})
    });
    // #endregion
    connImage.onerror = function () {
      connImage.onerror = null;
      connImage.src = connectionSvgData(key + " CONNECTION", "Fallback diagram");
    };
    connImage.src = src;
  }

  function recomputeAll() {
    syncSteelFields();
    calcBoltDiameter();
    calcU();
    calcDemandAndAreas();
    mirrorDesignToAnalysis();
    renderConnectionImage();
    calcStaggered();
    calcNonStaggered();
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
    if (stag && stag.classList.contains("is-active") && window.requestAnimationFrame) {
      window.requestAnimationFrame(function () {
        logStaggeredLayoutSnapshot("post-fix");
      });
    }
    var non = byId("analysisCalcNon");
    if (non && non.classList.contains("is-active") && window.requestAnimationFrame) {
      window.requestAnimationFrame(function () {
        logNonStaggeredLayoutSnapshot("post-fix");
      });
    }
    // #region agent log
    (function () {
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
      var situation1 = stagRoot.querySelector(".analysis-stag-center > .analysis-stag-situations");
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
    var grades = window.Born2BeSteel && window.Born2BeSteel.steelGrades;
    if (!grades || !grades.length) return;
    steelSelect.innerHTML = "";
    grades.forEach(function (g) {
      var o = document.createElement("option");
      o.value = g.astm;
      o.textContent = g.astm;
      steelSelect.appendChild(o);
    });
    var selected = window.Born2BeSteel.getSelectedGrade && window.Born2BeSteel.getSelectedGrade();
    steelSelect.value = selected ? selected.astm : grades[0].astm;
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

  if (shapeSelect) {
    function onPrimaryShapeChange() {
      rebuildStagShapeOptions({ prefer: shapeSelect.value });
      recomputeAll();
    }
    shapeSelect.addEventListener("input", onPrimaryShapeChange);
    shapeSelect.addEventListener("change", onPrimaryShapeChange);
  }

  initSteelOptions();
  populateShapes();
  initStagSectionUi();
  setupTabAccessibility();
  wireArrowKeyNav(Array.prototype.slice.call(viewButtons));
  wireArrowKeyNav(Array.prototype.slice.call(analysisModeButtons));
  setView("design");
  setAnalysisMode("non");
  recomputeAll();
  enforceAnalysisScrollLayout();
  window.addEventListener("resize", enforceAnalysisScrollLayout);
})();

