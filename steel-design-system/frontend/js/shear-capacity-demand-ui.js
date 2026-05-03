/**
 * Shear module — Capacity Analysis: single master table (`Shear-Capacity` + SHEAR DESIGN Z38 demand).
 * Columns mirror workbook F–S plus trailing Vu (duplicate demand), aligned with spreadsheet layout.
 */
(function () {
  "use strict";

  var WB = window.ShearDesignWorkbook;
  var root = document.getElementById("shearSection");
  var capView = document.getElementById("shearViewCapacity");
  var tblBody = document.getElementById("shearCdTableBody");
  var strengthHead = document.getElementById("shearCdHeadStrengthCol");
  if (!root || !capView || !tblBody || !WB) return;

  var COLS = 16;

  var methodEl = document.getElementById("shearCdMethod");
  var gradeEl = document.getElementById("shearCdGrade");
  var eEl = document.getElementById("shearCdE");
  var fyEl = document.getElementById("shearCdFy");
  var vuEl = document.getElementById("shearCdVuDemand");

  var orderedLabels = [];
  var byUpper = Object.create(null);

  function activeCapacityView() {
    return capView.classList.contains("is-active");
  }

  function gradesList() {
    var svc = window.SteelGradesService;
    if (svc && typeof svc.getGrades === "function") {
      var g = svc.getGrades();
      if (g && g.length) return g;
    }
    var b = window.Born2BeSteel && window.Born2BeSteel.steelGrades;
    return b && b.length ? b : [];
  }

  function populateGrades() {
    if (!gradeEl) return;
    var list = gradesList();
    gradeEl.innerHTML = "";
    list.forEach(function (gr) {
      if (!gr || gr.astm == null) return;
      var o = document.createElement("option");
      o.value = String(gr.astm);
      o.textContent = String(gr.astm);
      gradeEl.appendChild(o);
    });
    var hit = list.find(function (g) {
      return g && String(g.astm) === "A572 Gr. 50";
    });
    gradeEl.value = hit ? hit.astm : list[0] ? list[0].astm : "";
    syncFyFromGrade();
  }

  function syncFyFromGrade() {
    if (!gradeEl || !fyEl) return;
    var svc = window.SteelGradesService;
    var fy =
      svc && typeof svc.fyFor === "function" ? svc.fyFor(String(gradeEl.value || "").trim()) : null;
    if (!Number.isFinite(fy)) {
      var g = gradesList().find(function (x) {
        return x && x.astm === gradeEl.value;
      });
      fy = g && Number.isFinite(Number(g.fy)) ? Number(g.fy) : NaN;
    }
    fyEl.value = Number.isFinite(fy) ? String(Math.round(fy)) : "";
  }

  function syncStrengthColumnHeader(method) {
    if (!strengthHead) return;
    if (method === "ASD") {
      strengthHead.innerHTML = "<em>V</em><sub>n</sub>/Ω<sub>v</sub>";
      strengthHead.title = "Shear-Capacity column P — ASD Vn/Ωv";
    } else {
      strengthHead.innerHTML = "<em>φV</em><sub>n</sub>";
      strengthHead.title = "Shear-Capacity column P — LRFD φv·Vn";
    }
  }

  function readNum(el, fb) {
    if (!el) return fb;
    var n = parseFloat(String(el.value || "").replace(/,/g, ""));
    return Number.isFinite(n) ? n : fb;
  }

  function fmtCell(n, decimals) {
    if (!Number.isFinite(n)) return "—";
    var d = typeof decimals === "number" ? decimals : 4;
    var s = n.toFixed(d).replace(/\.?0+$/, "");
    return s === "" ? "0" : s;
  }

  function normDesignation(s) {
    return String(s || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");
  }

  function familyKey(label) {
    var u = normDesignation(label);
    var m = u.match(/^(W\d+)X/i);
    return m ? m[1] : "—";
  }

  function secProps(row) {
    if (!row || String(row.type || "").toUpperCase() !== "W") return null;
    var d = Number(row.d);
    var tw = Number(row.tw);
    var lw = Number(row.lambdaW);
    if (!Number.isFinite(d) || !Number.isFinite(tw) || !Number.isFinite(lw)) return null;
    return {
      aiscManualLabel: row.aiscManualLabel || row.designation,
      weightPlf: Number(row.weightPlf || row.weight) || 0,
      d: d,
      tw: tw,
      lambdaW: lw,
    };
  }

  function appendGroupRow(family) {
    var tr = document.createElement("tr");
    tr.className = "shear-cd-group-row";
    var td = document.createElement("td");
    td.colSpan = COLS;
    td.textContent = family;
    tr.appendChild(td);
    tblBody.appendChild(tr);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderTables() {
    if (!activeCapacityView()) return;
    if (typeof WB.evaluateCapacityRow !== "function") return;

    tblBody.innerHTML = "";

    var method = methodEl && methodEl.value === "ASD" ? "ASD" : "LRFD";
    syncStrengthColumnHeader(method);
    syncFyFromGrade();
    var E = readNum(eEl, NaN);
    var fy = readNum(fyEl, NaN);
    var Vu = readNum(vuEl, 0);

    if (!Number.isFinite(E) || E <= 0 || !Number.isFinite(fy) || fy <= 0) {
      var tr0 = document.createElement("tr");
      tr0.innerHTML =
        '<td colspan="' +
        COLS +
        '" class="cd-left">Enter valid <strong>E</strong> and <strong>F<sub>y</sub></strong>.</td>';
      tblBody.appendChild(tr0);
      return;
    }

    var vuStr = fmtCell(Vu, 4);
    var prevFam = null;

    for (var i = 0; i < orderedLabels.length; i++) {
      var lab = orderedLabels[i];
      var fam = familyKey(lab);
      if (fam !== prevFam) {
        appendGroupRow(fam);
        prevFam = fam;
      }

      var crow = byUpper[normDesignation(lab)];
      var sec = crow ? secProps(crow) : null;
      var tr = document.createElement("tr");

      if (!sec) {
        tr.innerHTML =
          '<td class="cd-left">' +
          escapeHtml(lab) +
          '</td><td class="cd-num" colspan="' +
          (COLS - 1) +
          '">—</td>';
        tblBody.appendChild(tr);
        continue;
      }

      var labelDisp = sec.aiscManualLabel || lab;
      var wPlf = sec.weightPlf;
      var Aw = sec.d * sec.tw;
      var row = WB.evaluateCapacityRow(sec, E, fy, method, Vu);

      if (!row.valid) {
        tr.innerHTML =
          '<td class="cd-left">' +
          escapeHtml(labelDisp) +
          "</td>" +
          '<td class="cd-num">' +
          fmtCell(wPlf, 0) +
          "</td>" +
          '<td class="cd-num">' +
          fmtCell(sec.d, 4) +
          "</td>" +
          '<td class="cd-num">' +
          fmtCell(sec.tw, 4) +
          "</td>" +
          '<td class="cd-num">' +
          fmtCell(Aw, 4) +
          "</td>" +
          '<td class="cd-num">' +
          fmtCell(sec.lambdaW, 4) +
          "</td>" +
          '<td class="cd-num" colspan="' +
          (COLS - 6) +
          '">—</td>';
        tblBody.appendChild(tr);
        continue;
      }

      var safe = row.remark === "SAFE";
      var rmCls = safe ? "cd-remark-safe" : "cd-remark-unsafe";

      tr.innerHTML =
        '<td class="cd-left">' +
        escapeHtml(labelDisp) +
        "</td>" +
        '<td class="cd-num">' +
        fmtCell(wPlf, 0) +
        "</td>" +
        '<td class="cd-num">' +
        fmtCell(sec.d, 4) +
        "</td>" +
        '<td class="cd-num">' +
        fmtCell(sec.tw, 4) +
        "</td>" +
        '<td class="cd-num">' +
        fmtCell(Aw, 4) +
        "</td>" +
        '<td class="cd-num">' +
        fmtCell(sec.lambdaW, 4) +
        "</td>" +
        '<td class="cd-num">' +
        fmtCell(row.Lfac, 2) +
        "</td>" +
        '<td class="cd-num">' +
        fmtCell(row.Mfac, 2) +
        "</td>" +
        '<td class="cd-num">' +
        fmtCell(row.Ncv, 4) +
        "</td>" +
        '<td class="cd-num">' +
        fmtCell(row.Vn, 4) +
        "</td>" +
        '<td class="cd-num">' +
        fmtCell(row.P, 4) +
        "</td>" +
        '<td class="cd-num">' +
        vuStr +
        "</td>" +
        '<td class="' +
        rmCls +
        '">' +
        row.remark +
        "</td>" +
        '<td class="cd-num">' +
        (safe ? fmtCell(wPlf, 0) : "") +
        "</td>" +
        '<td class="cd-left">' +
        (safe ? escapeHtml(labelDisp) : "") +
        "</td>" +
        '<td class="cd-num">' +
        vuStr +
        "</td>";

      tblBody.appendChild(tr);
    }
  }

  function loadOrderAndCatalog(cb) {
    fetch("data/shear-design-order.json")
      .then(function (r) {
        return r.ok ? r.json() : Promise.reject();
      })
      .catch(function () {
        return { labels: [] };
      })
      .then(function (order) {
        orderedLabels = Array.isArray(order.labels) ? order.labels.slice() : [];
        return fetch("data/aisc-sections.json").then(function (r) {
          return r.ok ? r.json() : { sections: [] };
        });
      })
      .then(function (data) {
        byUpper = Object.create(null);
        var rows = data.sections || [];
        rows.forEach(function (s) {
          if (!s || s.designation == null) return;
          byUpper[normDesignation(s.designation)] = s;
        });
        if (cb) cb();
      })
      .catch(function () {
        orderedLabels = [];
        byUpper = Object.create(null);
        if (cb) cb();
      });
  }

  function bindInputs() {
    [methodEl, gradeEl, eEl, vuEl].forEach(function (el) {
      if (!el) return;
      el.addEventListener("input", renderTables);
      el.addEventListener("change", function () {
        syncFyFromGrade();
        renderTables();
      });
    });
  }

  function init() {
    if (WB.SHEAR_ANALYSIS_DEFAULT_E_KSI != null && eEl && !String(eEl.value || "").trim()) {
      eEl.value = String(WB.SHEAR_ANALYSIS_DEFAULT_E_KSI);
    }
    bindInputs();
    var svc = window.SteelGradesService;
    function bootstrap() {
      populateGrades();
      loadOrderAndCatalog(renderTables);
    }
    if (svc && svc.ensureLoaded) {
      svc.ensureLoaded().then(bootstrap).catch(bootstrap);
    } else {
      bootstrap();
    }
    if (svc && svc.onUpdate) {
      svc.onUpdate(function () {
        populateGrades();
        renderTables();
      });
    }
  }

  window.refreshShearCapacityDemand = function () {
    syncFyFromGrade();
    renderTables();
  };

  window.addEventListener("load", init);
})();
