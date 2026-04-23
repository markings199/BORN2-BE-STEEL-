(function () {
  "use strict";

  var root = document.getElementById("tensionSection");
  if (!root) return;

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

  function setView(name) {
    Object.keys(viewMap).forEach(function (k) {
      if (viewMap[k]) viewMap[k].classList.toggle("is-active", k === name);
    });
    viewButtons.forEach(function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-tension-view") === name);
    });
  }

  viewButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      setView(btn.getAttribute("data-tension-view"));
    });
  });

  function setAnalysisMode(mode) {
    if (analysisCalcNon) analysisCalcNon.classList.toggle("is-active", mode === "non");
    if (analysisCalcStag) analysisCalcStag.classList.toggle("is-active", mode === "stag");
    analysisModeButtons.forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-tension-analysis-mode") === mode);
    });
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
  var shapeAg = byId("tensionShapeAg");
  var shapeRx = byId("tensionShapeRx");
  var shapeRy = byId("tensionShapeRy");
  var shapeT = byId("tensionShapeT");
  var shapeX = byId("tensionShapeXbar");
  var shapeY = byId("tensionShapeYbar");
  var plateThickness = byId("tensionPlateThickness");
  var plateAg = byId("tensionPlateAg");
  var lengthInOut = byId("tensionLengthIn");

  var case1Out = byId("tensionCase1");
  var case2Out = byId("tensionCase2");
  var case8Out = byId("tensionCase8");
  var uGovOut = byId("tensionUGoverning");
  var stressType = byId("tensionStressType");
  var unsupportedLc = byId("analysisUnsupportedLc");
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

  var analysisDemand1Label = byId("analysisDemand1Label");
  var analysisDemand2Label = byId("analysisDemand2Label");
  var analysisDemandGovLabel = byId("analysisDemandGovLabel");
  var analysisDemand1 = byId("analysisDemand1");
  var analysisDemand2 = byId("analysisDemand2");
  var analysisDemandGov = byId("analysisDemandGov");

  var analysisNetAn = byId("analysisNetAn");
  var analysisAe = byId("analysisAe");
  var analysisYieldLabel = byId("analysisYieldLabel");
  var analysisFracLabel = byId("analysisFracLabel");
  var analysisYieldCap = byId("analysisYieldCap");
  var analysisFracCap = byId("analysisFracCap");

  var analysisBsLt = byId("analysisBsLt");
  var analysisBsNt = byId("analysisBsNt");
  var analysisBsLv = byId("analysisBsLv");
  var analysisBsNv = byId("analysisBsNv");
  var analysisBsAgt = byId("analysisBsAgt");
  var analysisBsAnt = byId("analysisBsAnt");
  var analysisBsAvg = byId("analysisBsAvg");
  var analysisBsAvn = byId("analysisBsAvn");
  var analysisBlockShearCap = byId("analysisBlockShearCap");

  var analysisGoverningDisplay = byId("analysisGoverningDisplay");
  var analysisSafetyStatus = byId("analysisSafetyStatus");
  var analysisGoverningDisplayStag = byId("analysisGoverningDisplayStag");
  var analysisSafetyStatusStag = byId("analysisSafetyStatusStag");

  var sg1 = byId("tensionSg1");
  var g1 = byId("tensionG1");
  var g2 = byId("tensionG2");
  var path1 = byId("tensionPath1");
  var path2 = byId("tensionPath2");
  var path3 = byId("tensionPath3");
  var criticalAn = byId("tensionCriticalAn");

  var connectionImageByType = {
    WEB: "assets/tension-page/tension-detail-1.png",
    FLANGE: "assets/tension-page/tension-detail-2.png",
    FLANGE_WEB: "assets/tension-page/tension-detail-3.png",
  };

  var candidateSections = [
    { name: "L4X4X3/8", Ag: 2.88, rx: 1.2, ry: 0.79, t: 0.375, xbar: 1.16, ybar: 1.16 },
    { name: "L5X5X1/2", Ag: 4.75, rx: 1.5, ry: 1.0, t: 0.5, xbar: 1.4, ybar: 1.4 },
    { name: "L6X6X1/2", Ag: 5.75, rx: 1.75, ry: 1.16, t: 0.5, xbar: 1.64, ybar: 1.64 },
    { name: "L6X6X3/4", Ag: 8.32, rx: 1.78, ry: 1.18, t: 0.75, xbar: 1.73, ybar: 1.73 },
    { name: "L6X6X1", Ag: 10.7, rx: 1.8, ry: 1.2, t: 1.0, xbar: 1.82, ybar: 1.82 },
    { name: "L8X6X3/4", Ag: 10.2, rx: 2.12, ry: 1.34, t: 0.75, xbar: 2.1, ybar: 1.55 },
  ];

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
  }

  function shapeData() {
    return candidateSections.find(function (s) { return s.name === shapeSelect.value; }) || candidateSections[0];
  }

  function calcNonStaggered() {
    var s = shapeData();
    shapeAg.value = fmt(s.Ag, 3);
    shapeRx.value = fmt(s.rx, 3);
    shapeRy.value = fmt(s.ry, 3);
    shapeT.value = fmt(s.t, 3);
    shapeX.value = fmt(s.xbar, 3);
    shapeY.value = fmt(s.ybar, 3);

    var lengthIn = num(lengthFt.value, 0) * 12;
    var plateLen = plateLengthIn ? num(plateLengthIn.value, lengthIn) : lengthIn;
    lengthInOut.value = fmt(plateLen, 3);
    var tPlate = num(plateThickness.value, 0);
    var agPlate = tPlate > 0 ? tPlate * Math.max(1, plateLen / 12) : 0;
    plateAg.value = fmt(agPlate, 3);

    var case1 = 1;
    var lc = unsupportedLc ? Math.max(0.0001, num(unsupportedLc.value, 1)) : 1;
    var case2 = Math.max(0, 1 - s.xbar / lc);
    var case8 = calcU();
    var uGov = connectionSelect.value === "FLANGE_WEB" ? 1 : Math.max(case2, case8);
    case1Out.value = fmt(case1, 3);
    case2Out.value = fmt(case2, 3);
    case8Out.value = fmt(case8, 3);
    uGovOut.value = fmt(uGov, 3);

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
    if (analysisYieldLabel) analysisYieldLabel.textContent = method === "LRFD" ? "Tu" : "Ta";
    if (analysisFracLabel) analysisFracLabel.textContent = method === "LRFD" ? "Tu" : "Ta";
    if (analysisYieldCap) analysisYieldCap.value = fmt(yieldCap, 3);
    if (analysisFracCap) analysisFracCap.value = fmt(fracCap, 3);

    // Demand panel mirrors design demand equations
    if (analysisDemand1Label) analysisDemand1Label.textContent = demandEq1Label ? demandEq1Label.textContent : "Tu";
    if (analysisDemand2Label) analysisDemand2Label.textContent = demandEq2Label ? demandEq2Label.textContent : "-";
    if (analysisDemandGovLabel) analysisDemandGovLabel.textContent = demandGovLabel ? demandGovLabel.textContent : (method === "LRFD" ? "Tu" : "Ta");
    if (analysisDemand1) analysisDemand1.value = demandEq1 ? demandEq1.value : fmt(0, 3);
    if (analysisDemand2) analysisDemand2.value = demandEq2 ? demandEq2.value : "-";
    if (analysisDemandGov) analysisDemandGov.value = demandGov ? demandGov.value : fmt(demand, 3);

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

    var ubs = 1.0;
    // AISC block shear nominal strengths (simplified)
    var rn1 = 0.6 * fu * avn + ubs * fu * ant;
    var rn2 = 0.6 * fy * avg + ubs * fu * ant;
    var rn = Math.min(rn1, rn2);
    var phiBs = 0.75;
    var omegaBs = 2.0;
    var bsCap = method === "LRFD" ? phiBs * rn : rn / omegaBs;
    if (analysisBlockShearCap) analysisBlockShearCap.value = fmt(bsCap, 3);

    var govCap = Math.min(yieldCap, fracCap, bsCap);
    var isSafe = govCap >= demand && demand > 0;
    if (analysisGoverningDisplay) analysisGoverningDisplay.textContent = fmt(govCap, 3) + " kips";
    if (analysisSafetyStatus) analysisSafetyStatus.textContent = demand === 0 ? "--" : (isSafe ? "SAFE" : "UNSAFE");

    // Staggered panel uses critical An
    var stagAn = criticalAn ? num(criticalAn.value, NaN) : NaN;
    if (Number.isFinite(stagAn)) {
      var stagAe = uGov * Math.max(0.0001, stagAn);
      var fracCapStag = method === "LRFD" ? phiR * fu * stagAe * stressFactor : (fu * stagAe * stressFactor) / omegaR;
      var govCapStag = Math.min(yieldCap, fracCapStag, bsCap);
      var safeStag = govCapStag >= demand && demand > 0;
      if (analysisGoverningDisplayStag) analysisGoverningDisplayStag.textContent = fmt(govCapStag, 3) + " kips";
      if (analysisSafetyStatusStag) analysisSafetyStatusStag.textContent = demand === 0 ? "--" : (safeStag ? "SAFE" : "UNSAFE");
    }
  }

  function calcStaggered() {
    var s = shapeData();
    var ag = num(shapeAg.value || s.Ag, s.Ag);
    var dHole = num(calcBoltDiameter(), 0);
    var g1Val = num(g1.value, 0);
    var g2Val = num(g2.value, 0);
    var sg1Val = num(sg1.value, 0);
    var t = num(shapeT.value || s.t, s.t);

    var base = Math.max(0, ag - dHole * t * Math.max(1, num(gageLines.value, 1)));
    var p1 = base + (g2Val === 0 ? 0 : (sg1Val * sg1Val) / Math.max(1, 4 * g1Val));
    var p2 = base + (sg1Val * sg1Val) / Math.max(1, 4 * Math.max(0.0001, g1Val + g2Val));
    var p3 = base + (sg1Val * sg1Val) / Math.max(1, 4 * Math.max(0.0001, g1Val - g2Val || g1Val));
    var crit = Math.min(p1, p2, p3);
    path1.value = fmt(p1, 4);
    path2.value = fmt(p2, 4);
    path3.value = fmt(p3, 4);
    criticalAn.value = fmt(crit, 4);
  }

  function renderConnectionImage() {
    var src = connectionImageByType[connectionSelect.value] || connectionImageByType.WEB;
    if (connImage) connImage.src = src;
  }

  function recomputeAll() {
    syncSteelFields();
    calcBoltDiameter();
    calcU();
    calcDemandAndAreas();
    mirrorDesignToAnalysis();
    renderConnectionImage();
    calcNonStaggered();
    calcStaggered();
  }

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
    shapeSelect,
    plateThickness,
    stressType,
    unsupportedLc,
    plateLengthIn,
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

  initSteelOptions();
  populateShapes();
  setView("design");
  setAnalysisMode("non");
  recomputeAll();
})();

