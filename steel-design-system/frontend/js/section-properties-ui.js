/* Section Properties dashboard interactions */
(function () {
  "use strict";

  var API = window.SteelAPI;
  if (!API) return;

  var form = document.getElementById("formSectionProps");
  var secSel = document.getElementById("secDesignation");
  var searchInput = document.getElementById("sectionShapeSearch");
  var searchBtn = document.getElementById("sectionShapeSearchBtn");
  var mainImage = document.getElementById("sectionPropsMainImage");
  var openDbBtn = document.getElementById("openAiscDatabaseBtn");
  var backBtn = document.getElementById("backToSectionDashboardBtn");
  var dbPanel = document.getElementById("aiscDbPanel");
  var dbSearch = document.getElementById("aiscDbSearchInput");
  var dbBody = document.getElementById("aiscDbTableBody");
  var chipWrap = document.getElementById("aiscShapeFilterChips");

  if (!form || !secSel || !searchInput || !dbPanel || !dbBody || !chipWrap) return;

  var sectionRows = [];
  var selectedShapePrefix = "";

  var fieldMap = {
    weightPlf: document.getElementById("spW"),
    Ag: document.getElementById("spA"),
    d: document.getElementById("spD"),
    tw: document.getElementById("spTw"),
    bf: document.getElementById("spBf"),
    tf: document.getElementById("spTf"),
    Ix: document.getElementById("spIx"),
    Iy: document.getElementById("spIy"),
    Iz: document.getElementById("spIz"),
    tw2: document.getElementById("spTw2"),
    bf2: document.getElementById("spBf2"),
    tf2: document.getElementById("spTf2"),
    Sx: document.getElementById("spSxHidden"),
    Zx: document.getElementById("spZxHidden"),
  };

  function prefixOf(designation) {
    var m = String(designation || "").toUpperCase().match(/^[A-Z0-9]+/);
    if (!m) return "";
    if (m[0].indexOf("HSS") === 0) return "HSS";
    if (m[0].indexOf("W") === 0) return "W";
    if (m[0].indexOf("C") === 0) return "C";
    if (m[0].indexOf("L") === 0) return "L";
    if (m[0].indexOf("HP") === 0) return "HP";
    if (m[0].indexOf("S") === 0) return "S";
    return m[0];
  }

  function setTextInput(el, val) {
    if (!el) return;
    el.value = val == null || val === "" ? "-" : String(val);
  }

  function imageForShape(designation) {
    var raw = String(designation || "").toUpperCase().trim();
    var p = prefixOf(raw);
    if (p === "W" || p === "S" || p === "HP" || p === "M") return "assets/section-properties/w-shape.png";
    if (p === "C" || p === "MC") return "assets/section-properties/c-shape.png";
    if (p === "2L") return "assets/section-properties/double-angle-shape.png";
    if (p === "L") return "assets/section-properties/l-shape.png";
    if (/^HSS/.test(raw)) return "assets/section-properties/hss-shape.png";
    if (/^PIPE/.test(raw)) return "assets/section-properties/pipe-shape.png";
    if (/^WT|^MT|^ST/.test(raw)) return "assets/section-properties/tee-shape.png";
    return "assets/section-properties/section-main.png";
  }

  function applySectionRow(row) {
    if (!row) return;
    secSel.value = row.designation || "";
    searchInput.value = row.designation || "";

    setTextInput(fieldMap.weightPlf, row.weightPlf);
    setTextInput(fieldMap.Ag, row.Ag);
    setTextInput(fieldMap.d, row.d);
    setTextInput(fieldMap.tw, row.tw);
    setTextInput(fieldMap.bf, row.bf);
    setTextInput(fieldMap.tf, row.tf);
    setTextInput(fieldMap.Ix, row.Ix);
    setTextInput(fieldMap.Iy, row.Iy);
    setTextInput(fieldMap.Iz, row.Iz != null ? row.Iz : "-");
    setTextInput(fieldMap.tw2, row.tw);
    setTextInput(fieldMap.bf2, row.bf);
    setTextInput(fieldMap.tf2, row.tf);
    setTextInput(fieldMap.Sx, row.Sx);
    setTextInput(fieldMap.Zx, row.Zx);

    if (mainImage && mainImage.dataset.dynamic === "true") {
      mainImage.src = imageForShape(row.designation);
    }
  }

  function fillDbTable(rows) {
    dbBody.innerHTML = "";
    rows.forEach(function (row) {
      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" + (row.designation || "") + "</td>" +
        "<td>" + (row.weightPlf != null ? row.weightPlf : "-") + "</td>" +
        "<td>" + (row.Ag != null ? row.Ag : "-") + "</td>" +
        "<td>" + (row.d != null ? row.d : "-") + "</td>" +
        "<td>" + (row.bf != null ? row.bf : "-") + "</td>";
      tr.addEventListener("click", function () {
        applySectionRow(row);
        dbPanel.classList.remove("is-open");
      });
      dbBody.appendChild(tr);
    });
  }

  function activeRows() {
    var keyword = String(dbSearch.value || "").trim().toUpperCase();
    return sectionRows.filter(function (row) {
      var p = prefixOf(row.designation);
      var byPrefix = !selectedShapePrefix || p === selectedShapePrefix;
      var bySearch = !keyword || String(row.designation || "").toUpperCase().indexOf(keyword) !== -1;
      return byPrefix && bySearch;
    });
  }

  function renderShapeChips() {
    var prefixes = Array.from(new Set(sectionRows.map(function (r) { return prefixOf(r.designation); }))).sort();
    prefixes.unshift("ALL");
    chipWrap.innerHTML = "";
    prefixes.forEach(function (p) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sp-chip" + ((p === "ALL" ? "" : p) === selectedShapePrefix ? " is-active" : "");
      btn.textContent = p;
      btn.addEventListener("click", function () {
        selectedShapePrefix = p === "ALL" ? "" : p;
        renderShapeChips();
        fillDbTable(activeRows());
      });
      chipWrap.appendChild(btn);
    });
  }

  function loadOne(designation) {
    if (!designation) return;
    API.getSection(designation).then(applySectionRow).catch(function () {});
  }

  if (openDbBtn) {
    openDbBtn.addEventListener("click", function () {
      dbPanel.classList.add("is-open");
      fillDbTable(activeRows());
    });
  }
  if (backBtn) {
    backBtn.addEventListener("click", function () {
      dbPanel.classList.remove("is-open");
    });
  }
  if (dbSearch) {
    dbSearch.addEventListener("input", function () {
      fillDbTable(activeRows());
    });
  }
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      var keyword = String(searchInput.value || "").trim().toUpperCase();
      if (!keyword) return;
      var firstMatch = sectionRows.find(function (row) {
        return String(row.designation || "").toUpperCase().indexOf(keyword) === 0;
      });
      if (firstMatch) applySectionRow(firstMatch);
    });
    searchInput.addEventListener("change", function () {
      var exact = String(searchInput.value || "").trim();
      if (exact) loadOne(exact);
    });
    searchInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        var exact = String(searchInput.value || "").trim();
        if (exact) loadOne(exact);
      }
    });
  }
  if (searchBtn) {
    searchBtn.addEventListener("click", function () {
      var exact = String(searchInput && searchInput.value || "").trim();
      if (exact) {
        loadOne(exact);
        return;
      }
      if (sectionRows.length) applySectionRow(sectionRows[0]);
    });
  }

  API.listSections()
    .then(function (data) {
      sectionRows = data.sections || [];
      secSel.innerHTML = '<option value="">--</option>';
      sectionRows.forEach(function (s) {
        var opt = document.createElement("option");
        opt.value = s.designation;
        opt.textContent = s.designation;
        secSel.appendChild(opt);
      });
      renderShapeChips();
      fillDbTable(activeRows());
      if (sectionRows.length) loadOne(sectionRows[0].designation);
    })
    .catch(function () {});
})();

