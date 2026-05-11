(function () {
  "use strict";

  var API = window.SteelAPI;
  if (!API || typeof API.listCompressionCapacity !== "function") return;

  function el(id) {
    return document.getElementById(id);
  }

  var tbody = el("capacityTbody");
  var searchEl = el("capacitySearch");
  var groupEl = el("capacityGroup");
  var typeEl = el("capacityType");
  var labelEl = el("capacityLabelFilter");
  var safeOnlyEl = el("capacitySafeOnly");
  var metricRows = el("capacityMetricRows");
  var metricSafe = el("capacityMetricSafe");
  var resetBtn = el("capacityResetBtn");
  var resultCountEl = el("capacityResultCount");

  if (!tbody || !searchEl || !groupEl || !safeOnlyEl) return;

  var state = {
    rows: [],
    groups: [],
    group: "all",
    q: "",
    type: "",
    label: "",
    safeOnly: false,
    /** "LRFD" | "ASD" — drives which of Pa / Pu is shown (φPn vs Pn/Ω). */
    method: "LRFD",
  };

  function readCapacityDbMethod() {
    try {
      var q = new URLSearchParams(window.location.search || "").get("method");
      if (q) {
        var u = String(q).trim().toUpperCase();
        if (u === "ASD" || u === "LRFD") return u;
      }
    } catch (e1) {}
    try {
      var ls = window.localStorage.getItem("compressionCapacityDbMethod");
      if (ls === "ASD" || ls === "LRFD") return ls;
    } catch (e2) {}
    return "LRFD";
  }

  function applyMethodHeaderChrome() {
    var isAsd = state.method === "ASD";
    var thPu = el("capacityThPu");
    var thPuRm = el("capacityThPuRm");
    var thPa = el("capacityThPa");
    var thPaRm = el("capacityThPaRm");
    if (thPu) thPu.classList.toggle("capdb-col-key", !isAsd);
    if (thPuRm) thPuRm.classList.toggle("capdb-col-key", !isAsd);
    if (thPa) thPa.classList.toggle("capdb-col-key", isAsd);
    if (thPaRm) thPaRm.classList.toggle("capdb-col-key", isAsd);
  }

  function numericField(v) {
    if (v === "" || v === null || v === undefined) return NaN;
    var n = Number(v);
    return Number.isFinite(n) ? n : NaN;
  }

  /** ASD allowable strength (kips): prefer row Pa; else Pn/1.67 when Pn is known. */
  function designPaKips(r) {
    if (!r || r.kind !== "row") return "";
    var a = numericField(r.Pa);
    if (Number.isFinite(a) && a > 0) return a;
    var pn = numericField(r.Pn);
    if (Number.isFinite(pn) && pn > 0) return pn / 1.67;
    return "";
  }

  /** LRFD design strength (kips): prefer row Pu; else 0.9·Pn when Pn is known. */
  function designPuKips(r) {
    if (!r || r.kind !== "row") return "";
    var u = numericField(r.Pu);
    if (Number.isFinite(u) && u > 0) return u;
    var pn = numericField(r.Pn);
    if (Number.isFinite(pn) && pn > 0) return 0.9 * pn;
    return "";
  }

  function strTrim(v) {
    if (v == null) return "";
    return String(v).trim();
  }

  /**
   * Remark beside **Pu** (LRFD): use `PuRemarks` when set; otherwise `PaRemarks`
   * (workbook export often leaves Pu demand column blank but puts SAFE on the Pa path).
   */
  function remarkForPuColumn(r) {
    if (!r || r.kind !== "row") return "";
    if (strTrim(r.PuRemarks) !== "") return r.PuRemarks;
    return r.PaRemarks != null ? r.PaRemarks : "";
  }

  /**
   * Remark beside **Pa** (ASD): use `PaRemarks` when set; otherwise `PuRemarks`.
   */
  function remarkForPaColumn(r) {
    if (!r || r.kind !== "row") return "";
    if (strTrim(r.PaRemarks) !== "") return r.PaRemarks;
    return r.PuRemarks != null ? r.PuRemarks : "";
  }

  function fmt(n, dp) {
    if (n === "" || n === null || n === undefined) return "";
    var num = Number(n);
    if (!Number.isFinite(num)) return "";
    var d = typeof dp === "number" ? dp : 4;
    var v = Number(num.toFixed(d));
    return v.toLocaleString("en-US", { maximumFractionDigits: d });
  }

  function normalizeText(s) {
    return String(s || "").trim().toUpperCase();
  }

  function isSafeRow(r) {
    if (!r) return false;
    if (state.method === "ASD") return normalizeText(r.PaRemarks) === "SAFE";
    var puRm = normalizeText(r.PuRemarks);
    if (puRm === "SAFE") return true;
    return normalizeText(r.PaRemarks) === "SAFE";
  }

  function computeGroups(rows) {
    var set = new Set();
    rows.forEach(function (r) {
      if (r && r.kind === "group" && r.section) set.add(normalizeText(r.section));
    });
    return Array.from(set).sort(function (a, b) {
      return a.localeCompare(b, "en", { numeric: true });
    });
  }

  function populateGroups(groups) {
    groupEl.innerHTML = '<option value="all">Shapes</option><option value="all">All</option>';
    groups.forEach(function (g) {
      var opt = document.createElement("option");
      opt.value = g;
      opt.textContent = g;
      groupEl.appendChild(opt);
    });
  }

  function applyFilters(rows) {
    var q = normalizeText(state.q);
    var g = normalizeText(state.group);
    var typeQ = normalizeText(state.type);
    var labelQ = normalizeText(state.label);
    var safeOnly = !!state.safeOnly;
    var out = [];

    // Group filtering keeps group headers only for the selected group.
    var activeGroup = "ALL";
    rows.forEach(function (r) {
      if (!r) return;
      if (r.kind === "group") {
        activeGroup = normalizeText(r.section);
        if (g === "ALL" || activeGroup === g) out.push(r);
        return;
      }

      if (g !== "ALL" && activeGroup !== g) return;
      var section = normalizeText(r.section);
      if (q && section.indexOf(q) === -1) return;
      // UI-only filters; data may not include these fields, so they gracefully no-op.
      if (typeQ && normalizeText(r.type).indexOf(typeQ) === -1) return;
      if (labelQ && normalizeText(r.AISC_Manual_Label || r.label || r.manualLabel).indexOf(labelQ) === -1) return;
      if (safeOnly && !isSafeRow(r)) return;
      out.push(r);
    });

    // If search/safe-only filtered out all rows inside a group, drop the group header.
    var cleaned = [];
    for (var i = 0; i < out.length; i += 1) {
      var row = out[i];
      if (row.kind !== "group") {
        cleaned.push(row);
        continue;
      }
      var hasAny = false;
      for (var j = i + 1; j < out.length; j += 1) {
        if (out[j].kind === "group") break;
        hasAny = true;
        break;
      }
      if (hasAny) cleaned.push(row);
    }

    return cleaned;
  }

  function td(text, className) {
    var c = document.createElement("td");
    c.textContent = text == null ? "" : String(text);
    if (className) c.className = className;
    return c;
  }

  function remarkTd(text) {
    var t = normalizeText(text);
    var cls = "capacity-remark";
    if (t === "SAFE") cls += " is-safe";
    if (t === "UNSAFE" || t === "NOT SAFE") cls += " is-unsafe";
    return td(t, cls);
  }

  function render(rows) {
    tbody.innerHTML = "";
    if (!rows.length) {
      var tr0 = document.createElement("tr");
      var td0 = document.createElement("td");
      td0.colSpan = 22;
      td0.textContent = "No matching rows.";
      tr0.appendChild(td0);
      tbody.appendChild(tr0);
      return;
    }

    var frag = document.createDocumentFragment();
    rows.forEach(function (r) {
      if (!r || !r.kind) return;
      if (r.kind === "group") {
        var trg = document.createElement("tr");
        trg.className = "capacity-row-group";
        var tdg = document.createElement("td");
        tdg.colSpan = 22;
        tdg.textContent = normalizeText(r.section);
        trg.appendChild(tdg);
        frag.appendChild(trg);
        return;
      }

      var tr = document.createElement("tr");
      if (isSafeRow(r)) tr.classList.add("is-safe-row");
      if (normalizeText(r.finalRemarks) === "SLENDER") tr.classList.add("is-slender-row");

      tr.appendChild(td(normalizeText(r.section)));
      tr.appendChild(td(fmt(r.W, 0)));
      tr.appendChild(td(fmt(r.Ag, 1)));
      tr.appendChild(td(fmt(r.rx, 2)));
      tr.appendChild(td(fmt(r.ry, 2)));
      tr.appendChild(td(fmt(r.bfOver2tf, 2)));
      tr.appendChild(td(fmt(r.flangeLambdaR, 4)));
      tr.appendChild(remarkTd(r.flangeRemarks));
      tr.appendChild(td(fmt(r.hOverTw, 1)));
      tr.appendChild(td(fmt(r.webLambdaR, 4)));
      tr.appendChild(remarkTd(r.webRemarks));
      tr.appendChild(remarkTd(r.finalRemarks));
      tr.appendChild(td(fmt(r.KLxOverRx, 4)));
      tr.appendChild(td(fmt(r.KLyOverRy, 4)));
      tr.appendChild(td(fmt(r.KLOverR, 4)));
      tr.appendChild(td(fmt(r.Fe, 4)));
      tr.appendChild(td(fmt(r.Fcr, 4)));
      var isAsd = state.method === "ASD";
      var puVal = isAsd ? "" : designPuKips(r);
      var paVal = isAsd ? designPaKips(r) : "";
      var puRm = isAsd ? "" : remarkForPuColumn(r);
      var paRm = isAsd ? remarkForPaColumn(r) : "";

      tr.appendChild(td(fmt(r.Pn, 4)));
      tr.appendChild(td(fmt(puVal, 4), isAsd ? "" : "capacity-key-value"));
      tr.appendChild(remarkTd(puRm));
      tr.appendChild(td(fmt(paVal, 4), isAsd ? "capacity-key-value" : ""));
      tr.appendChild(remarkTd(paRm));

      frag.appendChild(tr);
    });

    tbody.appendChild(frag);
  }

  function updateMetrics(allRows, filtered) {
    var dataRowsAll = allRows.filter(function (r) { return r && r.kind === "row"; });
    var dataRowsFiltered = filtered.filter(function (r) { return r && r.kind === "row"; });
    var safeCount = dataRowsFiltered.filter(isSafeRow).length;

    if (metricRows) metricRows.textContent = String(dataRowsFiltered.length) + " / " + String(dataRowsAll.length);
    if (metricSafe) metricSafe.textContent = String(safeCount);
    if (resultCountEl) resultCountEl.textContent = String(dataRowsFiltered.length) + " results";
  }

  function rerender() {
    var filtered = applyFilters(state.rows);
    render(filtered);
    updateMetrics(state.rows, filtered);
  }

  function bind() {
    searchEl.addEventListener("input", function () {
      state.q = searchEl.value || "";
      rerender();
    });
    groupEl.addEventListener("change", function () {
      state.group = groupEl.value || "all";
      rerender();
    });
    if (typeEl) {
      typeEl.addEventListener("change", function () {
        state.type = typeEl.value || "";
        rerender();
      });
    }
    if (labelEl) {
      labelEl.addEventListener("input", function () {
        state.label = labelEl.value || "";
        rerender();
      });
    }
    safeOnlyEl.addEventListener("change", function () {
      state.safeOnly = !!safeOnlyEl.checked;
      rerender();
    });

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        state.q = "";
        state.group = "all";
        state.type = "";
        state.label = "";
        state.safeOnly = false;
        searchEl.value = "";
        groupEl.value = "all";
        if (typeEl) typeEl.value = "";
        if (labelEl) labelEl.value = "";
        safeOnlyEl.checked = false;
        rerender();
      });
    }
  }

  tbody.innerHTML = '<tr><td colspan="22">Loading data…</td></tr>';
  API.listCompressionCapacity()
    .then(function (data) {
      state.method = readCapacityDbMethod();
      state.rows = (data && data.rows) ? data.rows : [];
      state.groups = computeGroups(state.rows);
      populateGroups(state.groups);
      applyMethodHeaderChrome();
      bind();
      rerender();
    })
    .catch(function (e) {
      var msg = String((e && e.message) || "Failed to load capacity data.");
      var extra = "";
      if (msg.toLowerCase().indexOf("not found") !== -1 || msg.toLowerCase().indexOf("404") !== -1) {
        extra =
          "<div style=\"margin-top:0.4rem;color:#2c6e8f;font-weight:800;\">" +
          "Tip: restart the Node server you're using (the /api/steel/compression-capacity route must exist on this port)." +
          "</div>";
      }
      tbody.innerHTML =
        '<tr><td colspan="22">' +
        "<div style=\"font-weight:1000;color:#0f3347;\">Unable to load Excel rows.</div>" +
        "<div style=\"margin-top:0.25rem;color:#163a4f;font-weight:800;\">" +
        msg +
        "</div>" +
        extra +
        "</td></tr>";
    });
})();

