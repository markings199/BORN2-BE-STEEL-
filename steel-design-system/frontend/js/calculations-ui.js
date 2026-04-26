/* Wire calculation forms to SteelCalculator API (requires server running). */
(function () {
  "use strict";

  var SC = window.SteelCalculator;
  var API = window.SteelAPI;
  if (!SC) return;

  // #region agent log
  function sendCompressionDebugLog(hypothesisId, location, message, data, runId) {
    fetch("http://127.0.0.1:7885/ingest/0499c47d-70cd-429d-a2ae-82b51e1ec3cb", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "be761d",
      },
      body: JSON.stringify({
        sessionId: "be761d",
        runId: runId || "baseline",
        hypothesisId: hypothesisId,
        location: location,
        message: message,
        data: data || {},
        timestamp: Date.now(),
      }),
    }).catch(function () {});
  }
  // #region agent log
  function sendCompressionLayoutDebugLog(runId, hypothesisId, location, message, data) {
    fetch("http://127.0.0.1:7885/ingest/0499c47d-70cd-429d-a2ae-82b51e1ec3cb", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "a84312",
      },
      body: JSON.stringify({
        sessionId: "a84312",
        runId: runId || "pre-fix",
        hypothesisId: hypothesisId,
        location: location,
        message: message,
        data: data || {},
        timestamp: Date.now(),
      }),
    }).catch(function () {});
  }
  // #endregion
  // #endregion

  // #region agent log
  function logCompressionAGoverningUserGuide(runId, source) {
    try {
      var analysisView = document.querySelector("#compressionSection .compression-analysis-view");
      var cap = analysisView ? analysisView.querySelector(".compression-analysis-capacity") : null;
      var guide = cap ? cap.querySelector(".compression-analysis-user-guide") : null;
      var rect = guide ? guide.getBoundingClientRect() : null;
      var h4 = cap ? cap.querySelector("h4") : null;
      var safe = cap ? cap.querySelector(".safe-name") : null;
      var row = cap ? cap.querySelector(".t-row") : null;
      function h(el) {
        if (!el || !el.getBoundingClientRect) return null;
        return Math.round(el.getBoundingClientRect().height);
      }
      var capH = cap ? Math.round(cap.getBoundingClientRect().height) : null;
      var usedH = 0;
      [h4, safe, row, guide].forEach(function (el) {
        var hh = h(el);
        if (typeof hh === "number") usedH += hh;
      });
      var leftover = typeof capH === "number" ? Math.max(0, capH - usedH) : null;
      sendCompressionLayoutDebugLog(
        runId || "pre-fix",
        "UG2",
        "js/calculations-ui.js:logCompressionAGoverningUserGuide",
        "Governing Capacity user guide geometry",
        {
          source: source || null,
          found: !!guide,
          guideTextHead: guide ? String(guide.textContent || "").trim().slice(0, 120) : null,
          capClientH: cap ? cap.clientHeight : null,
          capScrollH: cap ? cap.scrollHeight : null,
          capRectH: capH,
          partsH: { h4: h(h4), safeName: h(safe), tuRow: h(row), guide: h(guide) },
          leftoverH: leftover,
          guideRect: rect
            ? {
                top: Math.round(rect.top),
                bottom: Math.round(rect.bottom),
                w: Math.round(rect.width),
                h: Math.round(rect.height),
              }
            : null,
          viewport: { w: window.innerWidth, h: window.innerHeight },
        }
      );
    } catch (e) {}
  }
  // #endregion

  // #region agent log
  function logCompressionACriticalSlendernessGrid(runId, source) {
    try {
      var card = document.querySelector(
        "#compressionSection .compression-analysis-view .compression-slender-card"
      );
      var head = card ? card.querySelector(".compression-slen-head") : null;
      var rows = card ? card.querySelectorAll(".compression-slen-row") : [];
      function css(el) {
        if (!el || !window.getComputedStyle) return null;
        var c = window.getComputedStyle(el);
        return {
          gridTemplateColumns: c.gridTemplateColumns,
          gap: c.gap,
          fontSize: c.fontSize,
          alignItems: c.alignItems,
        };
      }
      var rowChildCounts = [];
      Array.prototype.forEach.call(rows, function (r) {
        rowChildCounts.push(r.children ? r.children.length : null);
      });
      sendCompressionLayoutDebugLog(
        runId || "pre-fix",
        "CSR1",
        "js/calculations-ui.js:logCompressionACriticalSlendernessGrid",
        "Critical Slenderness Ratio grid structure",
        {
          source: source || null,
          hasCard: !!card,
          headChildren: head && head.children ? head.children.length : null,
          rowCount: rows ? rows.length : null,
          rowChildCounts: rowChildCounts,
          headCss: css(head),
          rowCss: rows && rows[0] ? css(rows[0]) : null,
          viewport: { w: window.innerWidth, h: window.innerHeight },
        }
      );
    } catch (e) {}
  }
  // #endregion

  // #region agent log
  function logCompressionDesignBottomClip(runId, source) {
    try {
      var section = document.getElementById("compressionSection");
      var shell = section ? section.querySelector(".compression-shell") : null;
      var view = section ? section.querySelector(".compression-design-view") : null;
      var centerPanel = document.querySelector(".center-panel");
      var lastCard = view ? view.querySelector(".compression-col-right > :last-child") : null;
      function rect(el) {
        if (!el || !el.getBoundingClientRect) return null;
        var r = el.getBoundingClientRect();
        return { top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height), w: Math.round(r.width) };
      }
      function css(el) {
        if (!el || !window.getComputedStyle) return null;
        var c = window.getComputedStyle(el);
        return { overflow: c.overflow, overflowY: c.overflowY, overflowX: c.overflowX, height: c.height, paddingBottom: c.paddingBottom, display: c.display };
      }
      sendCompressionLayoutDebugLog(
        runId || "pre-fix",
        "D_CLIP1",
        "js/calculations-ui.js:logCompressionDesignBottomClip",
        "Compression Design bottom border clipping diagnostics",
        {
          source: source || null,
          isAnalysisTab: section ? section.classList.contains("is-analysis-tab") : null,
          shell: shell ? { rect: rect(shell), css: css(shell), scrollH: shell.scrollHeight, clientH: shell.clientHeight } : null,
          designView: view ? { rect: rect(view), css: css(view), scrollH: view.scrollHeight, clientH: view.clientHeight } : null,
          centerPanel: centerPanel
            ? { rect: rect(centerPanel), css: css(centerPanel), scrollH: centerPanel.scrollHeight, clientH: centerPanel.clientHeight }
            : null,
          lastRightCard: lastCard ? { rect: rect(lastCard), css: css(lastCard) } : null,
          viewport: { w: window.innerWidth, h: window.innerHeight },
        }
      );
    } catch (e) {}
  }
  // #endregion

  // #region agent log
  function logCompressionDesignBoxBorders(runId, source) {
    try {
      var section = document.getElementById("compressionSection");
      if (!section || section.classList.contains("is-analysis-tab")) return;
      var design = section.querySelector(".compression-design-view.is-active");
      var elasticInput = design ? design.querySelector('.compression-given-box input[name="E"]') : null;
      var elasticRow = elasticInput ? elasticInput.closest(".compression-given-value-row") : null;
      var elasticBox = elasticInput ? elasticInput.closest(".compression-given-box") : null;
      var lightest = section.querySelector(".compression-col-right .compression-safe-card");
      function rect(el) {
        if (!el || !el.getBoundingClientRect) return null;
        var r = el.getBoundingClientRect();
        return { top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height), w: Math.round(r.width) };
      }
      function css(el) {
        if (!el || !window.getComputedStyle) return null;
        var c = window.getComputedStyle(el);
        return {
          overflow: c.overflow,
          overflowY: c.overflowY,
          height: c.height,
          paddingBottom: c.paddingBottom,
          boxSizing: c.boxSizing,
          display: c.display,
          borderBottomWidth: c.borderBottomWidth,
          borderBottomStyle: c.borderBottomStyle,
          borderBottomColor: c.borderBottomColor,
          boxShadow: c.boxShadow,
        };
      }
      sendCompressionLayoutDebugLog(
        runId || "pre-fix",
        "D_BOX1",
        "js/calculations-ui.js:logCompressionDesignBoxBorders",
        "Compression Design: Elastic Modulus + Lightest Adequate Section border visibility",
        {
          source: source || null,
          elastic: {
            input: elasticInput ? { rect: rect(elasticInput), css: css(elasticInput) } : null,
            row: elasticRow ? { rect: rect(elasticRow), css: css(elasticRow) } : null,
            box: elasticBox ? { rect: rect(elasticBox), css: css(elasticBox) } : null,
          },
          lightest: lightest ? { rect: rect(lightest), css: css(lightest) } : null,
          design: design ? { rect: rect(design), css: css(design) } : null,
          viewport: { w: window.innerWidth, h: window.innerHeight },
        }
      );
    } catch (e) {}
  }
  // #endregion

  function bodyFromForm(form) {
    var fd = new FormData(form);
    var o = {};
    fd.forEach(function (v, k) {
      if (v === "" || v == null) return;
      var n = Number(v);
      o[k] = Number.isFinite(n) ? n : v;
    });
    return o;
  }

  function showResult(el, data, isErr) {
    if (!el) return;
    el.classList.toggle("is-error", !!isErr);
    if (isErr || typeof data === "string") {
      el.textContent = String(data);
      return;
    }
    // Tension Rod page: keep result output compact (single value)
    if (el.id === "resultTensionRod") {
      var v = pickPrimaryNumber(data);
      el.textContent = v == null ? "" : formatNumber(v);
      return;
    }
    el.textContent = formatResult(data);
  }

  function pickPrimaryNumber(data) {
    try {
      var d = data && typeof data === "object" ? data : null;
      if (!d) return null;
      var r = d.result && typeof d.result === "object" ? d.result : d;

      // Common candidates (try in order)
      var candidates = [
        "requiredDiameter",
        "required_diameter",
        "diameter",
        "D",
        "d",
        "phiPn",
        "Pn",
        "Tu",
        "requiredAb",
        "required_Ab",
        "Ab",
      ];
      for (var i = 0; i < candidates.length; i++) {
        var k = candidates[i];
        if (r && typeof r[k] === "number" && Number.isFinite(r[k])) return r[k];
      }

      // Fallback: first numeric found in nested result object
      var lines = [];
      pushNumericLines(r, lines, "");
      if (!lines.length) return null;
      var m = String(lines[0]).match(/:\s*([0-9][0-9,]*\.?[0-9]*)\s*$/);
      if (m) {
        var n = Number(String(m[1]).replace(/,/g, ""));
        return Number.isFinite(n) ? n : null;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  function syncCompressionSummaryFields() {
    var safeSection = document.getElementById("compressionSafeSection");
    var probableSection = document.getElementById("compressionProbableSection");
    var safeRemarkInput = document.getElementById("compressionSafeRemark");
    var safeRemarkLabel = document.getElementById("compressionSafeRemarkLabel");
    if (safeSection && probableSection) {
      var safeName = (safeSection.textContent || "").trim();
      // Preserve reference-style default probable section until a real computed value exists.
      if (safeName && safeName !== "--") probableSection.textContent = safeName;
    }
    if (safeRemarkInput && safeRemarkLabel) {
      var safeRemark = (safeRemarkInput.value || "").trim();
      // Keep baseline SAFE label unless compute returns a definitive remark.
      if (safeRemark && safeRemark !== "--") safeRemarkLabel.textContent = safeRemark;
    }
  }

  function toLabel(key) {
    return String(key)
      .replace(/_/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/\s+/g, " ")
      .trim();
  }

  function formatNumber(value) {
    if (!Number.isFinite(value)) return String(value);
    var rounded = Number(value.toFixed(4));
    return rounded.toLocaleString("en-US", { maximumFractionDigits: 4 });
  }

  function pushNumericLines(obj, lines, prefix) {
    if (!obj || typeof obj !== "object") return;

    Object.keys(obj).forEach(function (key) {
      var val = obj[key];
      var path = prefix ? prefix + " " + toLabel(key) : toLabel(key);

      if (typeof val === "number") {
        lines.push(path + ": " + formatNumber(val));
        return;
      }

      if (val && typeof val === "object" && !Array.isArray(val)) {
        pushNumericLines(val, lines, path);
      }
    });
  }

  function formatResult(data) {
    var src = data && typeof data === "object" ? data : {};
    var result = src.result && typeof src.result === "object" ? src.result : src;
    var lines = [];
    var sectionOrder = ["nominal", "design", "utilization", "slenderness", "properties"];

    sectionOrder.forEach(function (sectionName) {
      if (!result[sectionName] || typeof result[sectionName] !== "object") return;
      lines.push(toLabel(sectionName).toUpperCase());
      pushNumericLines(result[sectionName], lines, "");
      lines.push("");
    });

    // Fallback: if no known sections, show all numeric outputs.
    if (!lines.length) {
      pushNumericLines(result, lines, "");
    }

    return lines.join("\n").trim() || "No numeric result available.";
  }

  function bindSubmit(formId, computeFn, resultId) {
    var form = document.getElementById(formId);
    var out = document.getElementById(resultId);
    if (!form || !out) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var payload = bodyFromForm(form);
      // #region agent log
      if (formId === "formCompression") {
        sendCompressionDebugLog(
          "H3",
          "js/calculations-ui.js:bindSubmit:submit",
          "Compression submit triggered",
          {
            payloadKeys: Object.keys(payload),
            hasFy: typeof payload.Fy === "number",
            hasAg: typeof payload.Ag === "number",
            hasK: typeof payload.K === "number",
            hasL: typeof payload.L === "number",
            hasR: typeof payload.r === "number",
          }
        );
      }
      // #endregion
      computeFn(payload)
        .then(function (r) {
          showResult(out, r, false);
          if (formId === "formCompression") syncCompressionSummaryFields();
          // #region agent log
          if (formId === "formCompression") {
            sendCompressionDebugLog(
              "H4",
              "js/calculations-ui.js:bindSubmit:success",
              "Compression compute success",
              {
                resultType: typeof r,
                hasResultObject: !!(r && r.result && typeof r.result === "object"),
                safeSection: document.getElementById("compressionSafeSection")
                  ? document.getElementById("compressionSafeSection").textContent
                  : null,
                safeRemark: document.getElementById("compressionSafeRemark")
                  ? document.getElementById("compressionSafeRemark").value
                  : null,
              }
            );
          }
          // #endregion
        })
        .catch(function (err) {
          showResult(out, err.message || String(err), true);
          // #region agent log
          if (formId === "formCompression") {
            sendCompressionDebugLog(
              "H4",
              "js/calculations-ui.js:bindSubmit:error",
              "Compression compute failed",
              { error: err && err.message ? err.message : String(err) }
            );
          }
          // #endregion
        });
    });
  }

  bindSubmit("formTension", SC.tension.bind(SC), "resultTension");
  bindSubmit("formCompression", SC.compression.bind(SC), "resultCompression");
  bindSubmit("formTensionRod", SC.tensionRod.bind(SC), "resultTensionRod");
  bindSubmit("formBending", SC.bending.bind(SC), "resultBending");
  bindSubmit("formShear", SC.shear.bind(SC), "resultShear");

  document.querySelectorAll("[data-fill-steel]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var g = window.Born2BeSteel && Born2BeSteel.getSelectedGrade();
      if (!g) return;
      var form = btn.closest("form");
      if (!form) return;
      var inp = form.querySelector('[name="Fy"]');
      if (inp) inp.value = String(g.fy);
      // #region agent log
      if (form && form.id === "formCompression") {
        sendCompressionDebugLog(
          "H5",
          "js/calculations-ui.js:data-fill-steel",
          "Compression Fy autofill used",
          { selectedGrade: g.astm, fyValue: g.fy }
        );
      }
      // #endregion
    });
  });

  // #region agent log
  function snapshotCompressionLayout(source) {
    var section = document.getElementById("compressionSection");
    if (!section || !section.classList.contains("active-panel")) return;
    var shell = section.querySelector(".compression-shell");
    var form = document.getElementById("formCompression");
    var topGrid = form ? form.querySelector(".tension-grid-3") : null;
    var bottomGrid = form ? form.querySelector(".tension-grid-2") : null;
    var tabs = form ? form.querySelectorAll(".compression-top-tabs .compression-tab") : null;
    sendCompressionDebugLog(
      "H1-H2-H6",
      "js/calculations-ui.js:snapshotCompressionLayout",
      "Compression layout snapshot",
      {
        source: source,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        cardCount: form ? form.querySelectorAll(".tension-card").length : 0,
        rowCount: form ? form.querySelectorAll(".t-row").length : 0,
        hasGuide: !!(form && form.querySelector(".tension-guide")),
        topGridChildren: topGrid ? topGrid.children.length : 0,
        bottomGridChildren: bottomGrid ? bottomGrid.children.length : 0,
        shellClass: shell ? shell.className : null,
        tabCount: tabs ? tabs.length : 0,
        tabLabels: tabs
          ? Array.prototype.map.call(tabs, function (tab) {
              return String(tab.textContent || "").trim();
            })
          : [],
      }
    );
  }
  window.addEventListener("hashchange", function () {
    snapshotCompressionLayout("hashchange");
  });
  window.addEventListener("load", function () {
    snapshotCompressionLayout("load");
    syncCompressionSummaryFields();
  });
  // Capture tab behavior for compression mode switching diagnostics.
  window.addEventListener("load", function () {
    var section = document.getElementById("compressionSection");
    if (!section) return;
    var tabs = section.querySelectorAll(".compression-top-tabs .compression-tab");
    var designView = section.querySelector(".compression-design-view");
    var analysisView = section.querySelector(".compression-analysis-view");
    function n(id, fallback) {
      var el = document.getElementById(id);
      if (!el) return Number(fallback || 0);
      var v = Number(el.value);
      return Number.isFinite(v) ? v : Number(fallback || 0);
    }
    function setValue(id, value, digits) {
      var el = document.getElementById(id);
      if (!el) return;
      var d = typeof digits === "number" ? digits : 4;
      el.value = Number(value).toFixed(d);
    }
    function setText(id, text) {
      var el = document.getElementById(id);
      if (!el) return;
      el.textContent = String(text);
    }
    function setClassLabel(id, isCompact, compactLabel, slenderLabel) {
      var el = document.getElementById(id);
      if (!el) return;
      el.textContent = isCompact ? compactLabel : slenderLabel;
    }
    function computeCompressionAnalysis(runId) {
      var kx1 = n("compressionAKx1", 1);
      var lx1 = n("compressionALx1", 50);
      var ky1 = n("compressionAKy1", 1);
      var ly1 = n("compressionALy1", 28);
      var rx = Math.max(0.0001, n("compressionARx", 12));
      var ry = Math.max(0.0001, n("compressionARy", 3.39));
      var E = Math.max(0.0001, n("compressionAE", 29000));
      var Fy = Math.max(0.0001, n("compressionAFy", 50));
      var Ag = Math.max(0.0001, n("compressionAAg", 83.1));
      var flangeLr = Math.max(0.0001, n("compressionAFlangeLr", 8.12));
      var flangeL = Math.max(0.0001, n("compressionAFlangeL", 13.4866));
      var webLr = Math.max(0.0001, n("compressionAWebLr", 25.9));
      var webL = Math.max(0.0001, n("compressionAWebL", 35.884));

      var KLx1 = kx1 * lx1;
      var KLy1 = ky1 * ly1;
      var klrX = (KLx1 * 12) / rx;
      var klrY = (KLy1 * 12) / ry;
      var klrGov = Math.max(klrX, klrY);
      var KLgov = klrGov === klrX ? KLx1 : KLy1;

      var Fe = (Math.PI * Math.PI * E) / (klrGov * klrGov);
      var FeSafe = Math.max(0.0001, Fe);
      var transition = 4.71 * Math.sqrt(E / Fy);
      var Fcr = klrGov <= transition ? Math.pow(0.658, Fy / FeSafe) * Fy : 0.877 * FeSafe;
      var Fn = Fcr * Ag;
      var Tu = 0.9 * Fn;

      var isFlangeCompact = flangeL <= flangeLr;
      var isWebCompact = webL <= webLr;

      setText("compressionAKLx1", Number(KLx1.toFixed(3)));
      setText("compressionAKLy1", Number(KLy1.toFixed(3)));
      setText("compressionAKLrGov", Number(klrGov.toFixed(4)));
      setText("compressionAKLGov", "KL = " + Number(KLgov.toFixed(3)));
      setText("compressionASlenRx", Number(rx.toFixed(3)));
      setText("compressionASlenRy", Number(ry.toFixed(3)));
      setText("compressionAKLrX", Number(klrX.toFixed(2)));
      setText("compressionAKLrY", Number(klrY.toFixed(2)));
      setClassLabel("compressionAFlangeClass", isFlangeCompact, "Compact Flange", "Slender Flange");
      setClassLabel("compressionAWebClass", isWebCompact, "Compact Web", "Slender Web");
      setValue("compressionAFe", FeSafe, 4);
      setValue("compressionAFcr", Fcr, 4);
      setValue("compressionAFn", Fn, 4);
      setValue("compressionATu", Tu, 4);
      setText("compressionATuDisplay", Number(Tu.toFixed(4)));
      // Note: λf and λw are section-selection properties; do not overwrite them here.

      // #region agent log
      sendCompressionLayoutDebugLog(
        runId || "pre-fix",
        "H20-H24",
        "js/calculations-ui.js:computeCompressionAnalysis",
        "Compression analysis live-calculation snapshot",
        {
          inputs: {
            kx1: kx1,
            lx1: lx1,
            ky1: ky1,
            ly1: ly1,
            rx: rx,
            ry: ry,
            E: E,
            Fy: Fy,
            Ag: Ag,
            flangeLr: flangeLr,
            flangeL: flangeL,
            webLr: webLr,
            webL: webL
          },
          outputs: {
            KLx1: KLx1,
            KLy1: KLy1,
            klrX: klrX,
            klrY: klrY,
            klrGov: klrGov,
            KLgov: KLgov,
            Fe: FeSafe,
            Fcr: Fcr,
            Fn: Fn,
            Tu: Tu
          },
          checks: {
            flangeCompact: isFlangeCompact,
            webCompact: isWebCompact,
            klEquationXPass: Math.abs(KLx1 - kx1 * lx1) < 1e-9,
            klEquationYPass: Math.abs(KLy1 - ky1 * ly1) < 1e-9
          }
        }
      );
      // #endregion

      // #region agent log
      (function verifyCompressionAnalysisDomSync() {
        function getNumValue(id) {
          var el = document.getElementById(id);
          if (!el) return null;
          var raw = "value" in el ? el.value : el.textContent;
          var num = Number(raw);
          return Number.isFinite(num) ? num : null;
        }
        function getText(id) {
          var el = document.getElementById(id);
          if (!el) return null;
          return String(el.textContent || "").trim();
        }
        var dom = {
          KLx1: getNumValue("compressionAKLx1"),
          KLy1: getNumValue("compressionAKLy1"),
          klrGov: getNumValue("compressionAKLrGov"),
          KLGovText: getText("compressionAKLGov"),
          Fe: getNumValue("compressionAFe"),
          Fcr: getNumValue("compressionAFcr"),
          Fn: getNumValue("compressionAFn"),
          Tu: getNumValue("compressionATu"),
          TuDisplay: getNumValue("compressionATuDisplay"),
          flangeClass: getText("compressionAFlangeClass"),
          webClass: getText("compressionAWebClass"),
        };
        var tol = 1e-3;
        function close(a, b) {
          if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
          return Math.abs(a - b) <= tol;
        }
        sendCompressionLayoutDebugLog(
          runId || "pre-fix",
          "F_DOMSYNC",
          "js/calculations-ui.js:computeCompressionAnalysis:verifyCompressionAnalysisDomSync",
          "Verify analysis computed outputs match DOM",
          {
            dom: dom,
            expected: { KLx1: KLx1, KLy1: KLy1, klrGov: klrGov, Fe: FeSafe, Fcr: Fcr, Fn: Fn, Tu: Tu },
            pass: {
              KLx1: close(dom.KLx1, Number(KLx1.toFixed(3))),
              KLy1: close(dom.KLy1, Number(KLy1.toFixed(3))),
              klrGov: close(dom.klrGov, Number(klrGov.toFixed(4))),
              Fe: close(dom.Fe, Number(FeSafe.toFixed(4))),
              Fcr: close(dom.Fcr, Number(Fcr.toFixed(4))),
              Fn: close(dom.Fn, Number(Fn.toFixed(4))),
              Tu: close(dom.Tu, Number(Tu.toFixed(4))),
              TuDisplay: close(dom.TuDisplay, Number(Tu.toFixed(4))),
            },
            anyNull: Object.keys(dom).some(function (k) {
              return dom[k] === null;
            }),
          }
        );
      })();
      // #endregion
    }
    function bindCompressionAnalysisInputs() {
      var ids = [
        "compressionAFy",
        "compressionAFu",
        "compressionAE",
        "compressionAAg",
        "compressionAFlangeLr",
        "compressionAFlangeL",
        "compressionAWebLr",
        "compressionAWebL",
        "compressionAKx1",
        "compressionALx1",
        "compressionAKy1",
        "compressionALy1"
      ];
      ids.forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        el.addEventListener("input", function () {
          computeCompressionAnalysis("pre-fix");
        });
        el.addEventListener("change", function () {
          computeCompressionAnalysis("pre-fix");
        });
      });
      computeCompressionAnalysis("pre-fix");
    }

    function initCompressionAnalysisSectionSelection() {
      var shapeSel = document.getElementById("compressionAShapeSelect");
      var listHost = document.getElementById("compressionAAiscList");
      if (!shapeSel || !listHost) return;

      // Minimal in-UI dataset (scoped to Analysis Section Selection only).
      var DATA = {
        W: [
          { label: "W27X217", rx: 12.0, ry: 3.39, Ag: 83.1, lf: 22.5, lw: 3.72 },
          { label: "W27X235", rx: 12.0, ry: 3.39, Ag: 83.1, lf: 22.5, lw: 3.72 },
          { label: "W27X258", rx: 12.0, ry: 3.39, Ag: 83.1, lf: 22.5, lw: 3.72 },
          { label: "W27X281", rx: 12.0, ry: 3.39, Ag: 83.1, lf: 22.5, lw: 3.72 },
          { label: "W8X24", rx: 12.0, ry: 3.39, Ag: 83.1, lf: 22.5, lw: 3.72 },
        ],
      };

      function setOut(id, value, digits) {
        var el = document.getElementById(id);
        if (!el) return;
        el.value = typeof digits === "number" ? Number(value).toFixed(digits) : String(value);
      }
      function pickShapeFamily(fam) {
        var rows = DATA[fam] || [];
        listHost.innerHTML = "";
        rows.forEach(function (row, idx) {
          var wrap = document.createElement("div");
          wrap.className = "compressionA-list-row" + (idx === 0 ? " is-selected" : "");
          wrap.setAttribute("role", "option");
          wrap.setAttribute("aria-selected", idx === 0 ? "true" : "false");
          wrap.dataset.label = row.label;
          wrap.dataset.rx = String(row.rx);
          wrap.dataset.ry = String(row.ry);
          wrap.dataset.ag = String(row.Ag);
          wrap.dataset.lf = String(row.lf);
          wrap.dataset.lw = String(row.lw);
          var c1 = document.createElement("span");
          c1.textContent = row.label;
          var c2 = document.createElement("span");
          c2.textContent = row.label; // mirrored column like reference list
          wrap.appendChild(c1);
          wrap.appendChild(c2);
          wrap.addEventListener("click", function () {
            setSelectedRow(wrap, fam);
          });
          listHost.appendChild(wrap);
        });
        if (rows[0]) {
          setSelectedRow(listHost.firstChild, fam);
        }
      }
      function setSelectedRow(rowEl, fam) {
        if (!rowEl) return;
        Array.prototype.forEach.call(listHost.querySelectorAll(".compressionA-list-row"), function (r) {
          r.classList.remove("is-selected");
          r.setAttribute("aria-selected", "false");
        });
        rowEl.classList.add("is-selected");
        rowEl.setAttribute("aria-selected", "true");

        var label = rowEl.dataset.label || "";
        setOut("compressionAShapeType", fam);
        setOut("compressionAShapeLabel", label);
        setOut("compressionARx", rowEl.dataset.rx || "0", 2);
        setOut("compressionARy", rowEl.dataset.ry || "0", 2);
        setOut("compressionAAg", rowEl.dataset.ag || "0", 1);
        setOut("compressionALf", rowEl.dataset.lf || "0", 4);
        setOut("compressionALw", rowEl.dataset.lw || "0", 4);

        // Keep analysis computations up to date with new section properties.
        computeCompressionAnalysis("pre-fix");

        // #region agent log
        sendCompressionLayoutDebugLog(
          "pre-fix",
          "H_SECSEL",
          "js/calculations-ui.js:initCompressionAnalysisSectionSelection",
          "Section Selection changed",
          {
            family: fam,
            label: label,
            rx: rowEl.dataset.rx,
            ry: rowEl.dataset.ry,
            Ag: rowEl.dataset.ag,
            lf: rowEl.dataset.lf,
            lw: rowEl.dataset.lw,
          }
        );
        // #endregion
      }

      shapeSel.addEventListener("change", function () {
        pickShapeFamily(shapeSel.value || "W");
      });

      pickShapeFamily(shapeSel.value || "W");
    }
    function setCompressionTabState(isAnalysis) {
      section.classList.toggle("is-analysis-tab", !!isAnalysis);
      if (designView) designView.classList.toggle("is-active", !isAnalysis);
      if (analysisView) analysisView.classList.toggle("is-active", !!isAnalysis);
      // #region agent log
      (function syncAnalysisHorizontalOverflow() {
        var centerPanel = document.querySelector(".center-panel");
        if (!centerPanel) return;
        if (isAnalysis) centerPanel.style.overflowX = "auto";
        else centerPanel.style.overflowX = "hidden";
        sendCompressionLayoutDebugLog(
          "pre-fix",
          "H_XSCROLL",
          "js/calculations-ui.js:setCompressionTabState",
          "Center panel horizontal overflow toggled",
          { isAnalysis: !!isAnalysis, overflowX: centerPanel.style.overflowX || null }
        );
      })();
      // #endregion
      // #region agent log
      sendCompressionDebugLog(
        "H15-H16",
        "js/calculations-ui.js:setCompressionTabState",
        "Compression tab state applied",
        {
          requestedAnalysis: !!isAnalysis,
          designViewActive: !!(designView && designView.classList.contains("is-active")),
          analysisViewActive: !!(analysisView && analysisView.classList.contains("is-active")),
          probableSectionText: document.getElementById("compressionProbableSection")
            ? document.getElementById("compressionProbableSection").textContent
            : null,
          probableRemarkText: document.getElementById("compressionSafeRemarkLabel")
            ? document.getElementById("compressionSafeRemarkLabel").textContent
            : null,
        }
      );
      // #region agent log
      if (analysisView && analysisView.classList.contains("is-active")) {
        var viewStyle = window.getComputedStyle(analysisView);
        var cols = analysisView.querySelectorAll(".compression-col");
        var visibleCols = Array.prototype.filter.call(cols, function (col) {
          return window.getComputedStyle(col).display !== "none";
        }).length;
        sendCompressionLayoutDebugLog(
          "pre-fix",
          "H1-H2-H3-H4",
          "js/calculations-ui.js:setCompressionTabState",
          "Compression analysis panel runtime visibility",
          {
            sectionHasAnalysisClass: section.classList.contains("is-analysis-tab"),
            analysisViewActive: analysisView.classList.contains("is-active"),
            analysisDisplay: viewStyle.display,
            analysisMinHeight: viewStyle.minHeight,
            analysisPosition: viewStyle.position,
            analysisBorderStyle: viewStyle.borderStyle,
            analysisBg: viewStyle.backgroundColor,
            totalColumns: cols.length,
            visibleColumns: visibleCols,
          }
        );
        // #region agent log
        (function logAnalysisOverflow() {
          var shell = section.querySelector(".compression-shell");
          var centerPanel = document.querySelector(".center-panel");
          var analysisTypes = analysisView.querySelector(".compression-analysis-type-card");
          var slender = analysisView.querySelector(".compression-slender-card");
          var leftCol = analysisView.querySelector(".compression-col-left");
          var methodCard = leftCol ? leftCol.querySelector(".compression-card") : null;
          var inputCard = leftCol ? leftCol.querySelector(".compression-analysis-input") : null;
          var imageCard = analysisTypes;
          var img = imageCard ? imageCard.querySelector("img") : null;
          var rightCol = analysisView.querySelector(".compression-col-right");
          var compactnessCard = analysisView.querySelector(".compression-analysis-compactness");
          var compactMiniRow = compactnessCard ? compactnessCard.querySelector(".compression-mini-row") : null;
          var compactGrid = compactnessCard ? compactnessCard.querySelector(".compression-analysis-top-compact-grid") : null;
          function rect(el) {
            if (!el || !el.getBoundingClientRect) return null;
            var r = el.getBoundingClientRect();
            return {
              top: Math.round(r.top),
              bottom: Math.round(r.bottom),
              h: Math.round(r.height),
              w: Math.round(r.width),
            };
          }
          function css(el) {
            if (!el || !window.getComputedStyle) return null;
            var c = window.getComputedStyle(el);
            return {
              overflowY: c.overflowY,
              overflowX: c.overflowX,
              height: c.height,
              maxHeight: c.maxHeight,
              minHeight: c.minHeight,
              display: c.display,
              position: c.position,
              alignContent: c.alignContent,
              gridTemplateRows: c.gridTemplateRows,
            };
          }
          sendCompressionLayoutDebugLog(
            "pre-fix",
            "H_OVERFLOW_H_LEFT",
            "js/calculations-ui.js:setCompressionTabState:logAnalysisOverflow",
            "Analysis overflow + left column image diagnostics",
            {
              viewport: { w: window.innerWidth, h: window.innerHeight },
              centerPanel: centerPanel
                ? {
                    clientH: centerPanel.clientHeight,
                    scrollH: centerPanel.scrollHeight,
                    scrollTop: centerPanel.scrollTop,
                    rect: rect(centerPanel),
                    css: css(centerPanel),
                  }
                : null,
              shell: shell
                ? { clientH: shell.clientHeight, scrollH: shell.scrollHeight, rect: rect(shell), css: css(shell) }
                : null,
              analysisView: analysisView
                ? {
                    clientH: analysisView.clientHeight,
                    scrollH: analysisView.scrollHeight,
                    rect: rect(analysisView),
                    css: css(analysisView),
                  }
                : null,
              rightCol: rightCol
                ? {
                    rect: rect(rightCol),
                    css: css(rightCol),
                    scrollW: rightCol.scrollWidth,
                    clientW: rightCol.clientWidth,
                  }
                : null,
              compactness: compactnessCard
                ? {
                    rect: rect(compactnessCard),
                    css: css(compactnessCard),
                    grid: compactGrid
                      ? {
                          rect: rect(compactGrid),
                          css: css(compactGrid),
                        }
                      : null,
                    miniRow: compactMiniRow
                      ? {
                          rect: rect(compactMiniRow),
                          css: css(compactMiniRow),
                        }
                      : null,
                  }
                : null,
              leftCol: leftCol
                ? {
                    rect: rect(leftCol),
                    css: css(leftCol),
                    scrollH: leftCol.scrollHeight,
                    clientH: leftCol.clientHeight,
                  }
                : null,
              leftCards: {
                method: methodCard ? { rect: rect(methodCard), css: css(methodCard) } : null,
                input: inputCard ? { rect: rect(inputCard), css: css(inputCard) } : null,
                image: imageCard ? { rect: rect(imageCard), css: css(imageCard) } : null,
              },
              image: img
                ? {
                    rect: rect(img),
                    css: css(img),
                    natural: { w: img.naturalWidth || null, h: img.naturalHeight || null },
                    attr: { width: img.getAttribute("width"), height: img.getAttribute("height") },
                  }
                : null,
              analysisTypes: analysisTypes
                ? { rect: rect(analysisTypes), css: css(analysisTypes) }
                : null,
              slenderCard: slender ? { rect: rect(slender), css: css(slender) } : null,
            }
          );
        })();
        // #endregion
      }
      // #endregion
      // #endregion

      // #region agent log
      if (isAnalysis) {
        if (window.requestAnimationFrame) {
          window.requestAnimationFrame(function () {
            logCompressionAGoverningUserGuide("pre-fix", "setCompressionTabState");
            logCompressionACriticalSlendernessGrid("pre-fix", "setCompressionTabState");
          });
        } else {
          logCompressionAGoverningUserGuide("pre-fix", "setCompressionTabState-noRAF");
          logCompressionACriticalSlendernessGrid("pre-fix", "setCompressionTabState-noRAF");
        }
      }
      // #endregion

      // #region agent log
      if (!isAnalysis) {
        if (window.requestAnimationFrame) {
          window.requestAnimationFrame(function () {
            logCompressionDesignBottomClip("pre-fix", "setCompressionTabState");
            logCompressionDesignBoxBorders("pre-fix", "setCompressionTabState");
          });
        } else {
          logCompressionDesignBottomClip("pre-fix", "setCompressionTabState-noRAF");
          logCompressionDesignBoxBorders("pre-fix", "setCompressionTabState-noRAF");
        }
      }
      // #endregion
    }
    setCompressionTabState(false);
    sendCompressionDebugLog(
      "H7-H10",
      "js/calculations-ui.js:compression-tabs:init",
      "Compression tab diagnostics on load",
      {
        tabCount: tabs.length,
        activeTabCount: section.querySelectorAll(".compression-top-tabs .compression-tab.is-active").length,
        hasAnalysisTab: !!Array.prototype.find.call(tabs, function (t) {
          return String(t.textContent || "").toLowerCase().indexOf("analysis") !== -1;
        }),
        hasDesignTab: !!Array.prototype.find.call(tabs, function (t) {
          return String(t.textContent || "").toLowerCase().indexOf("design") !== -1;
        }),
        hasAnalysisPanel: !!analysisView,
        hasDesignPanel: !!designView,
      }
    );
    // #region agent log
    sendCompressionLayoutDebugLog(
      "pre-fix",
      "H5",
      "js/calculations-ui.js:compression-tabs:init",
      "Compression tab wiring snapshot",
      {
        tabCount: tabs.length,
        labels: Array.prototype.map.call(tabs, function (t) {
          return String(t.textContent || "").trim();
        }),
        hasDesignViewNode: !!designView,
        hasAnalysisViewNode: !!analysisView,
      }
    );
    // #endregion
    Array.prototype.forEach.call(tabs, function (tab, idx) {
      tab.addEventListener("click", function () {
        Array.prototype.forEach.call(tabs, function (x) {
          x.classList.remove("is-active");
        });
        tab.classList.add("is-active");
        setCompressionTabState(idx === 1);
        sendCompressionDebugLog(
          "H7-H10",
          "js/calculations-ui.js:compression-tabs:click",
          "Compression tab clicked",
          {
            index: idx,
            label: String(tab.textContent || "").trim(),
            hasActiveClass: tab.classList.contains("is-active"),
            activeTabCountAfter: section.querySelectorAll(".compression-top-tabs .compression-tab.is-active").length,
            isAnalysisMode: section.classList.contains("is-analysis-tab"),
            designViewActive: !!(designView && designView.classList.contains("is-active")),
            analysisViewActive: !!(analysisView && analysisView.classList.contains("is-active")),
          }
        );
        // #region agent log
        if (analysisView && analysisView.classList.contains("is-active")) {
          // Trigger another overflow snapshot after layout settles.
          if (window.requestAnimationFrame) {
            window.requestAnimationFrame(function () {
              sendCompressionLayoutDebugLog(
                "pre-fix",
                "H_OVERFLOW",
                "js/calculations-ui.js:compression-tabs:click",
                "Analysis overflow snapshot after tab click",
                { analysisScrollH: analysisView.scrollHeight, analysisClientH: analysisView.clientHeight }
              );
            });
          }
        }
        // #endregion
      });
    });
    bindCompressionAnalysisInputs();
    initCompressionAnalysisSectionSelection();

    // #region agent log
    function rectData(el) {
      if (!el || !el.getBoundingClientRect) return null;
      var r = el.getBoundingClientRect();
      return {
        w: Math.round(r.width),
        h: Math.round(r.height),
        top: Math.round(r.top),
        left: Math.round(r.left),
      };
    }
    function logCompressionDesignGeometry(source) {
      var design = section.querySelector(".compression-design-view");
      if (!design || !design.classList.contains("is-active")) return;
      var colLeft = design.querySelector(".compression-col-left");
      var colCenter = design.querySelector(".compression-col-center");
      var colRight = design.querySelector(".compression-col-right");
      var strip = section.querySelector(".compression-strip");
      var centerGuide = design.querySelector(".compression-guide-inline");
      var analysisImageCard = design.querySelector(".compression-analysis-type-card");
      var bottomGuide = design.querySelector(".compression-safe-guide");
      var methodCard = design.querySelector(".compression-col-left .compression-card");
      var givenCard = design.querySelector(".compression-col-left .compression-card:nth-child(2)");
      var givenStack = design.querySelector(".compression-given-stack");
      var givenBoxes = design.querySelectorAll(".compression-given-box");
      var elasticBox = design.querySelector(".compression-given-box:last-child");
      var elasticInput = elasticBox ? elasticBox.querySelector("input") : null;
      var probableCard = design.querySelector(".compression-col-center .compression-card");
      var probableScoped = design.querySelector(".compression-probable-card");
      var slenderScoped = design.querySelector(".compression-slender-card");
      var demandCard = design.querySelector(".compression-col-right .compression-mini-stack");
      var safeCard = design.querySelector(".compression-safe-card");
      sendCompressionDebugLog(
        "H11-H14",
        "js/calculations-ui.js:compression-geometry",
        "Compression design geometry snapshot",
        {
          source: source,
          viewport: { width: window.innerWidth, height: window.innerHeight },
          sectionAnalysisClass: section.classList.contains("is-analysis-tab"),
          stripRect: rectData(strip),
          columns: {
            left: rectData(colLeft),
            center: rectData(colCenter),
            right: rectData(colRight),
          },
          cards: {
            method: rectData(methodCard),
            probable: rectData(probableCard),
            probableScoped: rectData(probableScoped),
            slenderScoped: rectData(slenderScoped),
            demand: rectData(demandCard),
            safe: rectData(safeCard),
          },
          computed: {
            dashboardCols: window.getComputedStyle(design).gridTemplateColumns,
            dashboardGap: window.getComputedStyle(design).gap,
            safeNameText: document.getElementById("compressionSafeSection")
              ? document.getElementById("compressionSafeSection").textContent
              : null,
            hasCenterUserGuide: !!centerGuide,
            hasLeftAnalysisImageCard: !!analysisImageCard,
          },
        }
      );
      // #region agent log
      var designRect = rectData(design);
      var leftRect = rectData(colLeft);
      var centerRect = rectData(colCenter);
      var rightRect = rectData(colRight);
      var probableRect = rectData(probableScoped || probableCard);
      var slenderRect = rectData(slenderScoped);
      var safeRect = rectData(safeCard);
      var designStyles = window.getComputedStyle(design);
      fetch("http://127.0.0.1:7885/ingest/0499c47d-70cd-429d-a2ae-82b51e1ec3cb",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"be761d"},body:JSON.stringify({sessionId:"be761d",runId:"pre-fix",hypothesisId:"H-A-reflow-overrides",location:"js/calculations-ui.js:logCompressionDesignGeometry",message:"Check if active grid is overridden by reflow/fixed template",data:{source:source,gridTemplateColumns:designStyles.gridTemplateColumns,columnGap:designStyles.columnGap,rowGap:designStyles.rowGap,designRect:designRect},timestamp:Date.now()})}).catch(function(){});
      fetch("http://127.0.0.1:7885/ingest/0499c47d-70cd-429d-a2ae-82b51e1ec3cb",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"be761d"},body:JSON.stringify({sessionId:"be761d",runId:"pre-fix",hypothesisId:"H-B-zero-gap-compression",location:"js/calculations-ui.js:logCompressionDesignGeometry",message:"Check if columns/cards are cramped by tiny gaps",data:{source:source,outerStripGap:window.getComputedStyle(strip || design).gap,columnRects:{left:leftRect,center:centerRect,right:rightRect},cards:{probable:probableRect,slender:slenderRect,safe:safeRect}},timestamp:Date.now()})}).catch(function(){});
      fetch("http://127.0.0.1:7885/ingest/0499c47d-70cd-429d-a2ae-82b51e1ec3cb",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"be761d"},body:JSON.stringify({sessionId:"be761d",runId:"pre-fix",hypothesisId:"H-C-inner-not-stretching",location:"js/calculations-ui.js:logCompressionDesignGeometry",message:"Check inner cards and tables stretch behavior",data:{source:source,probableWidthRatio:probableRect&&centerRect?Number((probableRect.w/centerRect.w).toFixed(3)):null,slenderWidthRatio:slenderRect&&centerRect?Number((slenderRect.w/centerRect.w).toFixed(3)):null,safeWidthRatio:safeRect&&rightRect?Number((safeRect.w/rightRect.w).toFixed(3)):null},timestamp:Date.now()})}).catch(function(){});
      fetch("http://127.0.0.1:7885/ingest/0499c47d-70cd-429d-a2ae-82b51e1ec3cb",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"be761d"},body:JSON.stringify({sessionId:"be761d",runId:"pre-fix",hypothesisId:"H-D-right-panel-under-allocated",location:"js/calculations-ui.js:logCompressionDesignGeometry",message:"Check right panel share and unused space",data:{source:source,viewport:{w:window.innerWidth,h:window.innerHeight},columnShares:leftRect&&centerRect&&rightRect?{left:Number((leftRect.w/(leftRect.w+centerRect.w+rightRect.w)).toFixed(3)),center:Number((centerRect.w/(leftRect.w+centerRect.w+rightRect.w)).toFixed(3)),right:Number((rightRect.w/(leftRect.w+centerRect.w+rightRect.w)).toFixed(3))}:null,unusedWidthPx:designRect&&leftRect&&centerRect&&rightRect?designRect.w-(leftRect.w+centerRect.w+rightRect.w):null},timestamp:Date.now()})}).catch(function(){});
      fetch("http://127.0.0.1:7885/ingest/0499c47d-70cd-429d-a2ae-82b51e1ec3cb",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"be761d"},body:JSON.stringify({sessionId:"be761d",runId:"pre-fix",hypothesisId:"H17-safe-card-user-guide-render",location:"js/calculations-ui.js:logCompressionDesignGeometry",message:"Check safe-card user guide render and placement",data:{source:source,hasBottomGuide:!!bottomGuide,bottomGuideRect:rectData(bottomGuide),bottomGuideText:bottomGuide?String(bottomGuide.textContent||"").replace(/\s+/g," ").trim():null,safeCardRect:rectData(safeCard)},timestamp:Date.now()})}).catch(function(){});
      fetch("http://127.0.0.1:7885/ingest/0499c47d-70cd-429d-a2ae-82b51e1ec3cb",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"be761d"},body:JSON.stringify({sessionId:"be761d",runId:"pre-fix",hypothesisId:"H18-given-params-underfill",location:"js/calculations-ui.js:logCompressionDesignGeometry",message:"Check free space inside Given Parameters card",data:{source:source,givenCardRect:rectData(givenCard),givenStackRect:rectData(givenStack),givenBoxCount:givenBoxes?givenBoxes.length:0,givenBoxesTotalHeight:givenBoxes?Array.prototype.reduce.call(givenBoxes,function(sum,b){return sum + (b.getBoundingClientRect?Math.round(b.getBoundingClientRect().height):0);},0):0},timestamp:Date.now()})}).catch(function(){});
      fetch("http://127.0.0.1:7885/ingest/0499c47d-70cd-429d-a2ae-82b51e1ec3cb",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"be761d"},body:JSON.stringify({sessionId:"be761d",runId:"pre-fix",hypothesisId:"H19-elastic-box-inner-gap",location:"js/calculations-ui.js:logCompressionDesignGeometry",message:"Check inner vertical gap in Elastic Modulus box",data:{source:source,elasticBoxRect:rectData(elasticBox),elasticInputRect:rectData(elasticInput),elasticBoxPadding:elasticBox?window.getComputedStyle(elasticBox).padding:null,elasticInputLineHeight:elasticInput?window.getComputedStyle(elasticInput).lineHeight:null},timestamp:Date.now()})}).catch(function(){});
      // #endregion
    }
    logCompressionDesignGeometry("load");
    window.addEventListener("resize", function () {
      logCompressionDesignGeometry("resize");
    });
    // #endregion
  });
  // #endregion

  var secForm = document.getElementById("formSectionProps");
  var secSel = document.getElementById("secDesignation");
  if (secForm && secSel && API) {
    API.listSections()
      .then(function (data) {
        var list = data.sections || [];
        list.forEach(function (s) {
          var o = document.createElement("option");
          o.value = s.designation;
          o.textContent = s.designation;
          secSel.appendChild(o);
        });
      })
      .catch(function () {});

    secSel.addEventListener("change", function () {
      var d = secSel.value;
      if (!d || !API.getSection) return;
      API.getSection(d)
        .then(function (row) {
          function set(name, val) {
            if (val == null) return;
            var el = secForm.elements.namedItem(name);
            if (el) el.value = String(val);
          }
          set("Ag", row.Ag);
          set("Ix", row.Ix);
          set("Iy", row.Iy);
          set("Sx", row.Sx);
          set("Zx", row.Zx);
        })
        .catch(function () {});
    });

    secForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var out = document.getElementById("resultSectionProps");
      var payload = bodyFromForm(secForm);
      if (!payload.designation) delete payload.designation;
      SC.sectionProperties(payload)
        .then(function (r) {
          showResult(out, r, false);
        })
        .catch(function (err) {
          showResult(out, err.message || String(err), true);
        });
    });
  }
})();
