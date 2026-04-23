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
  var chipWrap = document.getElementById("aiscShapeFilterChips");
  var selectedDesignation = document.getElementById("spSelectedDesignation");
  var selectedMeta = document.getElementById("spSelectedMeta");

  if (!form || !secSel || !searchInput || !dbPanel || !dbBody || !chipWrap) return;

  // #region agent log
  (function logLayoutSnapshot() {
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
      fetch('http://127.0.0.1:7611/ingest/6a837e42-6b94-4ac8-9453-30078a74f4d8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'978dc8'},body:JSON.stringify({sessionId:'978dc8',runId:window.__steelRunId||'pre-fix',hypothesisId:'H_LAYOUT',location:'section-properties-ui.js:layoutSnapshot',message:'Props layout snapshot',data:data,timestamp:Date.now()})}).catch(()=>{});
    }

    var props = document.getElementById("sectionPropsSection");
    var dash = props ? props.querySelector(".section-props-dashboard") : null;
    var hero = props ? props.querySelector(".sp-hero") : null;
    var main = props ? props.querySelector(".sp-main-card") : null;
    var guide = props ? props.querySelector(".sp-guide-card") : null;
    var fields = props ? props.querySelector(".sp-fields") : null;
    var mainImg = document.getElementById("sectionPropsMainImage");
    var guideImg = document.getElementById("sectionPropsGuideImage");
    var userGuideImg = document.getElementById("sectionPropsUserGuideImage");

    // delay one frame to measure after layout
    if (window.requestAnimationFrame) {
      window.requestAnimationFrame(function () {
        var rHero = rect(hero);
        var rMain = rect(main);
        var rGuide = rect(guide);
        var rFields = rect(fields);
        var rDash = rect(dash);
        send({
          viewport: { w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio || 1 },
          dash: rDash,
          hero: rHero,
          main: rMain,
          guide: rGuide,
          fields: rFields,
          imgs: {
            userGuide: rect(userGuideImg),
            main: rect(mainImg),
            guideTop: rect(guideImg),
          },
          overlaps: {
            hero_main: overlap(rHero, rMain),
            main_guide: overlap(rMain, rGuide),
            hero_guide: overlap(rHero, rGuide),
            guide_fields: overlap(rGuide, rFields),
          },
          horizontalOverflow: dash ? (dash.scrollWidth > dash.clientWidth) : null,
        });
      });
    }
  })();
  // #endregion

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
    rx: document.getElementById("spRx"),
    ry: document.getElementById("spRy"),
    Sx: document.getElementById("spSx"),
    Zx: document.getElementById("spZx"),
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
    if (fieldMap.Iz) setTextInput(fieldMap.Iz, row.Iz != null ? row.Iz : "-");
    setTextInput(fieldMap.rx, row.rx);
    setTextInput(fieldMap.ry, row.ry);
    setTextInput(fieldMap.Sx, row.Sx);
    setTextInput(fieldMap.Zx, row.Zx);

    if (selectedDesignation) {
      selectedDesignation.textContent = row.designation || "—";
    }
    if (selectedMeta) {
      var w = row.weightPlf != null ? row.weightPlf : "—";
      var a = row.Ag != null ? row.Ag : "—";
      var d = row.d != null ? row.d : "—";
      selectedMeta.textContent = "Weight " + w + " lb/ft · Area " + a + " in² · d " + d + " in";
    }

    // #region agent log
    fetch('http://127.0.0.1:7611/ingest/6a837e42-6b94-4ac8-9453-30078a74f4d8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'978dc8'},body:JSON.stringify({sessionId:'978dc8',runId:window.__steelRunId||'pre-fix',hypothesisId:'H_SUMMARY',location:'section-properties-ui.js:applySectionRow',message:'Applied section row to UI',data:{designation:row.designation||null,weightPlf:row.weightPlf||null,Ag:row.Ag||null,d:row.d||null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

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
    API.getSection(designation).then(applySectionRow).catch(function () {});
  }

  if (openDbBtn) {
    openDbBtn.addEventListener("click", function () {
      window.__spScrollY = window.scrollY || 0;
      dbPanel.classList.add("is-open");
      document.body.style.overflow = "hidden";
      fillDbTable(activeRows());

      // #region agent log
      fetch('http://127.0.0.1:7611/ingest/6a837e42-6b94-4ac8-9453-30078a74f4d8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'978dc8'},body:JSON.stringify({sessionId:'978dc8',runId:window.__steelRunId||'pre-fix',hypothesisId:'H_DB_OVERLAY',location:'section-properties-ui.js:openDb',message:'Opened DB overlay',data:{savedScrollY:window.__spScrollY,isOpen:dbPanel.classList.contains('is-open'),bodyOverflow:document.body.style.overflow||null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
    });
  }
  if (backBtn) {
    backBtn.addEventListener("click", function () {
      var saved = typeof window.__spScrollY === "number" ? window.__spScrollY : null;
      var before = window.scrollY || 0;
      dbPanel.classList.remove("is-open");
      document.body.style.overflow = "";
      if (saved !== null) {
        window.scrollTo(0, saved);
      }

      // #region agent log
      fetch('http://127.0.0.1:7611/ingest/6a837e42-6b94-4ac8-9453-30078a74f4d8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'978dc8'},body:JSON.stringify({sessionId:'978dc8',runId:window.__steelRunId||'pre-fix',hypothesisId:'H_DB_OVERLAY',location:'section-properties-ui.js:closeDb',message:'Closed DB overlay (before restore check)',data:{savedScrollY:saved,beforeCloseScrollY:before,isOpen:dbPanel.classList.contains('is-open'),bodyOverflow:document.body.style.overflow||null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion

      if (window.requestAnimationFrame) {
        window.requestAnimationFrame(function () {
          // #region agent log
          fetch('http://127.0.0.1:7611/ingest/6a837e42-6b94-4ac8-9453-30078a74f4d8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'978dc8'},body:JSON.stringify({sessionId:'978dc8',runId:window.__steelRunId||'pre-fix',hypothesisId:'H_DB_OVERLAY',location:'section-properties-ui.js:closeDb:raf',message:'Closed DB overlay (after restore check)',data:{afterCloseScrollY:window.scrollY||0,savedScrollY:saved},timestamp:Date.now()})}).catch(()=>{});
          // #endregion
        });
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

