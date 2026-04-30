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
  var dbBackdrop = dbPanel ? dbPanel.querySelector("[data-close-db]") : null;
  var dbSearch = document.getElementById("aiscDbSearchInput");
  var dbBody = document.getElementById("aiscDbTableBody");
  var dbTable = document.getElementById("aiscDbTable");
  var chipWrap = document.getElementById("aiscShapeFilterChips");
  var dbFilterShape = document.getElementById("spDbFilterShape");
  var dbFilterType = document.getElementById("spDbFilterType");
  var dbFilterLabel = document.getElementById("spDbFilterLabel");
  var dbFilterReset = document.getElementById("spDbFilterReset");
  var selectedDesignation = document.getElementById("spSelectedDesignation");
  var selectedMeta = document.getElementById("spSelectedMeta");
  var dbCount = document.getElementById("spDbResultCount");

  if (!form || !secSel || !searchInput || !dbPanel || !dbBody || !chipWrap) return;

  var sectionRows = [];
  var selectedShapePrefix = "";
  var dbSortKey = "designation";
  var dbSortDir = "asc";

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
    rx: document.getElementById("spRx"),
    ry: document.getElementById("spRy"),
    Sx: document.getElementById("spSx"),
    Sy: document.getElementById("spSy"),
    Zx: document.getElementById("spZx"),
    Zy: document.getElementById("spZy"),
  };
  var spComputedHeader = document.getElementById("spComputedHeader");
  var spTwComp = document.getElementById("spTwComp");
  var spBfComp = document.getElementById("spBfComp");
  var spTfComp = document.getElementById("spTfComp");

  function computedTitleFromDesignation(des) {
    var u = String(des || "").trim().toUpperCase();
    var ix = u.indexOf("X");
    if (ix > 0) return u.substring(0, ix);
    return u || "—";
  }

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

  function typeOfRow(row) {
    var raw = String(row && row.designation || "").toUpperCase().trim();
    if (!raw) return "";
    if (/^HSS/.test(raw)) return "HSS";
    if (/^PIPE/.test(raw)) return "PIPE";
    if (/^2L/.test(raw)) return "2L";
    if (/^WT|^MT|^ST/.test(raw)) return "TEE";
    if (/^MC|^C/.test(raw)) return "C";
    if (/^W|^S|^HP|^M/.test(raw)) return "W";
    if (/^L/.test(raw)) return "L";
    return prefixOf(raw);
  }

  function manualLabelOfRow(row) {
    if (!row) return "";
    return String(
      row.AISC_Manual_Label ||
      row.aisc_manual_label ||
      row.aiscManualLabel ||
      row.manualLabel ||
      row.designation ||
      ""
    );
  }

  function buildSelectOptions(selectEl, values, placeholder) {
    if (!selectEl) return;
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

  function formatNumber(value) {
    if (value == null || value === "") return "-";
    var n = Number(value);
    if (!isFinite(n)) return String(value);
    if (Math.abs(n) >= 1000) return String(Math.round(n * 100) / 100);
    if (Math.abs(n) >= 100) return String(Math.round(n * 1000) / 1000);
    return String(Math.round(n * 10000) / 10000);
  }

  function sortByDesignation(rows) {
    return rows.slice().sort(function (a, b) {
      var da = String(a && a.designation || "");
      var db = String(b && b.designation || "");
      return da.localeCompare(db, undefined, { numeric: true, sensitivity: "base" });
    });
  }

  function imageForShape(designation) {
    var raw = String(designation || "").toUpperCase().trim();
    var p = prefixOf(raw);
    if (p === "W") return "assets/section-properties/Untitled ONE (8.5 x 13 in) (33).png";
    if (p === "S" || p === "HP" || p === "M") return "assets/section-properties/Untitled EIGHT (8.5 x 13 in) (32).png";
    if (p === "C" || p === "MC") return "assets/section-properties/Untitled THREE(8.5 x 13 in) (33).png";
    if (p === "2L") return "assets/section-properties/Untitled SEVEN (8.5 x 13 in) (32).png";
    if (p === "L") return "assets/section-properties/Untitled TWO (8.5 x 13 in) (30).png";
    if (/^HSS/.test(raw)) return "assets/section-properties/Untitled FIVE (8.5 x 13 in) (33).png";
    if (/^PIPE/.test(raw)) return "assets/section-properties/Untitled NINE (8.5 x 13 in) (32).png";
    if (/^WT|^MT|^ST/.test(raw)) return "assets/section-properties/Untitled FOUR (8.5 x 13 in) (34).png";
    return "assets/section-properties/Untitled SIX (8.5 x 13 in) (34).png";
  }

  function normalizeDesignationKey(value) {
    return String(value || "")
      .toUpperCase()
      .replace(/\s+/g, "")
      .replace(/×/g, "X")
      .replace(/-/g, "");
  }

  function findSectionRow(query) {
    var qRaw = String(query || "").trim();
    var q = normalizeDesignationKey(qRaw);
    if (!q) return null;

    var scored = sectionRows
      .map(function (row) {
        var designation = String(row && row.designation || "");
        var manual = manualLabelOfRow(row);
        var type = String(typeOfRow(row) || "");

        var dNorm = normalizeDesignationKey(designation);
        var mNorm = normalizeDesignationKey(manual);
        var tNorm = normalizeDesignationKey(type);

        var score = -1;
        if (dNorm === q) score = 1000; // exact section designation
        else if (mNorm === q) score = 920; // exact manual label
        else if (dNorm.indexOf(q) === 0) score = 820; // designation prefix (e.g., W10)
        else if (mNorm.indexOf(q) === 0) score = 780; // manual label prefix
        else if (tNorm === q) score = 720; // exact type (W/C/L/HSS/...)
        else if (dNorm.indexOf(q) !== -1) score = 620; // designation contains
        else if (mNorm.indexOf(q) !== -1) score = 560; // manual label contains
        else if (tNorm.indexOf(q) === 0) score = 500; // type prefix

        return { row: row, score: score };
      })
      .filter(function (x) {
        return x.score >= 0;
      })
      .sort(function (a, b) {
        if (b.score !== a.score) return b.score - a.score;
        var da = String(a.row && a.row.designation || "");
        var db = String(b.row && b.row.designation || "");
        return da.localeCompare(db, undefined, { numeric: true, sensitivity: "base" });
      });

    return scored.length ? scored[0].row : null;
  }

  function applySectionRow(row, opts) {
    if (!row) return;
    var options = opts || {};
    secSel.value = row.designation || "";
    if (searchInput && !options.preserveSearchText) {
      searchInput.value = row.designation || "";
    }

    setTextInput(fieldMap.weightPlf, row.weightPlf);
    setTextInput(fieldMap.Ag, row.Ag);
    setTextInput(fieldMap.d, row.d);
    setTextInput(fieldMap.tw, row.tw);
    setTextInput(fieldMap.bf, row.bf);
    setTextInput(fieldMap.tf, row.tf);
    setTextInput(fieldMap.Ix, row.Ix);
    setTextInput(fieldMap.Iy, row.Iy);
    if (fieldMap.Iz) setTextInput(fieldMap.Iz, row.Iz != null ? row.Iz : "-");
    setTextInput(fieldMap.rx, row.rx);
    setTextInput(fieldMap.ry, row.ry);
    setTextInput(fieldMap.Sx, row.Sx);
    setTextInput(fieldMap.Zx, row.Zx);
    setTextInput(fieldMap.Sy, row.Sy);
    setTextInput(fieldMap.Zy, row.Zy);

    setTextInput(spTwComp, row.tw);
    setTextInput(spBfComp, row.bf);
    setTextInput(spTfComp, row.tf);

    if (spComputedHeader) {
      spComputedHeader.textContent = computedTitleFromDesignation(row.designation);
    }

    if (selectedDesignation) {
      selectedDesignation.textContent = row.designation || "—";
    }
    if (selectedMeta) {
      var w = row.weightPlf != null ? row.weightPlf : "—";
      var a = row.Ag != null ? row.Ag : "—";
      var d = row.d != null ? row.d : "—";
      selectedMeta.textContent = "Weight " + w + " lb/ft · Area " + a + " in² · d " + d + " in";
    }

    if (mainImage && mainImage.dataset.dynamic === "true") {
      mainImage.src = imageForShape(row.designation);
    }
  }

  function fillDbTable(rows) {
    rows = sortDbRows(rows);
    dbBody.innerHTML = "";
    if (dbCount) {
      dbCount.textContent = rows.length + " result" + (rows.length === 1 ? "" : "s");
    }
    if (!rows.length) {
      var trEmpty = document.createElement("tr");
      trEmpty.innerHTML = '<td colspan="7" class="sp-db-empty">No matching section found.</td>';
      dbBody.appendChild(trEmpty);
      return;
    }
    rows.forEach(function (row) {
      var type = typeOfRow(row) || "-";
      var manualLabel = manualLabelOfRow(row) || "-";
      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" + (row.designation || "") + "</td>" +
        "<td>" + type + "</td>" +
        "<td>" + manualLabel + "</td>" +
        "<td>" + formatNumber(row.weightPlf) + "</td>" +
        "<td>" + formatNumber(row.Ag) + "</td>" +
        "<td>" + formatNumber(row.d) + "</td>" +
        "<td>" + formatNumber(row.bf) + "</td>";
      tr.addEventListener("click", function () {
        applySectionRow(row);
        if (backBtn) backBtn.click();
      });
      dbBody.appendChild(tr);
    });
  }

  function sortDbRows(rows) {
    if (!rows || !rows.length || !dbSortKey || !dbSortDir) return rows || [];
    var dir = dbSortDir === "desc" ? -1 : 1;
    return rows.slice().sort(function (a, b) {
      var av;
      var bv;
      if (dbSortKey === "type") {
        av = typeOfRow(a);
        bv = typeOfRow(b);
      } else if (dbSortKey === "manualLabel") {
        av = manualLabelOfRow(a);
        bv = manualLabelOfRow(b);
      } else if (dbSortKey === "weightPlf" || dbSortKey === "Ag" || dbSortKey === "d" || dbSortKey === "bf") {
        av = Number(a && a[dbSortKey]);
        bv = Number(b && b[dbSortKey]);
        var aNum = Number.isFinite(av) ? av : -Infinity;
        var bNum = Number.isFinite(bv) ? bv : -Infinity;
        return (aNum - bNum) * dir;
      } else {
        av = a && a.designation;
        bv = b && b.designation;
      }
      return String(av || "").localeCompare(String(bv || ""), undefined, { numeric: true, sensitivity: "base" }) * dir;
    });
  }

  function updateDbHeaderSortUi() {
    if (!dbTable) return;
    var ths = dbTable.querySelectorAll("thead th");
    ths.forEach(function (th) {
      var key = th.getAttribute("data-sort-key");
      if (!key) return;
      var isActive = key === dbSortKey;
      th.classList.toggle("is-sorted", isActive);
      th.classList.toggle("is-sorted-desc", isActive && dbSortDir === "desc");
      th.setAttribute("aria-sort", isActive ? (dbSortDir === "desc" ? "descending" : "ascending") : "none");
    });
  }

  function initDbSortHeaders() {
    if (!dbTable) return;
    var ths = dbTable.querySelectorAll("thead th");
    var keyMap = ["designation", "type", "manualLabel", "weightPlf", "Ag", "d", "bf"];
    ths.forEach(function (th, idx) {
      var key = keyMap[idx] || "";
      if (!key) return;
      th.setAttribute("data-sort-key", key);
      th.setAttribute("role", "button");
      th.setAttribute("tabindex", "0");
      th.addEventListener("click", function () {
        if (dbSortKey === key) dbSortDir = dbSortDir === "asc" ? "desc" : "asc";
        else {
          dbSortKey = key;
          dbSortDir = "asc";
        }
        updateDbHeaderSortUi();
        fillDbTable(activeRows());
      });
      th.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          th.click();
        }
      });
    });
    updateDbHeaderSortUi();
  }

  function activeRows() {
    var keyword = String(dbSearch.value || "").trim().toUpperCase();
    var shapeFilter = normalizePrefix(dbFilterShape && dbFilterShape.value);
    var typeFilter = normalizePrefix(dbFilterType && dbFilterType.value);
    var labelFilter = String(dbFilterLabel && dbFilterLabel.value || "").trim().toUpperCase();
    return sectionRows.filter(function (row) {
      var p = normalizePrefix(prefixOf(row.designation));
      var t = normalizePrefix(typeOfRow(row));
      var label = manualLabelOfRow(row).toUpperCase();
      var byPrefix = !selectedShapePrefix || p === selectedShapePrefix;
      var bySearch = !keyword || String(row.designation || "").toUpperCase().indexOf(keyword) !== -1;
      var byShape = !shapeFilter || p === shapeFilter;
      var byType = !typeFilter || t === typeFilter;
      var byLabel = !labelFilter || label.indexOf(labelFilter) !== -1;
      return byPrefix && bySearch && byShape && byType && byLabel;
    });
  }

  function renderShapeChips() {
    var prefixes = Array.from(new Set(sectionRows.map(function (r) {
      return normalizePrefix(prefixOf(r.designation));
    }))).filter(Boolean).sort();
    prefixes.unshift("ALL");
    chipWrap.innerHTML = "";
    prefixes.forEach(function (p) {
      var btn = document.createElement("button");
      btn.type = "button";
      var isActive = ((p === "ALL" ? "" : p) === selectedShapePrefix);
      btn.className = "sp-chip" + (isActive ? " is-active" : "");
      btn.textContent = p;
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
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
    var q = String(designation || "").trim();
    var qNorm = normalizeDesignationKey(q);
    var exact = sectionRows.find(function (row) {
      return normalizeDesignationKey(row && row.designation) === qNorm;
    });
    var local = exact || findSectionRow(q);
    if (local) {
      applySectionRow(local);
      return;
    }
    if (searchInput && typeof searchInput.setCustomValidity === "function") {
      searchInput.setCustomValidity("No matching section found in the Excel catalog.");
      if (typeof searchInput.reportValidity === "function") {
        searchInput.reportValidity();
      }
      window.setTimeout(function () {
        searchInput.setCustomValidity("");
      }, 1200);
    }
  }

  if (openDbBtn) {
    openDbBtn.addEventListener("click", function () {
      window.__spScrollY = window.scrollY || 0;
      dbPanel.classList.add("is-open");
      document.body.style.overflow = "hidden";
      fillDbTable(activeRows());
    });
  }
  if (backBtn) {
    backBtn.addEventListener("click", function () {
      var saved = typeof window.__spScrollY === "number" ? window.__spScrollY : null;
      dbPanel.classList.remove("is-open");
      document.body.style.overflow = "";
      if (saved !== null) {
        window.scrollTo(0, saved);
      }
    });
  }
  if (dbBackdrop) {
    dbBackdrop.addEventListener("click", function () {
      if (backBtn) backBtn.click();
    });
  }
  if (dbSearch) {
    dbSearch.addEventListener("input", function () {
      fillDbTable(activeRows());
    });
  }
  if (dbFilterShape) {
    dbFilterShape.addEventListener("change", function () {
      fillDbTable(activeRows());
    });
  }
  if (dbFilterType) {
    dbFilterType.addEventListener("change", function () {
      fillDbTable(activeRows());
    });
  }
  if (dbFilterLabel) {
    dbFilterLabel.addEventListener("input", function () {
      fillDbTable(activeRows());
    });
  }
  if (dbFilterReset) {
    dbFilterReset.addEventListener("click", function () {
      if (dbFilterShape) dbFilterShape.value = "";
      if (dbFilterType) dbFilterType.value = "";
      if (dbFilterLabel) dbFilterLabel.value = "";
      if (dbSearch) dbSearch.value = "";
      selectedShapePrefix = "";
      renderShapeChips();
      fillDbTable(activeRows());
    });
  }
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      var keyword = String(searchInput.value || "").trim();
      if (!keyword) return;
      var firstMatch = findSectionRow(keyword);
      if (firstMatch) applySectionRow(firstMatch, { preserveSearchText: true });
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

  function finishSectionCatalogInit() {
    if (typeof window !== "undefined") {
      window.__aiscSectionRows = sectionRows;
    }
    secSel.innerHTML = '<option value="">--</option>';
    sectionRows.forEach(function (s) {
      var opt = document.createElement("option");
      opt.value = s.designation;
      opt.textContent = s.designation;
      secSel.appendChild(opt);
    });
    var prefixes = Array.from(new Set(sectionRows.map(function (s) {
      return normalizePrefix(prefixOf(s.designation));
    }))).filter(Boolean).sort();
    var types = Array.from(new Set(sectionRows.map(function (s) {
      return normalizePrefix(typeOfRow(s));
    }))).filter(Boolean).sort();
    buildSelectOptions(dbFilterShape, prefixes, "Shapes");
    buildSelectOptions(dbFilterType, types, "Type");
    initDbSortHeaders();
    renderShapeChips();
    fillDbTable(activeRows());
    if (searchInput) {
      searchInput.setAttribute(
        "placeholder",
        "Search shape (e.g., W14X132 or AISC manual label)"
      );
    }
    var pick =
      findSectionRow("W10X112") ||
      findSectionRow("W10") ||
      (sectionRows.length ? sectionRows[0] : null);
    if (pick) loadOne(pick.designation);
  }

  fetch("data/aisc-sections.json")
    .then(function (r) {
      if (!r.ok) throw new Error("missing catalog");
      return r.json();
    })
    .then(function (payload) {
      sectionRows = sortByDesignation(payload.sections || []);
      finishSectionCatalogInit();
    })
    .catch(function () {
      sectionRows = [];
      finishSectionCatalogInit();
      if (searchInput && typeof searchInput.setCustomValidity === "function") {
        searchInput.setCustomValidity("Excel section catalog failed to load.");
      }
    });
})();

