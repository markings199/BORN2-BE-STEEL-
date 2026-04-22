/* Wire calculation forms to SteelCalculator API (requires server running). */
(function () {
  "use strict";

  var SC = window.SteelCalculator;
  var API = window.SteelAPI;
  if (!SC) return;

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
    el.textContent = formatResult(data);
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
      computeFn(payload)
        .then(function (r) {
          showResult(out, r, false);
        })
        .catch(function (err) {
          showResult(out, err.message || String(err), true);
        });
    });
  }

  bindSubmit("formTension", SC.tension.bind(SC), "resultTension");
  bindSubmit("formCompression", SC.compression.bind(SC), "resultCompression");
  bindSubmit("formTensionRod", SC.tensionRod.bind(SC), "resultTensionRod");
  bindSubmit("formBending", SC.bending.bind(SC), "resultBending");
  bindSubmit("formShear", SC.shear.bind(SC), "resultShear");

  document.querySelectorAll("[data-fill-steel]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var g = window.Born2BeSteel && Born2BeSteel.getSelectedGrade();
      if (!g) return;
      var form = btn.closest("form");
      if (!form) return;
      var inp = form.querySelector('[name="Fy"]');
      if (inp) inp.value = String(g.fy);
    });
  });

  var secForm = document.getElementById("formSectionProps");
  var secSel = document.getElementById("secDesignation");
  if (secForm && secSel && API) {
    API.listSections()
      .then(function (data) {
        var list = data.sections || [];
        list.forEach(function (s) {
          var o = document.createElement("option");
          o.value = s.designation;
          o.textContent = s.designation;
          secSel.appendChild(o);
        });
      })
      .catch(function () {});

    secSel.addEventListener("change", function () {
      var d = secSel.value;
      if (!d || !API.getSection) return;
      API.getSection(d)
        .then(function (row) {
          function set(name, val) {
            if (val == null) return;
            var el = secForm.elements.namedItem(name);
            if (el) el.value = String(val);
          }
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
