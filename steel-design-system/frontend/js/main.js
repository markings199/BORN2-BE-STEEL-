/* Dashboard: steel grades, professional material card SVG, nav, hash links. */
(function () {
  "use strict";

  /** Populated from SteelGradesService (embed → optional fetch). Same array exposed as Born2BeSteel.steelGrades. */
  var steelGrades = [];
  /** Initial selection aligned with workbook emphasis on Steel Grade sheet (see Excel layout). */
  var DEFAULT_STEEL_GRADE_ASTM = "A709 36";

  function syncSteelGradesFromService() {
    var svc = typeof window !== "undefined" ? window.SteelGradesService : null;
    if (!svc || typeof svc.getGrades !== "function") {
      steelGrades.length = 0;
      var p = typeof window !== "undefined" ? window.__STEEL_GRADES_PAYLOAD__ : null;
      if (p && p.grades && p.grades.length) {
        Array.prototype.push.apply(steelGrades, p.grades);
      }
      return;
    }
    var next = svc.getGrades();
    steelGrades.length = 0;
    if (next && next.length) {
      Array.prototype.push.apply(steelGrades, next);
    }
  }

  syncSteelGradesFromService();
  /** Grade-data listeners registered after DOM init (see end of file) so table/select/card refresh run. */

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

  /** PNG keys use legacy naming; Excel uses spaced "Gr. B" etc. */
  var materialImageByGrade = {
    A36: "assets/steel-grade/A36-material-card.png",
    "A1043 36": "assets/steel-grade/A1043-36-material-card.png",
    "A1043 50": "assets/steel-grade/A1043-50-material-card.png",
    "A1085 Gr.A": "assets/steel-grade/A1085-GrA-material-card.png",
    "A1085 Gr. A": "assets/steel-grade/A1085-GrA-material-card.png",
    "A501 Gr.A": "assets/steel-grade/A501-GrA-material-card.png",
    "A501 Gr. A": "assets/steel-grade/A501-GrA-material-card.png",
    "A501 Gr.B": "assets/steel-grade/A501-GrB-material-card.png",
    "A501 Gr. B": "assets/steel-grade/A501-GrB-material-card.png",
    "A53 Gr.B": "assets/steel-grade/A53-GrB-material-card.png",
    "A53 Gr. B": "assets/steel-grade/A53-GrB-material-card.png",
    "A500 Gr.B": "assets/steel-grade/A500-GrB-material-card.png",
    "A500 Gr. B": "assets/steel-grade/A500-GrB-material-card.png",
    "A500 Gr.C": "assets/steel-grade/A500-GrC-material-card.png",
    "A500 Gr. C": "assets/steel-grade/A500-GrC-material-card.png",
    "A529 Gr.50": "assets/steel-grade/A529-Gr50-material-card.png",
    "A529 Gr. 50": "assets/steel-grade/A529-Gr50-material-card.png",
    "A529 Gr.55": "assets/steel-grade/A529-Gr55-material-card.png",
    "A529 Gr. 55": "assets/steel-grade/A529-Gr55-material-card.png",
    A588: "assets/steel-grade/A588-material-card.png",
    "A618 Gr.I,II": "assets/steel-grade/A618-GrI-II-material-card.png",
    "A618 Gr. I, II": "assets/steel-grade/A618-GrI-II-material-card.png",
    "A618 Gr.III": "assets/steel-grade/A618-GrIII-material-card.png",
    "A618 Gr. III": "assets/steel-grade/A618-GrIII-material-card.png",
    "A709 Gr.36": "assets/steel-grade/A709-Gr36-material-card.png",
    "A709 36": "assets/steel-grade/A709-Gr36-material-card.png",
    A847: "assets/steel-grade/A847-material-card.png",
    A992: "assets/steel-grade/A992-material-card.png",
    "A1065 Gr.50": "assets/steel-grade/A1065-Gr50-material-card.png",
    "A1065 Gr. 50": "assets/steel-grade/A1065-Gr50-material-card.png",
    "A709 Gr.50": "assets/steel-grade/A709-Gr50-material-card.png",
    "A709 50": "assets/steel-grade/A709-Gr50-material-card.png",
    "A709 50S": "assets/steel-grade/A709-Gr50-material-card.png",
    "A709 50W": "assets/steel-grade/A709-50W-material-card.png",
    "A572 Gr.42": "assets/steel-grade/A572-Gr42-material-card.png",
    "A572 Gr. 42": "assets/steel-grade/A572-Gr42-material-card.png",
    "A572 Gr.50": "assets/steel-grade/A572-Gr50-material-card.png",
    "A572 Gr. 50": "assets/steel-grade/A572-Gr50-material-card.png",
    "A572 Gr.55": "assets/steel-grade/A572-Gr55-material-card.png",
    "A572 Gr. 55": "assets/steel-grade/A572-Gr55-material-card.png",
    "A572 Gr.60": "assets/steel-grade/A572-Gr60-material-card.png",
    "A572 Gr. 60": "assets/steel-grade/A572-Gr60-material-card.png",
    "A572 Gr.65": "assets/steel-grade/A572-Gr65-material-card.png",
    "A572 Gr. 65": "assets/steel-grade/A572-Gr65-material-card.png",
    "A913 Gr.50": "assets/steel-grade/A913-Gr50-material-card.png",
    "A913 50": "assets/steel-grade/A913-Gr50-material-card.png",
    "A913 Gr.60": "assets/steel-grade/A913-Gr60-material-card.png",
    "A913 60": "assets/steel-grade/A913-Gr60-material-card.png",
    "A913 Gr.65": "assets/steel-grade/A913-Gr65-material-card.png",
    "A913 65": "assets/steel-grade/A913-Gr65-material-card.png",
    "A913 Gr.70": "assets/steel-grade/A913-Gr70-material-card.png",
    "A913 70": "assets/steel-grade/A913-Gr70-material-card.png",
  };

  function resolveMaterialImagePath(astm) {
    if (!astm) return null;
    if (materialImageByGrade[astm]) return materialImageByGrade[astm];
    return null;
  }

  function renderMaterialVisual(grade) {
    var imagePath = resolveMaterialImagePath(grade.astm);
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
    return !!resolveMaterialImagePath(astm);
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
    return "";
  }

  var tbody = document.getElementById("tableBody");
  var selectEl = document.getElementById("astmSelector");
  var astmDropdownBtn = document.getElementById("astmDropdownBtn");
  var astmDropdownPanel = document.getElementById("astmDropdownPanel");
  var astmDropdownList = document.getElementById("astmDropdownList");
  var astmDropdownLabel = document.getElementById("astmDropdownBtnLabel");
  var astmDropdownLayoutSpacer = document.getElementById("astmDropdownLayoutSpacer");
  var astmSelectorShell = document.getElementById("steelGradeSelectorTop");
  var searchInput = document.getElementById("gradeSearchInput");
  var activeBadgeEl = document.getElementById("activeBadge");
  var fyFilterGrid = document.getElementById("fyFilterGrid");
  var fuFilterGrid = document.getElementById("fuFilterGrid");
  var fyFilterClear = document.getElementById("fyFilterClear");
  var fuFilterClear = document.getElementById("fuFilterClear");
  /** Single-select Fy/Fu stress chips (null = no filter). */
  var selectedFy = null;
  var selectedFu = null;
  if (!tbody || !selectEl || !astmDropdownBtn || !astmDropdownPanel || !astmDropdownList) return;
  // Use custom ASTM dropdown UI while keeping native select as data source.
  selectEl.tabIndex = -1;
  selectEl.setAttribute("aria-hidden", "true");

  function isAstmDropdownOpen() {
    return astmDropdownPanel && !astmDropdownPanel.hidden;
  }

  function getAstmDropdownRoot() {
    return astmDropdownBtn && astmDropdownBtn.closest ? astmDropdownBtn.closest(".astm-dropdown-root") : null;
  }

  function clearAstmDropdownLayoutReserve() {
    if (astmDropdownLayoutSpacer) astmDropdownLayoutSpacer.style.height = "0px";
    if (astmSelectorShell) {
      astmSelectorShell.style.marginBottom = "";
      astmSelectorShell.classList.remove("astm-dropdown-open");
    }
    var root = getAstmDropdownRoot();
    if (root) root.classList.remove("astm-is-open");
  }

  function positionAstmDropdownList() {
    if (!astmDropdownBtn || !astmDropdownList || !astmDropdownPanel || astmDropdownPanel.hidden) return;
    var rect = astmDropdownBtn.getBoundingClientRect();
    var spaceBelow = window.innerHeight - rect.bottom - 10;
    var maxH = Math.min(280, window.innerHeight * 0.4, Math.max(96, spaceBelow));
    astmDropdownList.style.maxHeight = maxH + "px";
    if (astmDropdownLayoutSpacer) astmDropdownLayoutSpacer.style.height = "0px";
    if (astmSelectorShell) astmSelectorShell.style.marginBottom = "";
  }

  function syncAstmDropdownPanelWidth() {
    if (!astmDropdownPanel || astmDropdownPanel.hidden || !astmDropdownBtn || !astmDropdownList) return;
    astmDropdownPanel.style.width = "";
    var btnW = astmDropdownBtn.offsetWidth;
    var widest = 0;
    astmDropdownList.querySelectorAll(".astm-dropdown-option").forEach(function (li) {
      widest = Math.max(widest, li.scrollWidth);
    });
    var desired = Math.max(btnW, widest + 28);
    var root = getAstmDropdownRoot();
    var shellRect = astmSelectorShell ? astmSelectorShell.getBoundingClientRect() : null;
    var rootRect = root ? root.getBoundingClientRect() : null;
    var available = shellRect && rootRect ? Math.max(btnW, shellRect.right - rootRect.left - 8) : desired;
    astmDropdownPanel.style.width = Math.min(desired, available) + "px";
  }

  function closeAstmDropdown() {
    if (!astmDropdownList || !astmDropdownBtn || !astmDropdownPanel) return;
    astmDropdownPanel.hidden = true;
    astmDropdownPanel.style.width = "";
    astmDropdownBtn.setAttribute("aria-expanded", "false");
    astmDropdownList.style.maxHeight = "";
    clearAstmDropdownLayoutReserve();
    window.removeEventListener("resize", positionAstmDropdownList);
    window.removeEventListener("resize", syncAstmDropdownPanelWidth);
  }

  function openAstmDropdown() {
    astmDropdownPanel.hidden = false;
    astmDropdownBtn.setAttribute("aria-expanded", "true");
    if (astmSelectorShell) astmSelectorShell.classList.add("astm-dropdown-open");
    var root = getAstmDropdownRoot();
    if (root) root.classList.add("astm-is-open");
    syncAstmDropdownPanelWidth();
    positionAstmDropdownList();
    window.addEventListener("resize", positionAstmDropdownList);
    window.addEventListener("resize", syncAstmDropdownPanelWidth);
  }

  function syncAstmDropdownUi() {
    if (astmDropdownLabel) astmDropdownLabel.textContent = selectEl.value || "—";
    if (astmDropdownList) {
      astmDropdownList.querySelectorAll('[role="option"]').forEach(function (li) {
        var v = li.getAttribute("data-value");
        var sel = v === selectEl.value;
        li.classList.toggle("is-selected", sel);
        li.setAttribute("aria-selected", sel ? "true" : "false");
      });
    }
  }

  function normalizeAstmKey(s) {
    return String(s || "")
      .trim()
      .replace(/\s+/g, " ");
  }
  function findGrade(astmName) {
    var key = normalizeAstmKey(astmName);
    return steelGrades.find(function (g) {
      return normalizeAstmKey(g.astm) === key;
    });
  }

  function renderAstmSelectorOptions() {
    selectEl.innerHTML = "";
    astmDropdownList.innerHTML = "";
    steelGrades.forEach(function (grade) {
      var opt = document.createElement("option");
      opt.value = grade.astm;
      opt.textContent = grade.astm;
      selectEl.appendChild(opt);
      var li = document.createElement("li");
      li.setAttribute("role", "option");
      li.setAttribute("data-value", grade.astm);
      li.className = "astm-dropdown-option";
      li.textContent = grade.astm;
      li.tabIndex = -1;
      li.addEventListener("mousedown", function (e) {
        e.preventDefault();
      });
      li.addEventListener("click", function () {
        selectEl.value = grade.astm;
        selectEl.dispatchEvent(new Event("change", { bubbles: true }));
        closeAstmDropdown();
      });
      astmDropdownList.appendChild(li);
    });
    syncAstmDropdownUi();
    if (isAstmDropdownOpen()) syncAstmDropdownPanelWidth();
  }

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
    var fyValues = Array.from(
      new Set(
        steelGrades
          .map(function (g) {
            return Number(g.fy);
          })
          .filter(function (n) {
            return Number.isFinite(n);
          })
      )
    ).sort(function (a, b) {
      return a - b;
    });
    var fuValues = Array.from(
      new Set(
        steelGrades
          .map(function (g) {
            return Number(g.fu);
          })
          .filter(function (n) {
            return Number.isFinite(n);
          })
      )
    ).sort(function (a, b) {
      return a - b;
    });
    var fyEnabledByFu = new Set(
      steelGrades
        .filter(function (g) {
          var fuN = Number(g.fu);
          return selectedFu === null || (Number.isFinite(fuN) && fuN === selectedFu);
        })
        .map(function (g) { return Number(g.fy); })
        .filter(function (n) { return Number.isFinite(n); })
    );
    var fuEnabledByFy = new Set(
      steelGrades
        .filter(function (g) {
          var fyN = Number(g.fy);
          return selectedFy === null || (Number.isFinite(fyN) && fyN === selectedFy);
        })
        .map(function (g) { return Number(g.fu); })
        .filter(function (n) { return Number.isFinite(n); })
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
      var fyN = Number(g.fy);
      var fuN = Number(g.fu);
      var matchesSearch =
        !keyword ||
        g.astm.toLowerCase().indexOf(keyword) !== -1 ||
        ("astm " + g.astm.toLowerCase()).indexOf(keyword) !== -1;
      var matchesFy = selectedFy === null || (Number.isFinite(fyN) && fyN === selectedFy);
      var matchesFu = selectedFu === null || (Number.isFinite(fuN) && fuN === selectedFu);
      return matchesSearch && matchesFy && matchesFu;
    });
    renderTableAndDropdown(filtered);
    // Search-driven material card update:
    // when user types an ASTM keyword, show the first matching material card automatically.
    if (keyword && filtered.length) {
      setActiveMaterial(filtered[0].astm);
    } else if (!keyword && selectEl && selectEl.value && findGrade(selectEl.value)) {
      setActiveMaterial(selectEl.value);
    }
  }

  function setActiveMaterial(astmName) {
    var grade = findGrade(astmName);
    if (!grade) {
      if (activeBadgeEl) {
        activeBadgeEl.textContent = "Not found";
        activeBadgeEl.classList.remove("is-active-grade");
      }
      return;
    }
    currentGrade = grade;

    var fullNameEl = document.getElementById("selectedMatFullName");
    if (fullNameEl) fullNameEl.textContent = formatAstmTitle(grade.astm);

    var fyEl = document.getElementById("displayFy");
    var fuEl = document.getElementById("displayFu");
    if (fyEl) {
      fyEl.innerHTML =
        '<span class="chem-italic">F</span><sub>y</sub>: ' +
        grade.fy +
        " ksi";
    }
    if (fuEl) {
      fuEl.innerHTML =
        '<span class="chem-italic">F</span><sub>u</sub>: ' +
        grade.fu +
        " ksi";
    }

    var extra = document.getElementById("specificNote");
    if (extra) extra.textContent = getExtraNote(grade.astm);
    var academic = document.getElementById("academicBottomNote");
    if (academic) academic.textContent = getAcademicNote(grade.astm);
    var shortGuide = document.getElementById("guideShortNote");
    if (shortGuide) {
      var shortGuideText = String(getShortGuideNote(grade.astm) || "").trim();
      shortGuide.textContent = shortGuideText;
      shortGuide.hidden = !shortGuideText;
    }

    var ul = document.getElementById("usageNoteList");
    if (ul) {
      ul.innerHTML = "";
      notesToBullets(grade.notes || "")
        .filter(function (line) {
          return String(line || "").trim().length > 0;
        })
        .forEach(function (line) {
          var li = document.createElement("li");
          li.textContent = line;
          ul.appendChild(li);
        });
    }

    var vis = document.getElementById("matVisualWrap");
    if (vis) {
      vis.innerHTML = renderMaterialVisual(grade);
      var img = vis.querySelector("img");
      if (img) {
        img.addEventListener(
          "error",
          function onImgErr() {
            img.removeEventListener("error", onImgErr);
            vis.innerHTML = buildMaterialSvg(grade.astm, shapeCategory(grade.astm));
            var cardEl = document.getElementById("materialCardPro");
            if (cardEl) cardEl.classList.remove("is-photo-card");
          },
          false
        );
      }
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
    syncAstmDropdownUi();
    if (activeBadgeEl) {
      activeBadgeEl.textContent = "Active";
      activeBadgeEl.classList.add("is-active-grade");
      activeBadgeEl.title = "Selected: " + grade.astm + " (Fy = " + grade.fy + " ksi, Fu = " + grade.fu + " ksi)";
    }
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
    if (dashboardMain) {
      dashboardMain.classList.toggle("no-card", !showCard);
      dashboardMain.classList.toggle("steel-grade-active", showCard);
      dashboardMain.classList.toggle("overview-active", sectionId === "overviewSection");
      dashboardMain.classList.toggle("section-props-active", sectionId === "sectionPropsSection");
      dashboardMain.classList.toggle("tension-rod-active", sectionId === "tensionRodSection");
    }
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

  function goToSectionFromOverview(id) {
    if (!id || sections.indexOf(id) === -1) return;
    history.pushState(null, "", "#" + id);
    activateSection(id);
  }

  var quickNav = document.getElementById("overviewQuickNav");
  if (quickNav) {
    quickNav.querySelectorAll("[data-goto]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        goToSectionFromOverview(btn.getAttribute("data-goto"));
      });
    });
  }

  // Overview-level shortcut links/tabs (including EXPLORE TOOLS button).
  var overviewSectionEl = document.getElementById("overviewSection");
  if (overviewSectionEl) {
    overviewSectionEl.querySelectorAll("[data-goto]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        var id = el.getAttribute("data-goto");
        if (!id) return;
        if (e && typeof e.preventDefault === "function") e.preventDefault();
        goToSectionFromOverview(id);
      });

      // Keyboard activation for non-button controls.
      el.addEventListener("keydown", function (e) {
        if (!e) return;
        if (e.key === "Enter" || e.key === " ") {
          var id = el.getAttribute("data-goto");
          if (!id) return;
          e.preventDefault();
          goToSectionFromOverview(id);
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
      if (searchInput) searchInput.value = "";
      setActiveMaterial(astmRow);
      applyTableFilters();
    }
  });
  selectEl.addEventListener("change", function (e) {
    if (!e.target.value) return;
    if (searchInput) searchInput.value = "";
    syncAstmDropdownUi();
    setActiveMaterial(e.target.value);
    if (!document.getElementById("steelGradeSection").classList.contains("active-panel")) {
      history.pushState(null, "", "#steelGradeSection");
      activateSection("steelGradeSection");
    }
  });

  astmDropdownBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    if (isAstmDropdownOpen()) closeAstmDropdown();
    else openAstmDropdown();
  });

  astmDropdownList.addEventListener("click", function (e) {
    e.stopPropagation();
  });

  document.addEventListener("click", function () {
    closeAstmDropdown();
  });

  document.addEventListener("keydown", function (e) {
    if (!e || e.key !== "Escape") return;
    if (!isAstmDropdownOpen()) return;
    closeAstmDropdown();
    astmDropdownBtn.focus();
  });

  astmDropdownBtn.addEventListener("keydown", function (e) {
    if (!e) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!isAstmDropdownOpen()) openAstmDropdown();
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
  (function pickInitialGrade() {
    var pick =
      findGrade(DEFAULT_STEEL_GRADE_ASTM) ||
      (steelGrades.length ? steelGrades[0] : null);
    if (pick) setActiveMaterial(pick.astm);
  })();

  function refreshSteelGradesUi() {
    syncSteelGradesFromService();
    var keep =
      (currentGrade && currentGrade.astm) ||
      (selectEl && selectEl.value ? String(selectEl.value).trim() : "");
    renderAstmSelectorOptions();
    if (keep && findGrade(keep)) selectEl.value = keep;
    else if (steelGrades.length) selectEl.value = steelGrades[0].astm;
    syncAstmDropdownUi();
    buildStressFilters();
    applyTableFilters();
    if (!steelGrades.length) return;
    if (!(selectEl.value && findGrade(selectEl.value))) {
      var preferred =
        findGrade(DEFAULT_STEEL_GRADE_ASTM) || steelGrades[0];
      if (preferred) setActiveMaterial(preferred.astm);
    }
  }

  if (typeof window !== "undefined" && window.SteelGradesService && window.SteelGradesService.onUpdate) {
    window.SteelGradesService.onUpdate(refreshSteelGradesUi);
  }
  if (typeof window !== "undefined" && window.SteelGradesService && window.SteelGradesService.ensureLoaded) {
    window.SteelGradesService.ensureLoaded().then(refreshSteelGradesUi).catch(function () {});
  }

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
