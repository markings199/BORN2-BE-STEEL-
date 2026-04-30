/* Wire calculation forms to SteelCalculator API (requires server running). */
(function () {
  "use strict";

  var SC = window.SteelCalculator;
  var API = window.SteelAPI;
  if (!SC) return;
  var __nativeFetch = typeof window.fetch === "function" ? window.fetch.bind(window) : null;
  function fetch(url, opts) {
    var u = String(url || "");
    if (u.indexOf("127.0.0.1:7885/ingest") !== -1 || u.indexOf("127.0.0.1:7611/ingest") !== -1) {
      return Promise.resolve({ ok: false, skipped: true });
    }
    if (!__nativeFetch) return Promise.reject(new Error("fetch unavailable"));
    return __nativeFetch(url, opts);
  }

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
    var safeRemarkInput = document.getElementById("compressionSafeRemark");
    var safeRemarkLabel = document.getElementById("compressionSafeRemarkLabel");
    if (safeRemarkInput && safeRemarkLabel) {
      var safeRemark = (safeRemarkInput.value || "").trim();
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
  /* Tension Rod: Excel-accurate logic + UI live in `tension-rod-ui.js` (no legacy API submit). */
  /* Bending design: Excel-backed workflow in `bending-design-ui.js`. */
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
    var capacityBtn = document.getElementById("compressionCapacityAnalysisBtn");
    /** `Sheet2!J15:K18` effective-length factors (`Compression-Analysis` U-column lookups). */
    var COMPRESSION_BOUNDARY_K = [
      { label: "FIXED-FIXED", K: 0.65 },
      { label: "FIXED-PINNED", K: 0.8 },
      { label: "PINNED-PINNED", K: 1 },
      { label: "N/A", K: 0 },
    ];
    var compressionAnalysisCatalog = [];

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
    function boundaryKFromLabel(label) {
      var u = String(label || "").trim().toUpperCase();
      var row = COMPRESSION_BOUNDARY_K.find(function (b) {
        return String(b.label).toUpperCase() === u;
      });
      return row ? row.K : 1;
    }
    function populateCompressionBoundarySelect(sel) {
      if (!sel || sel.options.length) return;
      COMPRESSION_BOUNDARY_K.forEach(function (b) {
        var o = document.createElement("option");
        o.value = b.label;
        o.textContent = b.label;
        sel.appendChild(o);
      });
    }
    function populateAllCompressionBoundarySelects() {
      [
        "compressionACondX1",
        "compressionACondX2",
        "compressionACondX3",
        "compressionACondY1",
        "compressionACondY2",
        "compressionACondY3",
      ].forEach(function (id) {
        populateCompressionBoundarySelect(document.getElementById(id));
      });
    }
    function compressionSectionLambdas(sec) {
      if (!sec || sec.type === "L") return { lf: NaN, lw: NaN };
      var bf = sec.bf,
        tf = sec.tf,
        tw = sec.tw,
        d = sec.d;
      if (!(bf > 0 && tf > 0 && tw > 0 && d > 0)) return { lf: NaN, lw: NaN };
      return { lf: bf / (2 * tf), lw: (d - 2 * tf) / tw };
    }
    function syncCompressionAnalysisFuFromGrade() {
      var fuEl = document.getElementById("compressionAFu");
      if (!fuEl) return;
      var g = window.Born2BeSteel && Born2BeSteel.getSelectedGrade && Born2BeSteel.getSelectedGrade();
      if (g && Number.isFinite(Number(g.fu))) fuEl.value = String(Number(g.fu));
    }
    /** Mirrors `Compression-Analysis`: AG47–AG62 slenderness grid, T64 govern, AG15/AG20/AG24/AG32 strengths; AB8/AH8/X10/AF10 compactness (`<` test). */
    function computeCompressionAnalysis(runId) {
      var rx = Math.max(1e-6, n("compressionARx", 3.02));
      var ry = Math.max(1e-6, n("compressionARy", 3.02));
      var E = Math.max(1e-6, n("compressionAE", 29000));
      var Fy = Math.max(1e-6, n("compressionAFy", 50));
      var Ag = Math.max(1e-6, n("compressionAAg", 23.4));

      var lamPf = 0.56 * Math.sqrt(E / Fy);
      var lamRw = 1.49 * Math.sqrt(E / Fy);
      var lfSec = n("compressionALf", NaN);
      var lwSec = n("compressionALw", NaN);
      var hasLf = Number.isFinite(lfSec);
      var hasLw = Number.isFinite(lwSec);
      var flangeCompact = hasLf && lfSec < lamPf;
      var webCompact = hasLw && lwSec < lamRw;

      function rowSlice(axis, idx, rAxis) {
        var condEl = document.getElementById("compressionACond" + axis + idx);
        var Lel = document.getElementById("compressionAL" + axis.toLowerCase() + idx);
        var cond = condEl ? condEl.value : "N/A";
        var Kfac = boundaryKFromLabel(cond);
        var LftRaw = Lel && Lel.value !== "" ? Number(Lel.value) : NaN;
        var active = cond !== "N/A" && Number.isFinite(LftRaw) && LftRaw > 0 && Kfac > 0;
        var klFt = active ? Kfac * LftRaw : NaN;
        var klr = active && rAxis > 0 ? (klFt * 12) / rAxis : NaN;

        var suff = axis + idx;
        setText("compressionAKdisp" + suff, cond === "N/A" ? "0" : String(Kfac));
        var rCell =
          axis === "X"
            ? document.getElementById("compressionArx" + suff)
            : document.getElementById("compressionAry" + suff);
        if (rCell)
          rCell.textContent =
            active ? Number(rAxis.toFixed(4)).toString() : "";

        var klSpan = document.getElementById("compressionAKL" + axis.toLowerCase() + idx);
        var klrSpan = document.getElementById("compressionAKLr" + axis.toLowerCase() + idx);
        if (klSpan)
          klSpan.textContent = Number.isFinite(klFt) ? Number(klFt.toFixed(4)).toString() : "";
        if (klrSpan)
          klrSpan.textContent = Number.isFinite(klr) ? Number(klr.toFixed(4)).toString() : "";

        return {
          axis: axis,
          idx: idx,
          cond: cond,
          klFt: klFt,
          klr: klr,
          active: active && Number.isFinite(klr),
        };
      }

      var slices = []
        .concat([
          rowSlice("X", 1, rx),
          rowSlice("X", 2, rx),
          rowSlice("X", 3, rx),
        ])
        .concat([
          rowSlice("Y", 1, ry),
          rowSlice("Y", 2, ry),
          rowSlice("Y", 3, ry),
        ]);

      var xKlrs = slices.filter(function (s) {
        return s.axis === "X" && s.active;
      }).map(function (s) {
        return s.klr;
      });
      var yKlrs = slices.filter(function (s) {
        return s.axis === "Y" && s.active;
      }).map(function (s) {
        return s.klr;
      });
      var maxX = xKlrs.length ? Math.max.apply(null, xKlrs) : 0;
      var maxY = yKlrs.length ? Math.max.apply(null, yKlrs) : 0;
      var klrGov = Math.max(maxX, maxY);
      var govRx = maxX > maxY;

      var tolMatch = 1e-4;
      var govSlice =
        slices.find(function (s) {
          return s.active && Math.abs(s.klr - klrGov) <= tolMatch;
        }) || null;

      setText(
        "compressionAKLGovCaption",
        govRx ? "KL/rx Governs =" : "KL/ry Governs ="
      );
      setText(
        "compressionAKLrGov",
        klrGov > 0 ? Number(klrGov.toFixed(4)).toString() : "--"
      );
      setText(
        "compressionAKLGov",
        govSlice && Number.isFinite(govSlice.klFt)
          ? "KL = " + Number(govSlice.klFt.toFixed(4)).toString()
          : "KL = --"
      );

      var Fe =
        klrGov > 0 ? (Math.PI * Math.PI * E) / (klrGov * klrGov) : NaN;
      var FeSafe = Number.isFinite(Fe) && Fe > 0 ? Fe : NaN;
      var transition = 4.71 * Math.sqrt(E / Fy);
      var Fcr = NaN;
      if (Number.isFinite(FeSafe) && FeSafe > 0 && klrGov > 0) {
        Fcr =
          klrGov <= transition
            ? Math.pow(0.658, Fy / FeSafe) * Fy
            : 0.877 * FeSafe;
      }
      var Pn = Number.isFinite(Fcr) ? Fcr * Ag : NaN;
      var phiPn = Number.isFinite(Pn) ? 0.9 * Pn : NaN;

      setValue("compressionAFlangeLr", lamPf, 4);
      setValue("compressionAWebLr", lamRw, 4);
      var flangeDisp = document.getElementById("compressionAFlangeL");
      var webDisp = document.getElementById("compressionAWebL");
      if (flangeDisp) flangeDisp.value = hasLf ? lfSec.toFixed(4) : "—";
      if (webDisp) webDisp.value = hasLw ? lwSec.toFixed(4) : "—";

      setClassLabel(
        "compressionAFlangeClass",
        flangeCompact,
        "COMPACT FLANGE",
        "SLENDER FLANGE"
      );
      setClassLabel(
        "compressionAWebClass",
        webCompact,
        "COMPACT WEB",
        "SLENDER WEB"
      );

      var elFe = document.getElementById("compressionAFe");
      var elFcr = document.getElementById("compressionAFcr");
      var elFn = document.getElementById("compressionAFn");
      var elTu = document.getElementById("compressionATu");
      if (elFe)
        elFe.value = Number.isFinite(FeSafe) ? FeSafe.toFixed(4) : "--";
      if (elFcr)
        elFcr.value = Number.isFinite(Fcr) ? Fcr.toFixed(4) : "--";
      if (elFn) elFn.value = Number.isFinite(Pn) ? Pn.toFixed(4) : "--";
      if (Number.isFinite(phiPn)) {
        if (elTu) elTu.value = phiPn.toFixed(4);
        setText("compressionATuDisplay", Number(phiPn.toFixed(4)).toString());
      } else {
        if (elTu) elTu.value = "--";
        setText("compressionATuDisplay", "--");
      }

      // #region agent log
      sendCompressionLayoutDebugLog(
        runId || "pre-fix",
        "H20-H24",
        "js/calculations-ui.js:computeCompressionAnalysis",
        "Compression analysis live-calculation snapshot",
        {
          inputs: { rx: rx, ry: ry, E: E, Fy: Fy, Ag: Ag, lfSec: lfSec, lwSec: lwSec },
          outputs: {
            maxX: maxX,
            maxY: maxY,
            klrGov: klrGov,
            Fe: FeSafe,
            Fcr: Fcr,
            Pn: Pn,
            phiPn: phiPn,
          },
          compact: { lamPf: lamPf, lamRw: lamRw, flangeCompact: flangeCompact, webCompact: webCompact },
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
        var dom = {
          klrGov: getNumValue("compressionAKLrGov"),
          Fe: getNumValue("compressionAFe"),
          Fcr: getNumValue("compressionAFcr"),
          Fn: getNumValue("compressionAFn"),
          phiPn: getNumValue("compressionATu"),
        };
        var tol = 1e-2;
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
            expected: {
              klrGov: klrGov,
              Fe: FeSafe,
              Fcr: Fcr,
              Fn: Pn,
              phiPn: phiPn,
            },
            pass: {
              klrGov: close(dom.klrGov, Number(klrGov.toFixed(4))),
              Fe: close(dom.Fe, Number(FeSafe.toFixed(4))),
              Fcr: close(dom.Fcr, Number(Fcr.toFixed(4))),
              Fn: close(dom.Fn, Number(Pn.toFixed(4))),
              phiPn: close(dom.phiPn, Number(phiPn.toFixed(4))),
            },
          }
        );
      })();
      // #endregion
    }
    function bindCompressionAnalysisInputs() {
      var ids = [
        "compressionAFy",
        "compressionAE",
        "compressionARx",
        "compressionARy",
        "compressionAAg",
        "compressionALf",
        "compressionALw",
        "compressionALx1",
        "compressionALx2",
        "compressionALx3",
        "compressionALy1",
        "compressionALy2",
        "compressionALy3",
      ].concat([
        "compressionACondX1",
        "compressionACondX2",
        "compressionACondX3",
        "compressionACondY1",
        "compressionACondY2",
        "compressionACondY3",
      ]);
      ids.forEach(function (id) {
        var node = document.getElementById(id);
        if (!node) return;
        ["input", "change"].forEach(function (ev) {
          node.addEventListener(ev, function () {
            computeCompressionAnalysis("pre-fix");
          });
        });
      });
      computeCompressionAnalysis("pre-fix");
    }

    function initCompressionAnalysisSectionSelection() {
      var shapeSel = document.getElementById("compressionAShapeSelect");
      var listHost = document.getElementById("compressionAAiscList");
      if (!shapeSel || !listHost) return;

      populateAllCompressionBoundarySelects();

      function setInput(id, value, digits) {
        var el = document.getElementById(id);
        if (!el) return;
        if (value === "" || value === null || value === undefined) {
          el.value = "";
          return;
        }
        el.value =
          typeof digits === "number" ? Number(value).toFixed(digits) : String(value);
      }

      function applySection(sec, fam) {
        if (!sec) return;
        var lm = compressionSectionLambdas(sec);
        var lfStr = Number.isFinite(lm.lf) ? lm.lf : NaN;
        var lwStr = Number.isFinite(lm.lw) ? lm.lw : NaN;
        setInput("compressionAShapeType", fam);
        setInput("compressionAShapeLabel", sec.designation || "");
        setInput("compressionARx", sec.rx != null ? sec.rx : 0, 2);
        setInput("compressionARy", sec.ry != null ? sec.ry : 0, 2);
        setInput("compressionAAg", sec.Ag != null ? sec.Ag : 0, 1);
        var lfEl = document.getElementById("compressionALf");
        var lwEl = document.getElementById("compressionALw");
        if (lfEl)
          lfEl.value = Number.isFinite(lfStr) ? lfStr.toFixed(4) : "—";
        if (lwEl)
          lwEl.value = Number.isFinite(lwStr) ? lwStr.toFixed(4) : "—";
        computeCompressionAnalysis("pre-fix");
      }

      function pickShapeFamily(fam, preferredDesignation) {
        var rows = compressionAnalysisCatalog.filter(function (s) {
          return s && s.type === fam;
        });
        rows.sort(function (a, b) {
          return String(a.designation).localeCompare(String(b.designation), "en", {
            numeric: true,
          });
        });
        listHost.innerHTML = "";
        rows.forEach(function (sec, idx) {
          var wrap = document.createElement("div");
          wrap.className = "compressionA-list-row";
          wrap.setAttribute("role", "option");
          wrap.setAttribute("aria-selected", "false");
          wrap.dataset.designation = sec.designation || "";
          var c1 = document.createElement("span");
          c1.textContent = sec.designation || "";
          var c2 = document.createElement("span");
          c2.textContent = sec.aiscManualLabel || sec.designation || "";
          wrap.appendChild(c1);
          wrap.appendChild(c2);
          wrap.addEventListener("click", function () {
            setSelectedRow(wrap, fam);
          });
          listHost.appendChild(wrap);
        });

        var pick =
          (preferredDesignation &&
            rows.find(function (r) {
              return r.designation === preferredDesignation;
            })) ||
          rows[0];
        if (!pick) return;
        var rowEl = Array.prototype.find.call(
          listHost.querySelectorAll(".compressionA-list-row"),
          function (w) {
            return w.dataset.designation === pick.designation;
          }
        );
        if (rowEl) setSelectedRow(rowEl, fam);
      }

      function setSelectedRow(rowEl, fam) {
        if (!rowEl) return;
        Array.prototype.forEach.call(listHost.querySelectorAll(".compressionA-list-row"), function (r) {
          r.classList.remove("is-selected");
          r.setAttribute("aria-selected", "false");
        });
        rowEl.classList.add("is-selected");
        rowEl.setAttribute("aria-selected", "true");
        var des = rowEl.dataset.designation || "";
        var sec = compressionAnalysisCatalog.find(function (s) {
          return s.designation === des;
        });
        applySection(sec, fam);
        sendCompressionLayoutDebugLog(
          "pre-fix",
          "H_SECSEL",
          "js/calculations-ui.js:initCompressionAnalysisSectionSelection",
          "Section Selection changed",
          { family: fam, designation: des }
        );
      }

      function setAnalysisSlendernessDefaults() {
        [
          ["compressionACondX1", "PINNED-PINNED"],
          ["compressionACondX2", "N/A"],
          ["compressionACondX3", "N/A"],
          ["compressionACondY1", "PINNED-PINNED"],
          ["compressionACondY2", "N/A"],
          ["compressionACondY3", "N/A"],
        ].forEach(function (pair) {
          var el = document.getElementById(pair[0]);
          if (el) el.value = pair[1];
        });
        setInput("compressionALx1", 50, 3);
        setInput("compressionALx2", "", undefined);
        setInput("compressionALx3", "", undefined);
        setInput("compressionALy1", 28, 3);
        setInput("compressionALy2", "", undefined);
        setInput("compressionALy3", "", undefined);
      }

      shapeSel.addEventListener("change", function () {
        pickShapeFamily(shapeSel.value || "L");
      });

      fetch("data/aisc-sections.json")
        .then(function (r) {
          return r.ok ? r.json() : Promise.reject(new Error("bad json"));
        })
        .catch(function () {
          return { sections: [] };
        })
        .then(function (payload) {
          compressionAnalysisCatalog = (payload.sections || []).filter(function (s) {
            return s && (s.type === "W" || s.type === "L");
          });
          syncCompressionAnalysisFuFromGrade();
          setAnalysisSlendernessDefaults();
          bindCompressionAnalysisInputs();
          var fam = shapeSel.value || "L";
          var prefer =
            fam === "L" ? "L10X10X1-1/4" : "W8X24";
          pickShapeFamily(fam, prefer);
        });
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
          probableSectionText: document.getElementById("compressionProbName4")
            ? document.getElementById("compressionProbName4").textContent
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

    function syncCompressionDesignToAnalysis() {
      var fyDesign = document.getElementById("compressionDesignFy");
      var eDesign = document.getElementById("compressionDesignE");
      var dlDesign = document.getElementById("compressionDesignDl");
      var llDesign = document.getElementById("compressionDesignLl");
      var fyAnalysis = document.getElementById("compressionAFy");
      var eAnalysis = document.getElementById("compressionAE");
      var tuAnalysis = document.getElementById("compressionATu");
      if (fyDesign && fyAnalysis) fyAnalysis.value = fyDesign.value;
      if (eDesign && eAnalysis) eAnalysis.value = eDesign.value;
      // If analysis demand input is present, mirror the governing LRFD demand from design loads.
      if (tuAnalysis && dlDesign && llDesign) {
        var dl = Number(dlDesign.value);
        var ll = Number(llDesign.value);
        if (Number.isFinite(dl) && Number.isFinite(ll)) {
          var pu = Math.min(1.2 * dl + 1.6 * ll, 1.4 * dl);
          tuAnalysis.value = pu.toFixed(4);
        }
      }
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
    if (capacityBtn) {
      capacityBtn.addEventListener("click", function () {
        syncCompressionDesignToAnalysis();
        window.location.href = "pages/capacity-analysis.html";
      });
    }
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
    function fillSecOptionsFromList(list) {
      while (secSel.options.length > 1) secSel.remove(1);
      list.forEach(function (s) {
        var o = document.createElement("option");
        o.value = s.designation;
        o.textContent = s.designation;
        secSel.appendChild(o);
      });
    }
    fetch("data/aisc-sections.json")
      .then(function (r) {
        return r.ok ? r.json() : Promise.reject();
      })
      .then(function (payload) {
        fillSecOptionsFromList(payload.sections || []);
      })
      .catch(function () {
        API.listSections()
          .then(function (data) {
            fillSecOptionsFromList(data.sections || []);
          })
          .catch(function () {});
      });

    secSel.addEventListener("change", function () {
      var d = secSel.value;
      if (!d) return;
      function set(name, val) {
        if (val == null) return;
        var el = secForm.elements.namedItem(name);
        if (el) el.value = String(val);
      }
      var rows = typeof window !== "undefined" ? window.__aiscSectionRows : null;
      if (rows && rows.length) {
        var key = String(d)
          .toUpperCase()
          .replace(/\s+/g, "");
        var local = rows.find(function (r) {
          return (
            String(r.designation || "")
              .toUpperCase()
              .replace(/\s+/g, "") === key
          );
        });
        if (local) {
          set("Ag", local.Ag);
          set("Ix", local.Ix);
          set("Iy", local.Iy);
          set("Sx", local.Sx);
          set("Zx", local.Zx);
          return;
        }
      }
      if (!API.getSection) return;
      API.getSection(d)
        .then(function (row) {
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
