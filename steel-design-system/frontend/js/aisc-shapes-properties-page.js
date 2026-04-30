/* AISC shapes standalone page */
(function () {
  "use strict";

  var API = window.SteelAPI;
  if (!API) return;

  var dbSearch = document.getElementById("dbSearch");
  var shapeFilter = document.getElementById("shapeFilter");
  var typeFilter = document.getElementById("typeFilter");
  var labelFilter = document.getElementById("labelFilter");
  var resetBtn = document.getElementById("resetBtn");
  var backBtn = document.getElementById("backBtn");
  var resultCount = document.getElementById("resultCount");
  var dbBody = document.getElementById("dbBody");

  var rows = [];

  function normalizePrefix(val) {
    var p = String(val || "").trim().toUpperCase();
    if (!p) return "";
    if (p.indexOf("HSS") === 0) return "HSS";
    if (p.indexOf("PIPE") === 0) return "PIPE";
    if (p.indexOf("2L") === 0) return "2L";
    if (p.indexOf("WT") === 0 || p.indexOf("MT") === 0 || p.indexOf("ST") === 0) return "TEE";
    if (p.indexOf("MC") === 0 || p === "C") return "C";
    if (p.indexOf("W") === 0 || p.indexOf("S") === 0 || p.indexOf("HP") === 0 || p.indexOf("M") === 0) return "W";
    if (p.indexOf("L") === 0) return "L";
    return p;
  }

  function prefixOf(designation) {
    var m = String(designation || "").toUpperCase().match(/^[A-Z0-9]+/);
    if (!m) return "";
    return normalizePrefix(m[0]);
  }

  function fmt(v) {
    if (v == null || v === "") return "-";
    var n = Number(v);
    if (!isFinite(n)) return String(v);
    if (Math.abs(n) >= 100) return String(Math.round(n * 1000) / 1000);
    return String(Math.round(n * 10000) / 10000);
  }

  function goBack() {
    window.location.href = "../index.html#sectionPropsSection";
  }

  function renderSelectOptions(selectEl, values, placeholder) {
    selectEl.innerHTML = "";
    var first = document.createElement("option");
    first.value = "";
    first.textContent = placeholder;
    selectEl.appendChild(first);
    values.forEach(function (v) {
      var opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      selectEl.appendChild(opt);
    });
  }

  function filteredRows() {
    var keyword = String(dbSearch.value || "").trim().toUpperCase();
    var shape = normalizePrefix(shapeFilter.value);
    var type = normalizePrefix(typeFilter.value);
    var label = String(labelFilter.value || "").trim().toUpperCase();

    return rows.filter(function (r) {
      var p = prefixOf(r.designation);
      var t = normalizePrefix(r.type);
      var m = String(r.aiscManualLabel || r.designation || "").toUpperCase();
      var byKeyword = !keyword || String(r.designation || "").toUpperCase().indexOf(keyword) !== -1;
      var byShape = !shape || p === shape;
      var byType = !type || t === type;
      var byLabel = !label || m.indexOf(label) !== -1;
      return byKeyword && byShape && byType && byLabel;
    });
  }

  function renderTable(list) {
    dbBody.innerHTML = "";
    resultCount.textContent = list.length + " result" + (list.length === 1 ? "" : "s");

    if (!list.length) {
      var tr = document.createElement("tr");
      tr.innerHTML = '<td colspan="7">No matching section found.</td>';
      dbBody.appendChild(tr);
      return;
    }

    list.forEach(function (r) {
      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" + (prefixOf(r.designation) || "-") + "</td>" +
        "<td>" + (r.type || "-") + "</td>" +
        "<td>" + (r.aiscManualLabel || r.designation || "-") + "</td>" +
        "<td>" + fmt(r.weightPlf) + "</td>" +
        "<td>" + fmt(r.Ag) + "</td>" +
        "<td>" + fmt(r.d) + "</td>" +
        "<td>" + fmt(r.bf) + "</td>";
      tr.addEventListener("click", function () {
        try {
          localStorage.setItem("spSelectedDesignation", r.designation || "");
        } catch (_) {}
        goBack();
      });
      dbBody.appendChild(tr);
    });
  }

  function refresh() {
    renderTable(filteredRows());
  }

  backBtn.addEventListener("click", goBack);
  dbSearch.addEventListener("input", refresh);
  shapeFilter.addEventListener("change", refresh);
  typeFilter.addEventListener("change", refresh);
  labelFilter.addEventListener("input", refresh);
  resetBtn.addEventListener("click", function () {
    dbSearch.value = "";
    shapeFilter.value = "";
    typeFilter.value = "";
    labelFilter.value = "";
    refresh();
  });

  API.listSections()
    .then(function (payload) {
      rows = (payload.sections || []).slice();
      var shapeValues = Array.from(new Set(rows.map(function (r) { return prefixOf(r.designation); }).filter(Boolean))).sort();
      var typeValues = Array.from(new Set(rows.map(function (r) { return normalizePrefix(r.type); }).filter(Boolean))).sort();
      renderSelectOptions(shapeFilter, shapeValues, "Shapes");
      renderSelectOptions(typeFilter, typeValues, "Type");
      refresh();
    })
    .catch(function () {
      resultCount.textContent = "Failed to load sections";
    });
})();

