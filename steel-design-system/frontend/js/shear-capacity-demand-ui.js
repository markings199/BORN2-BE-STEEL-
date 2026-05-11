/**
 * Shear module — Capacity Analysis Database (Design Calculator).
 * Mirrors workbook sheets:
 * - `Shear Capacity no deflection`
 * - `Shear Capacity w deflection`
 *
 * The table updates dynamically from the Design Calculator inputs and the selected capacity button
 * (`data-shear-cap-mode` on `#shearViewCapacity`).
 */
(function () {
  "use strict";

  var WB = window.ShearDesignWorkbook;
  var capView = document.getElementById("shearViewCapacity");
  var bodyNoDefl = document.getElementById("shearCapacityNoDeflBody");
  var bodyDefl = document.getElementById("shearCapacityDeflBody");
  var titleEl = document.getElementById("shearCapDbTitle");
  var resultCountEl = document.getElementById("shearCapDbResultCount");

  var resetBtn = document.getElementById("shearCapDbResetBtn");
  var searchEl = document.getElementById("shearCapDbSearch");
  var shapeEl = document.getElementById("shearCapDbShape");
  var typeEl = document.getElementById("shearCapDbType");
  var labelEl = document.getElementById("shearCapDbLabel");

  if (!WB || !capView || !bodyNoDefl || !bodyDefl) return;

  var orderedLabels = [];
  var byUpper = Object.create(null);

  function activeCapacityView() {
    return capView.classList.contains("is-active");
  }

  function capMode() {
    return String(capView.getAttribute("data-shear-cap-mode") || "").trim() === "defl"
      ? "defl"
      : "noDefl";
  }

  function updateTitleAndSplit() {
    var noDeflPanel = document.getElementById("shearCapSplitNoDefl");
    var deflPanel = document.getElementById("shearCapSplitDefl");
    var isDefl = capMode() === "defl";
    if (noDeflPanel) noDeflPanel.hidden = !!isDefl;
    if (deflPanel) deflPanel.hidden = !isDefl;
    if (titleEl) {
      titleEl.textContent = isDefl
        ? "Capacity Analysis Database (considering deflection)"
        : "Capacity Analysis Database";
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

  var COL_DP = {
    w: 0,
    d: 1,
    tw: 3,
    Aw: 3,
    lambdaF: 2,
    lambdaW: 1,
    Zx: 0,
    Sx: 0,
    Kc: 6,
    lambdaPf: 6,
    lambdaRf: 6,
    Mp: 4,
    Mn: 4,
    demandW: 3,
    demandM: 4,
    capM: 4,
    Ix: 0,
    phi: 1,
    omega: 2,
    Cv: 6,
    Vn: 4,
    Va: 4,
  };

  // Excel `Shear Capacity no deflection` column U
  // IF(ignore,0, ASD: DL+LL+w/1000, LRFD: 1.2*(DL+w/1000)+1.6*LL)
  function lineLoadWithBeamWeight_klf(method, dl, ll, weightPlf, considerBeamWeight) {
    if (!considerBeamWeight) return 0;
    var wklf = Number(weightPlf) / 1000;
    var d = Number(dl);
    var l = Number(ll);
    if (method === "ASD") return d + l + wklf;
    return 1.2 * (d + wklf) + 1.6 * l;
  }

  // Excel `Shear Capacity no deflection` column V = (U * L^2) / 8
  function momentFromLineLoad_kipft(w_klf, Lft) {
    var w = Number(w_klf);
    var L = Number(Lft);
    if (!Number.isFinite(w) || !Number.isFinite(L) || L <= 0) return NaN;
    return (w * L * L) / 8;
  }

  function normDesignation(s) {
    return String(s || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");
  }

  function familyKey(label) {
    var u = normDesignation(label);
    var m = u.match(/^(W\\d+)X/i);
    return m ? m[1] : "—";
  }

  function secProps(row) {
    if (!row || String(row.type || "").toUpperCase() !== "W") return null;
    var d = Number(row.d);
    var tw = Number(row.tw);
    var lw = Number(row.lambdaW);
    var lf = Number(row.lambdaF);
    var zx = Number(row.Zx);
    var sx = Number(row.Sx);
    var ix = Number(row.Ix);
    if (!Number.isFinite(d) || !Number.isFinite(tw) || !Number.isFinite(lw)) return null;
    return {
      aiscManualLabel: row.aiscManualLabel || row.designation,
      weightPlf: Number(row.weightPlf || row.weight) || 0,
      d: d,
      tw: tw,
      lambdaW: lw,
      lambdaF: Number.isFinite(lf) ? lf : NaN,
      Zx: Number.isFinite(zx) ? zx : NaN,
      Sx: Number.isFinite(sx) ? sx : NaN,
      Ix: Number.isFinite(ix) ? ix : NaN,
    };
  }

  function trimLower(s) {
    return String(s == null ? "" : s)
      .trim()
      .toLowerCase();
  }

  function tryShearDesignCapacityContext() {
    if (!WB.governingUniformLoad || !WB.momentDemand_kipft || !WB.shearDemand_kips) return null;
    if (!WB.evaluateShearCapacityNoDeflectionDesignRow || !WB.evaluateShearCapacityWDeflectionDesignRow)
      return null;

    var mEl = document.getElementById("shearMethod");
    var dlEl = document.getElementById("shearDL");
    var llEl = document.getElementById("shearLL");
    var lenEl = document.getElementById("shearBeamLength");
    var eDesign = document.getElementById("shearE");
    var fyDesign = document.getElementById("shearFy");
    var bwSel = document.getElementById("shearDesignBeamWeightSelect");
    var divEl = document.getElementById("shearDesignDeflDivisor");
    var muEl = document.getElementById("shearDesignManualMu");
    var vuEl = document.getElementById("shearDesignManualVu");

    if (!mEl || !dlEl || !llEl || !lenEl || !eDesign || !fyDesign) return null;

    var method = mEl.value === "ASD" ? "ASD" : "LRFD";
    var dl = readNum(dlEl, NaN);
    var ll = readNum(llEl, NaN);
    var Lft = readNum(lenEl, NaN);
    var E = readNum(eDesign, NaN);
    var fy = readNum(fyDesign, NaN);
    if (!Number.isFinite(dl) || !Number.isFinite(ll) || !Number.isFinite(Lft) || Lft <= 0) return null;
    if (!Number.isFinite(E) || E <= 0 || !Number.isFinite(fy) || fy <= 0) return null;

    var loads = WB.governingUniformLoad(method, dl, ll);
    var Wu = loads.O26;
    var O39 = WB.momentDemand_kipft(Wu, Lft);
    var G51 = WB.shearDemand_kips(Wu, Lft);

    var manualVu = vuEl ? readNum(vuEl, 0) : 0;
    var deflDiv = divEl ? readNum(divEl, 360) : 360;
    var manualMu = muEl ? readNum(muEl, 0) : 0;
    var Y31 =
      WB.requiredIxY31_in4 != null ? WB.requiredIxY31_in4(deflDiv, ll, Lft, E) : NaN;

    var considerBeamWeight = bwSel && trimLower(bwSel.value) === "consider beam weight";

    return {
      consideringDeflection: capMode() === "defl",
      ctx: {
        method: method,
        E: E,
        Fy: fy,
        O39: O39,
        O45: 0,
        O46: manualMu,
        Y31: Y31,
        G51: G51,
        G55: manualVu,
        dl: dl,
        ll: ll,
        Lft: Lft,
        considerBeamWeight: considerBeamWeight,
      },
    };
  }

  function applyFilters(rows) {
    var q = String(searchEl && searchEl.value ? searchEl.value : "")
      .trim()
      .toUpperCase();
    var labelQ = String(labelEl && labelEl.value ? labelEl.value : "")
      .trim()
      .toUpperCase();
    var shapeVal = shapeEl && shapeEl.value ? String(shapeEl.value) : "";
    var typ = typeEl && typeEl.value ? String(typeEl.value) : "";

    return rows.filter(function (r) {
      var lb = String(r.label || "").toUpperCase();
      if (q && lb.indexOf(q) < 0) return false;
      if (labelQ && lb.indexOf(labelQ) < 0) return false;
      if (shapeVal === "W" && !/^W/i.test(String(r.label || ""))) return false;
      if (typ === "rolled") {
        /* catalog is rolled W-shapes only */
      }
      return true;
    });
  }

  function emptyMessageRow(colSpan, msg) {
    var tr = document.createElement("tr");
    var td = document.createElement("td");
    td.colSpan = colSpan;
    td.textContent = msg;
    td.style.textAlign = "center";
    td.style.padding = "0.75rem";
    td.style.background = "#fff";
    tr.appendChild(td);
    return tr;
  }

  function renderActiveTable() {
    if (!activeCapacityView()) return;
    updateTitleAndSplit();

    bodyNoDefl.textContent = "";
    bodyDefl.textContent = "";

    var bundle = tryShearDesignCapacityContext();
    if (!bundle) {
      if (resultCountEl) resultCountEl.textContent = "0 results";
      var target0 = capMode() === "defl" ? bodyDefl : bodyNoDefl;
      target0.appendChild(
        emptyMessageRow(26, "Open Shear → Design Calculator and enter valid inputs.")
      );
      return;
    }
    var ctx = bundle.ctx;

    var rows = [];
    for (var i = 0; i < orderedLabels.length; i++) {
      var lab = orderedLabels[i];
      var crow = byUpper[normDesignation(lab)];
      if (!crow) continue;
      rows.push({ label: crow.aiscManualLabel || lab, sec: secProps(crow), orderIndex: i });
    }
    rows = applyFilters(rows);
    if (resultCountEl)
      resultCountEl.textContent =
        rows.length + " result" + (rows.length === 1 ? "" : "s");

    var tbody = capMode() === "defl" ? bodyDefl : bodyNoDefl;
    var prevFam = null;
    var frag = document.createDocumentFragment();

    function td(cls, txt) {
      var el = document.createElement("td");
      if (cls) el.className = cls;
      el.textContent = txt;
      return el;
    }
    function remarkPillHtml(flagText) {
      var up = String(flagText || "").toUpperCase();
      var base = "bending-cap-remark-pill ";
      if (up.indexOf("SAFE") === 0) return '<span class="' + base + 'bending-cap-remark-pill--safe">SAFE!</span>';
      if (up.indexOf("UNSAFE") === 0) return '<span class="' + base + 'bending-cap-remark-pill--unsafe">UNSAFE</span>';
      return '<span class="' + base + 'bending-cap-remark-pill--na">N/A</span>';
    }
    function remarkTd(t) {
      var el = document.createElement("td");
      el.className = "bending-cap-remark-cell";
      el.innerHTML = remarkPillHtml(t);
      return el;
    }

    for (var r = 0; r < rows.length; r++) {
      var row = rows[r];
      var sec = row.sec;
      if (!sec) continue;

      var fam = familyKey(row.label);
      if (fam !== prevFam) {
        prevFam = fam;
        var gr = document.createElement("tr");
        gr.className = "bending-cap-group-row";
        var gtd = document.createElement("td");
        gtd.colSpan = 26;
        gtd.textContent = fam;
        gr.appendChild(gtd);
        frag.appendChild(gr);
      }

      var Aw = sec.d * sec.tw;
      var Kc = Number.isFinite(sec.lambdaW) && sec.lambdaW > 0 ? 4 / Math.sqrt(sec.lambdaW) : NaN;
      var lambdaPf = 0.38 * Math.sqrt(ctx.E / ctx.Fy);
      var lambdaRf = 1 * Math.sqrt(ctx.E / ctx.Fy);
      var Mp = Number.isFinite(sec.Zx) ? (ctx.Fy * sec.Zx) / 12 : NaN;
      var compactness =
        Number.isFinite(sec.lambdaF) && typeof WB.flangeSlendernessClassExcel === "function"
          ? WB.flangeSlendernessClassExcel(sec.lambdaF, ctx.E, ctx.Fy)
          : "";

      var sheetVariant = capMode() === "defl" ? "wDefl" : "noDefl";
      var Mn =
        typeof WB.nominalFlexuralT_kipft === "function"
          ? WB.nominalFlexuralT_kipft(sec, ctx.E, ctx.Fy, sheetVariant)
          : NaN;

      var ex =
        capMode() === "defl"
          ? WB.evaluateShearCapacityWDeflectionDesignRow(sec, ctx)
          : WB.evaluateShearCapacityNoDeflectionDesignRow(sec, ctx);

      var tr = document.createElement("tr");
      tr.className = "bending-cap-data-row" + (r % 2 ? " bending-cap-data-row--alt" : "");
      tr.appendChild(td("bending-cap-section-cell", row.label));
      tr.appendChild(td("", fmtCell(sec.weightPlf, COL_DP.w)));
      tr.appendChild(td("", fmtCell(sec.d, COL_DP.d)));
      tr.appendChild(td("", fmtCell(sec.tw, COL_DP.tw)));
      tr.appendChild(td("", fmtCell(Aw, COL_DP.Aw)));
      tr.appendChild(td("", fmtCell(sec.lambdaF, COL_DP.lambdaF)));
      tr.appendChild(td("", fmtCell(sec.lambdaW, COL_DP.lambdaW)));
      tr.appendChild(td("", fmtCell(sec.Zx, COL_DP.Zx)));
      tr.appendChild(td("", fmtCell(sec.Sx, COL_DP.Sx)));
      tr.appendChild(td("", fmtCell(Kc, COL_DP.Kc)));
      tr.appendChild(td("", fmtCell(lambdaPf, COL_DP.lambdaPf)));
      tr.appendChild(td("", fmtCell(lambdaRf, COL_DP.lambdaRf)));
      tr.appendChild(td("", fmtCell(Mp, COL_DP.Mp)));
      tr.appendChild(td("", compactness));
      tr.appendChild(td("", fmtCell(Mn, COL_DP.Mn)));

      if (capMode() === "noDefl") {
        var Wa = lineLoadWithBeamWeight_klf(
          ctx.method,
          ctx.dl,
          ctx.ll,
          sec.weightPlf,
          ctx.considerBeamWeight
        );
        var MaDemand = momentFromLineLoad_kipft(Wa, ctx.Lft);
        tr.appendChild(td("", fmtCell(Wa, COL_DP.demandW)));
        tr.appendChild(td("", fmtCell(MaDemand, COL_DP.demandM)));
        tr.appendChild(td("bending-cap-pu-cell", fmtCell(ex && ex.W, COL_DP.capM)));
        tr.appendChild(remarkTd(ex && ex.momentRemark));
      } else {
        tr.appendChild(td("bending-cap-pu-cell", fmtCell(ex && ex.U, COL_DP.capM)));
        tr.appendChild(td("", fmtCell(sec.Ix, COL_DP.Ix)));
        tr.appendChild(remarkTd(ex && ex.momentRemark));
        tr.appendChild(remarkTd(ex && ex.ixRemark));
      }

      var lim224 = 2.24 * Math.sqrt(ctx.E / ctx.Fy);
      var phiV = sec.lambdaW <= lim224 ? 1 : 0.9;
      var omegaV = sec.lambdaW <= lim224 ? 1.5 : 1.67;
      var Cv = typeof WB.shearAnalysisCv === "function" ? WB.shearAnalysisCv(sec.lambdaW, ctx.E, ctx.Fy) : NaN;
      var Vn = 0.6 * ctx.Fy * Aw * Cv;
      var Va = ex && ex.shearDesignP;

      tr.appendChild(td("", fmtCell(phiV, COL_DP.phi)));
      tr.appendChild(td("", fmtCell(omegaV, COL_DP.omega)));
      tr.appendChild(td("", fmtCell(Cv, COL_DP.Cv)));
      tr.appendChild(td("", fmtCell(Vn, COL_DP.Vn)));
      tr.appendChild(td("bending-cap-pu-cell", fmtCell(Va, COL_DP.Va)));
      tr.appendChild(remarkTd(ex && ex.shearRemark));
      tr.appendChild(td("", ex && ex.aeYes ? "YES" : "NO"));

      frag.appendChild(tr);
    }

    tbody.appendChild(frag);
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

  function bind() {
    [searchEl, shapeEl, typeEl, labelEl].forEach(function (el) {
      if (!el) return;
      el.addEventListener("input", renderActiveTable);
      el.addEventListener("change", renderActiveTable);
    });
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        if (searchEl) searchEl.value = "";
        if (labelEl) labelEl.value = "";
        if (shapeEl) shapeEl.value = "";
        if (typeEl) typeEl.value = "";
        renderActiveTable();
      });
    }
  }

  window.refreshShearCapacityDemand = function () {
    renderActiveTable();
  };

  window.addEventListener("load", function () {
    bind();
    loadOrderAndCatalog(renderActiveTable);
  });
})();
