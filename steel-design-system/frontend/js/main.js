/* Dashboard: steel grades, professional material card SVG, nav, hash links. */
(function () {
  "use strict";

  var steelGrades = [
    { astm: "A36", fy: 36, fu: 58, notes: "General structural shapes, plates, bars", imgGroup: "carbon" },
    { astm: "A992", fy: 50, fu: 65, notes: "W-shapes, seismic & wide-flange", imgGroup: "wshape" },
    { astm: "A572 Gr.42", fy: 42, fu: 60, notes: "High-strength low-alloy", imgGroup: "plate" },
    { astm: "A572 Gr.50", fy: 50, fu: 65, notes: "Common for beams & columns", imgGroup: "beam" },
    { astm: "A572 Gr.55", fy: 55, fu: 70, notes: "Higher strength", imgGroup: "heavy" },
    { astm: "A572 Gr.60", fy: 60, fu: 75, notes: "Bridge & building", imgGroup: "bridge" },
    { astm: "A572 Gr.65", fy: 65, fu: 80, notes: "Special high-strength", imgGroup: "heavy" },
    { astm: "A53 Gr.B", fy: 35, fu: 60, notes: "Pipe, circular sections", imgGroup: "pipe" },
    { astm: "A500 Gr.B", fy: 42, fu: 58, notes: "Cold-formed HSS", imgGroup: "hss" },
    { astm: "A500 Gr.C", fy: 46, fu: 62, notes: "HSS, improved toughness", imgGroup: "hss" },
    { astm: "A501 Gr.A", fy: 36, fu: 58, notes: "Hot-formed carbon steel pipe", imgGroup: "pipe" },
    { astm: "A501 Gr.B", fy: 50, fu: 70, notes: "Higher strength pipe", imgGroup: "pipe" },
    { astm: "A529 Gr.50", fy: 50, fu: 65, notes: "Structural plates & angles", imgGroup: "angle" },
    { astm: "A529 Gr.55", fy: 55, fu: 70, notes: "High strength angles", imgGroup: "angle" },
    { astm: "A1043 36", fy: 36, fu: 58, notes: "Low yield-to-tensile ratio", imgGroup: "seismic" },
    { astm: "A1043 50", fy: 50, fu: 65, notes: "Seismic applications", imgGroup: "seismic" },
    { astm: "A1085 Gr.A", fy: 50, fu: 65, notes: "Acceptable for Round HSS · Rectangular HSS", imgGroup: "hss_modern" },
    { astm: "A1065 Gr.50", fy: 50, fu: 60, notes: "Cold-formed HSS", imgGroup: "hss" },
    { astm: "A709 Gr.50", fy: 50, fu: 65, notes: "Bridge steel", imgGroup: "bridge" },
    { astm: "A709 50W", fy: 50, fu: 70, notes: "Weathering steel for bridges", imgGroup: "weather" },
    { astm: "A588", fy: 50, fu: 70, notes: "Weathering steel (Corten)", imgGroup: "weather" },
    { astm: "A847", fy: 50, fu: 70, notes: "Cold-formed weathering", imgGroup: "weather" },
    { astm: "A913 Gr.50", fy: 50, fu: 65, notes: "Quenched & tempered shapes", imgGroup: "heavy" },
    { astm: "A913 Gr.60", fy: 60, fu: 75, notes: "High strength shapes", imgGroup: "heavy" },
    { astm: "A913 Gr.65", fy: 65, fu: 80, notes: "Extra high strength", imgGroup: "heavy" },
    { astm: "A913 Gr.70", fy: 70, fu: 90, notes: "Ultra-high strength", imgGroup: "heavy" },
    { astm: "A618 Gr.I,II", fy: 50, fu: 70, notes: "Hot-formed HSS", imgGroup: "hss" },
    { astm: "A618 Gr.III", fy: 50, fu: 65, notes: "Hot-formed HSS", imgGroup: "hss" },
  ];
  steelGrades.sort(function (a, b) {
    return a.astm.localeCompare(b.astm);
  });

  var currentGrade = null;

  function escapeXml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function shapeCategory(astm) {
    if (/A500|A1085|A1065|A618/i.test(astm)) return "hss";
    if (/A53|A501/i.test(astm)) return "pipe";
    if (/A992|A572|A913/i.test(astm)) return "w";
    return "general";
  }

  function buildMaterialSvg(label, category) {
    var t = escapeXml(label);
    if (category === "hss") {
      return (
        '<svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="HSS section">' +
        '<defs><linearGradient id="mh1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#a8c5d8"/><stop offset="50%" stop-color="#6d8fa3"/><stop offset="100%" stop-color="#4a6b7d"/></linearGradient>' +
        '<linearGradient id="mh2" x1="0%" y1="100%" x2="90%" y2="0%"><stop offset="0%" stop-color="#7a9db0"/><stop offset="100%" stop-color="#d2e8f2"/></linearGradient></defs>' +
        '<path fill="url(#mh1)" d="M38 118 L168 38 L278 102 L148 178 Z"/>' +
        '<path fill="url(#mh2)" stroke="#3d5c6e" stroke-width="1.2" d="M148 178 L278 102 L278 78 L148 152 Z"/>' +
        '<path fill="none" stroke="#2c4a5c" stroke-width="1.4" d="M52 110 L182 48 L262 98 L132 168 Z"/>' +
        '<text x="100" y="122" fill="#0f2333" font-size="12" font-weight="800" font-family="Segoe UI,system-ui,sans-serif" transform="rotate(-27 100 122)">' +
        t +
        "</text></svg>"
      );
    }
    if (category === "w") {
      return (
        '<svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="W-shape">' +
        '<defs><linearGradient id="mw" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#d2e6f0"/><stop offset="100%" stop-color="#6d8fa3"/></linearGradient></defs>' +
        '<path fill="url(#mw)" stroke="#3d5c6e" stroke-width="1.3" d="M55 42 L265 42 L265 60 L198 60 L198 128 L122 128 L122 60 L55 60 Z"/>' +
        '<text x="160" y="100" text-anchor="middle" fill="#0f2333" font-size="11" font-weight="800" font-family="Segoe UI,system-ui,sans-serif">' +
        t +
        "</text></svg>"
      );
    }
    if (category === "pipe") {
      return (
        '<svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pipe section">' +
        '<ellipse cx="160" cy="92" rx="88" ry="40" fill="#8eb4c8" stroke="#3d5c6e" stroke-width="2"/>' +
        '<ellipse cx="160" cy="92" rx="54" ry="24" fill="#e8f4fa" stroke="#2c4a5c" stroke-width="1.4"/>' +
        '<text x="160" y="97" text-anchor="middle" fill="#0f2333" font-size="11" font-weight="800" font-family="Segoe UI,system-ui,sans-serif">' +
        t +
        "</text></svg>"
      );
    }
    return (
      '<svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Structural steel">' +
      '<rect x="48" y="48" width="224" height="88" rx="14" fill="#9eb8c9" stroke="#3d5c6e" stroke-width="2"/>' +
      '<text x="160" y="102" text-anchor="middle" fill="#0f2333" font-size="12" font-weight="800" font-family="Segoe UI,system-ui,sans-serif">' +
      t +
      "</text></svg>"
    );
  }

  var materialImageByGrade = {
    A36: "assets/steel-grade/A36-material-card.png",
    "A1043 36": "assets/steel-grade/A1043-36-material-card.png",
    "A1043 50": "assets/steel-grade/A1043-50-material-card.png",
    "A1085 Gr.A": "assets/steel-grade/A1085-GrA-material-card.png",
    "A501 Gr.A": "assets/steel-grade/A501-GrA-material-card.png",
    "A501 Gr.B": "assets/steel-grade/A501-GrB-material-card.png",
    "A53 Gr.B": "assets/steel-grade/A53-GrB-material-card.png",
    "A500 Gr.B": "assets/steel-grade/A500-GrB-material-card.png",
    "A500 Gr.C": "assets/steel-grade/A500-GrC-material-card.png",
    "A529 Gr.50": "assets/steel-grade/A529-Gr50-material-card.png",
    "A529 Gr.55": "assets/steel-grade/A529-Gr55-material-card.png",
    A588: "assets/steel-grade/A588-material-card.png",
    "A618 Gr.I,II": "assets/steel-grade/A618-GrI-II-material-card.png",
    "A618 Gr.III": "assets/steel-grade/A618-GrIII-material-card.png",
    "A709 Gr.36": "assets/steel-grade/A709-Gr36-material-card.png",
    A847: "assets/steel-grade/A847-material-card.png",
    A992: "assets/steel-grade/A992-material-card.png",
    "A1065 Gr.50": "assets/steel-grade/A1065-Gr50-material-card.png",
    "A709 Gr.50": "assets/steel-grade/A709-Gr50-material-card.png",
    "A709 50W": "assets/steel-grade/A709-50W-material-card.png",
    "A572 Gr.42": "assets/steel-grade/A572-Gr42-material-card.png",
    "A572 Gr.50": "assets/steel-grade/A572-Gr50-material-card.png",
    "A572 Gr.55": "assets/steel-grade/A572-Gr55-material-card.png",
    "A572 Gr.60": "assets/steel-grade/A572-Gr60-material-card.png",
    "A572 Gr.65": "assets/steel-grade/A572-Gr65-material-card.png",
    "A913 Gr.50": "assets/steel-grade/A913-Gr50-material-card.png",
    "A913 Gr.60": "assets/steel-grade/A913-Gr60-material-card.png",
    "A913 Gr.65": "assets/steel-grade/A913-Gr65-material-card.png",
    "A913 Gr.70": "assets/steel-grade/A913-Gr70-material-card.png",
  };

  function renderMaterialVisual(grade) {
    var imagePath = materialImageByGrade[grade.astm];
    if (imagePath) {
      return (
        '<img src="' +
        escapeXml(imagePath) +
        '" alt="Material card for ASTM ' +
        escapeXml(grade.astm) +
        '" loading="lazy">'
      );
    }
    return buildMaterialSvg(grade.astm, shapeCategory(grade.astm));
  }

  function hasMaterialImage(astm) {
    return !!materialImageByGrade[astm];
  }

  function formatAstmTitle(astm) {
    var s = astm.replace(/Gr\.(\S)/, "Gr. $1");
    return "ASTM " + s;
  }

  function notesToBullets(notes) {
    var parts = notes.split("·");
    if (parts.length > 1) {
      return parts
        .map(function (p) {
          return p.trim();
        })
        .filter(Boolean);
    }
    return [notes.trim()];
  }

  function getExtraNote(astm) {
    if (astm.indexOf("A1085") !== -1) {
      return "Acceptable for Round HSS & Rectangular HSS — enhanced ductility; verify AISC 360 & project specs.";
    }
    if (astm.indexOf("A992") !== -1) {
      return "Preferred for W-shapes; excellent weldability and seismic provisions.";
    }
    if (astm.indexOf("A500") !== -1) {
      return "Standard cold-formed HSS; see AISC Manual tables.";
    }
    if (astm.indexOf("A501") !== -1) {
      return "Hot-formed pipe; suited to columns and compression members.";
    }
    if (astm.indexOf("A588") !== -1) {
      return "Weathering steel; often used unpainted in bridges.";
    }
    return "Refer to AISC 360-22 and the governing ASTM standard.";
  }

  function getAcademicNote(astm) {
    if (astm.indexOf("A992") !== -1) {
      return "Academic note: ASTM A992 is commonly specified for W-shapes in building frames. Use Fy = 50 ksi and Fu = 65 ksi for preliminary LRFD strength checks, then verify member stability (including LTB), connection behavior, and seismic detailing per AISC 360-22 and the governing building code.";
    }
    if (astm.indexOf("A1085") !== -1) {
      return "Academic note: ASTM A1085 provides tighter geometric tolerances and is frequently used for HSS members. For design studies, confirm wall thickness assumptions, local slenderness classification, and connection limit states in accordance with AISC 360-22 and the applicable ASTM product specification.";
    }
    if (astm.indexOf("A500") !== -1) {
      return "Academic note: ASTM A500 grades are widely used for cold-formed HSS. Treat tabulated Fy/Fu as nominal values for preliminary analysis and check section classification, effective properties, and connection requirements under AISC 360-22 before finalizing design.";
    }
    if (astm.indexOf("A588") !== -1 || astm.indexOf("A709 50W") !== -1 || astm.indexOf("A847") !== -1) {
      return "Academic note: Weathering steel grades may reduce maintenance demands in suitable exposure conditions. For coursework and practice, include service environment assumptions and verify corrosion-performance criteria, fracture considerations, and code-specific detailing requirements.";
    }
    return "Academic note: Material properties shown are nominal values intended for preliminary LRFD evaluation. Final design should verify applicable ASTM product form, AISC 360-22 limit states, member stability, and project-specific serviceability and detailing criteria.";
  }

  function getShortGuideNote(astm) {
    if (/A500|A501|A1085|A618/i.test(astm)) {
      return "HSS/Pipe family: prioritize wall slenderness checks, connection detailing, and local buckling limits for LRFD design.";
    }
    if (/A572|A992|A913|A709|A529|A36|A588|A847/i.test(astm)) {
      return "Shape/plate family: use Fy and Fu for preliminary strength, then verify member stability, compactness, and connection behavior.";
    }
    return "Use this selected ASTM grade for preliminary material properties; verify project-specific requirements before final design.";
  }

  var tbody = document.getElementById("tableBody");
  var selectEl = document.getElementById("astmSelector");
  var searchInput = document.getElementById("gradeSearchInput");
  var fyFilterGrid = document.getElementById("fyFilterGrid");
  var fuFilterGrid = document.getElementById("fuFilterGrid");
  var fyFilterClear = document.getElementById("fyFilterClear");
  var fuFilterClear = document.getElementById("fuFilterClear");
  var selectedFy = null;
  var selectedFu = null;
  if (!tbody || !selectEl) return;

  function renderAstmSelectorOptions() {
    selectEl.innerHTML = "";
    steelGrades.forEach(function (grade) {
      var opt = document.createElement("option");
      opt.value = grade.astm;
      opt.textContent = grade.astm;
      selectEl.appendChild(opt);
    });
  }

  // #region agent log
  function sendDebugLog(hypothesisId, location, message, data) {
    fetch("http://127.0.0.1:7885/ingest/0499c47d-70cd-429d-a2ae-82b51e1ec3cb", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "76664a",
      },
      body: JSON.stringify({
        sessionId: "76664a",
        runId: "initial-debug",
        hypothesisId: hypothesisId,
        location: location,
        message: message,
        data: data || {},
        timestamp: Date.now(),
      }),
    }).catch(function () {});
  }

  function logSteelLayout(source) {
    var rightPanel = document.querySelector(".right-panel");
    var guidePanel = document.getElementById("guidePanel");
    var centerPanel = document.querySelector(".dashboard-main .center-panel");
    var tableWrap = document.querySelector(".steel-table-wrapper");
    var selectorTop = document.querySelector(".selector-top");
    var materialImage = document.querySelector(".material-card-pro.is-photo-card .mat-visual-wrap img");
    var rightStyle = rightPanel ? window.getComputedStyle(rightPanel) : null;
    var guideStyle = guidePanel ? window.getComputedStyle(guidePanel) : null;
    var centerStyle = centerPanel ? window.getComputedStyle(centerPanel) : null;
    var tableStyle = tableWrap ? window.getComputedStyle(tableWrap) : null;
    var selectorStyle = selectorTop ? window.getComputedStyle(selectorTop) : null;
    var imageStyle = materialImage ? window.getComputedStyle(materialImage) : null;

    sendDebugLog("H1-H4", "main.js:logSteelLayout", "Computed steel layout snapshot", {
      source: source,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      media: {
        maxWidth1400: window.matchMedia("(max-width: 1400px)").matches,
        maxWidth1250: window.matchMedia("(max-width: 1250px)").matches,
        maxHeight860: window.matchMedia("(max-height: 860px)").matches,
        maxHeight760: window.matchMedia("(max-height: 760px)").matches,
      },
      rightPanel: rightStyle
        ? {
            display: rightStyle.display,
            width: rightStyle.width,
            flexBasis: rightStyle.flexBasis,
            minWidth: rightStyle.minWidth,
            maxWidth: rightStyle.maxWidth,
          }
        : null,
      guidePanel: guideStyle
        ? {
            display: guideStyle.display,
            width: guideStyle.width,
            flexBasis: guideStyle.flexBasis,
            minWidth: guideStyle.minWidth,
            maxWidth: guideStyle.maxWidth,
          }
        : null,
      centerPanel: centerStyle
        ? {
            width: centerStyle.width,
            maxWidth: centerStyle.maxWidth,
          }
        : null,
      selectorTop: selectorStyle
        ? {
            padding: selectorStyle.padding,
            fontSize: selectorStyle.fontSize,
          }
        : null,
      tableWrap: tableStyle
        ? {
            height: tableStyle.height,
            maxHeight: tableStyle.maxHeight,
            minHeight: tableStyle.minHeight,
          }
        : null,
      materialImage: imageStyle
        ? {
            width: imageStyle.width,
            maxHeight: imageStyle.maxHeight,
          }
        : null,
    });
  }
  // #endregion

  function renderTableAndDropdown(list) {
    var data = list || steelGrades;
    tbody.innerHTML = "";
    data.forEach(function (grade) {
      var row = tbody.insertRow();
      row.setAttribute("data-astm", grade.astm);
      row.insertCell(0).textContent = grade.astm;
      row.insertCell(1).textContent = grade.fy;
      row.insertCell(2).textContent = grade.fu;
    });
    if (!data.length) {
      var row = tbody.insertRow();
      var cell = row.insertCell(0);
      cell.colSpan = 3;
      cell.textContent = "No ASTM grade found.";
      cell.style.textAlign = "center";
      cell.style.fontWeight = "700";
      return;
    }
    if (currentGrade) {
      var rows = document.querySelectorAll("#steelGradeTable tbody tr");
      rows.forEach(function (row) {
        if (row.cells[0].textContent === currentGrade.astm) row.classList.add("active-row");
      });
    }
  }

  function renderStressFilterGrid(container, values, selectedValue, enabledSet, onPick) {
    if (!container) return;
    container.innerHTML = "";
    values.forEach(function (v) {
      var btn = document.createElement("button");
      btn.type = "button";
      var isEnabled = !enabledSet || enabledSet.has(v);
      btn.className = "stress-chip" + (selectedValue === v ? " is-active" : "") + (isEnabled ? "" : " is-disabled");
      btn.textContent = String(v);
      btn.addEventListener("click", function () {
        if (!isEnabled) return;
        onPick(selectedValue === v ? null : v);
      });
      container.appendChild(btn);
    });
  }

  function buildStressFilters() {
    var fyValues = Array.from(new Set(steelGrades.map(function (g) { return g.fy; }))).sort(function (a, b) { return a - b; });
    var fuValues = Array.from(new Set(steelGrades.map(function (g) { return g.fu; }))).sort(function (a, b) { return a - b; });
    var fyEnabledByFu = new Set(
      steelGrades
        .filter(function (g) { return selectedFu === null || g.fu === selectedFu; })
        .map(function (g) { return g.fy; })
    );
    var fuEnabledByFy = new Set(
      steelGrades
        .filter(function (g) { return selectedFy === null || g.fy === selectedFy; })
        .map(function (g) { return g.fu; })
    );
    renderStressFilterGrid(fyFilterGrid, fyValues, selectedFy, fyEnabledByFu, function (value) {
      selectedFy = value;
      buildStressFilters();
      applyTableFilters();
    });
    renderStressFilterGrid(fuFilterGrid, fuValues, selectedFu, fuEnabledByFy, function (value) {
      selectedFu = value;
      buildStressFilters();
      applyTableFilters();
    });
    if (fyFilterClear) fyFilterClear.classList.toggle("is-active", selectedFy !== null);
    if (fuFilterClear) fuFilterClear.classList.toggle("is-active", selectedFu !== null);
  }

  function applyTableFilters() {
    var keyword = searchInput ? String(searchInput.value || "").trim().toLowerCase() : "";
    var filtered = steelGrades.filter(function (g) {
      var matchesSearch = !keyword ||
        g.astm.toLowerCase().indexOf(keyword) !== -1 ||
        ("astm " + g.astm.toLowerCase()).indexOf(keyword) !== -1;
      var matchesFy = selectedFy === null || g.fy === selectedFy;
      var matchesFu = selectedFu === null || g.fu === selectedFu;
      return matchesSearch && matchesFy && matchesFu;
    });
    renderTableAndDropdown(filtered);
    // Search-driven material card update:
    // when user types an ASTM keyword, show the first matching material card automatically.
    if (keyword && filtered.length) {
      setActiveMaterial(filtered[0].astm);
    }
  }

  function setActiveMaterial(astmName) {
    var grade = steelGrades.find(function (g) {
      return g.astm === astmName;
    });
    if (!grade) return;
    currentGrade = grade;

    var fullNameEl = document.getElementById("selectedMatFullName");
    if (fullNameEl) fullNameEl.textContent = formatAstmTitle(grade.astm);

    var fyEl = document.getElementById("displayFy");
    var fuEl = document.getElementById("displayFu");
    if (fyEl) fyEl.textContent = "Fy: " + grade.fy + " ksi";
    if (fuEl) fuEl.textContent = "Fu: " + grade.fu + " ksi";

    var extra = document.getElementById("specificNote");
    if (extra) extra.textContent = getExtraNote(grade.astm);
    var academic = document.getElementById("academicBottomNote");
    if (academic) academic.textContent = getAcademicNote(grade.astm);
    var shortGuide = document.getElementById("guideShortNote");
    if (shortGuide) shortGuide.textContent = getShortGuideNote(grade.astm);

    var ul = document.getElementById("usageNoteList");
    if (ul) {
      ul.innerHTML = "";
      notesToBullets(grade.notes).forEach(function (line) {
        var li = document.createElement("li");
        li.textContent = line;
        ul.appendChild(li);
      });
    }

    var vis = document.getElementById("matVisualWrap");
    if (vis) {
      vis.innerHTML = renderMaterialVisual(grade);
    }
    var card = document.getElementById("materialCardPro");
    if (card) {
      card.classList.toggle("is-photo-card", hasMaterialImage(grade.astm));
    }
    var rows = document.querySelectorAll("#steelGradeTable tbody tr");
    rows.forEach(function (row) {
      if (row.cells[0].textContent === grade.astm) row.classList.add("active-row");
      else row.classList.remove("active-row");
    });
    if (selectEl.value !== grade.astm) selectEl.value = grade.astm;
    // #region agent log
    logSteelLayout("setActiveMaterial:" + grade.astm);
    // #endregion
  }

  var sections = [
    "overviewSection",
    "steelGradeSection",
    "sectionPropsSection",
    "tensionSection",
    "compressionSection",
    "tensionRodSection",
    "bendingSection",
    "shearSection",
  ];
  var navItems = document.querySelectorAll("#mainNavList li");

  function activateSection(sectionId) {
    sections.forEach(function (sec) {
      var panel = document.getElementById(sec);
      if (panel) panel.classList.remove("active-panel");
    });
    var activePanel = document.getElementById(sectionId);
    if (activePanel) activePanel.classList.add("active-panel");
    navItems.forEach(function (item) {
      var dataSec = item.getAttribute("data-section");
      if (dataSec === sectionId) item.classList.add("active-nav");
      else item.classList.remove("active-nav");
    });

    var rightPanel = document.querySelector(".right-panel");
    var guidePanel = document.getElementById("guidePanel");
    var dashboardMain = document.querySelector(".dashboard-main");
    var showCard = sectionId === "steelGradeSection";
    if (rightPanel) rightPanel.classList.toggle("is-hidden", !showCard);
    if (guidePanel) guidePanel.classList.toggle("is-hidden", !showCard);
    if (dashboardMain) dashboardMain.classList.toggle("no-card", !showCard);
    // #region agent log
    if (showCard) logSteelLayout("activateSection:steelGradeSection");
    // #endregion
  }

  navItems.forEach(function (item) {
    item.addEventListener("click", function () {
      var targetSec = item.getAttribute("data-section");
      if (targetSec) {
        history.pushState(null, "", "#" + targetSec);
        activateSection(targetSec);
      }
    });
  });

  var quickNav = document.getElementById("overviewQuickNav");
  if (quickNav) {
    quickNav.querySelectorAll("[data-goto]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-goto");
        if (id) {
          history.pushState(null, "", "#" + id);
          activateSection(id);
        }
      });
    });
  }

  document.querySelectorAll(".header-link[data-section]").forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      var id = link.getAttribute("data-section");
      if (id) {
        history.pushState(null, "", "#" + id);
        activateSection(id);
      }
    });
  });

  document.getElementById("steelGradeTable").addEventListener("click", function (e) {
    var target = e.target;
    while (target && target.tagName !== "TR") target = target.parentElement;
    if (target && target.cells && target.cells[0]) {
      var astmRow = target.cells[0].textContent;
      var rows = document.querySelectorAll("#steelGradeTable tbody tr");
      rows.forEach(function (row) {
        if (row.cells[0].textContent === astmRow) row.classList.add("active-row");
        else row.classList.remove("active-row");
      });
    }
  });
  selectEl.addEventListener("change", function (e) {
    if (!e.target.value) return;
    setActiveMaterial(e.target.value);
    if (!document.getElementById("steelGradeSection").classList.contains("active-panel")) {
      history.pushState(null, "", "#steelGradeSection");
      activateSection("steelGradeSection");
    }
  });

  if (searchInput) {
    searchInput.addEventListener("input", function (e) {
      applyTableFilters();
    });
  }
  if (fyFilterClear) {
    fyFilterClear.addEventListener("click", function () {
      selectedFy = null;
      buildStressFilters();
      applyTableFilters();
    });
  }
  if (fuFilterClear) {
    fuFilterClear.addEventListener("click", function () {
      selectedFu = null;
      buildStressFilters();
      applyTableFilters();
    });
  }

  renderAstmSelectorOptions();
  buildStressFilters();
  renderTableAndDropdown();
  setActiveMaterial("A1085 Gr.A");
  // #region agent log
  window.addEventListener("load", function () {
    logSteelLayout("windowLoad");
  });
  window.addEventListener("resize", function () {
    logSteelLayout("windowResize");
  });
  // #endregion

  window.Born2BeSteel = {
    steelGrades: steelGrades,
    getSelectedGrade: function () {
      return currentGrade;
    },
    setActiveMaterial: setActiveMaterial,
    activateSection: activateSection,
  };

  (function hashNavigation() {
    var ALIASES = {
      overview: "overviewSection",
      home: "overviewSection",
      steel: "steelGradeSection",
      grade: "steelGradeSection",
      "steel-grade": "steelGradeSection",
      sections: "sectionPropsSection",
      "section-properties": "sectionPropsSection",
      tension: "tensionSection",
      compression: "compressionSection",
      "tension-rod": "tensionRodSection",
      bending: "bendingSection",
      shear: "shearSection",
    };
    function applyHash() {
      var raw = (location.hash || "").replace(/^#/, "").trim();
      var id = "overviewSection";
      if (raw) {
        id = document.getElementById(raw) ? raw : ALIASES[raw.toLowerCase()] || "";
        if (!id || sections.indexOf(id) === -1) id = "overviewSection";
      }
      activateSection(id);
    }
    window.addEventListener("hashchange", applyHash);
    applyHash();
  })();
})();
