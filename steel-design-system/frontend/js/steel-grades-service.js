/**
 * Single source for ASTM grades from Excel export:
 * - Synchronously reads window.__STEEL_GRADES_PAYLOAD__ (steel-grades-embed.js)
 * - Falls back to fetch("data/steel-grades.json") when payload is missing (tests / alternate builds)
 */
(function (g) {
  "use strict";

  var grades = [];
  var byAstm = Object.create(null);
  var listeners = [];

  function normalizeKey(s) {
    return String(s || "")
      .trim()
      .replace(/\s+/g, " ");
  }

  function ingest(payload) {
    /* Preserve workbook / steel-grades.json row order (Steel Grade sheet). Do not sort — values & sequence must match the official table. */
    var list = payload && Array.isArray(payload.grades) ? payload.grades.slice() : [];
    grades = list;
    byAstm = Object.create(null);
    list.forEach(function (gr) {
      if (!gr || !gr.astm) return;
      byAstm[normalizeKey(gr.astm)] = gr;
    });
    listeners.forEach(function (fn) {
      try {
        fn(grades);
      } catch (e) {}
    });
  }

  function fromEmbed() {
    var p = g.__STEEL_GRADES_PAYLOAD__;
    if (p && p.grades && p.grades.length) {
      ingest(p);
      return true;
    }
    return false;
  }

  /** Populate from embed immediately when this script runs (after embed tag). */
  fromEmbed();

  function ensureLoaded() {
    if (grades.length) return Promise.resolve(grades);
    if (fromEmbed()) return Promise.resolve(grades);
    return fetch("data/steel-grades.json", { credentials: "same-origin" })
      .then(function (r) {
        return r.ok ? r.json() : Promise.reject(new Error("steel-grades.json"));
      })
      .then(function (payload) {
        ingest(payload);
        g.__STEEL_GRADES_PAYLOAD__ = payload;
        return grades;
      })
      .catch(function () {
        ingest({ grades: [] });
        return grades;
      });
  }

  g.SteelGradesService = {
    ensureLoaded: ensureLoaded,

    /** Live reference — treat as read-only; order matches Steel Grade sheet export. */
    getGrades: function () {
      return grades;
    },

    findByAstm: function (astm) {
      return byAstm[normalizeKey(astm)] || null;
    },

    fyFor: function (astm) {
      var gr = byAstm[normalizeKey(astm)];
      return gr && Number.isFinite(Number(gr.fy)) ? Number(gr.fy) : null;
    },

    fuFor: function (astm) {
      var gr = byAstm[normalizeKey(astm)];
      return gr && Number.isFinite(Number(gr.fu)) ? Number(gr.fu) : null;
    },

    /** Plain object ASTM → Fy (compatibility with legacy maps). */
    gradeToFyMap: function () {
      var o = Object.create(null);
      grades.forEach(function (gr) {
        if (gr && gr.astm != null && Number.isFinite(Number(gr.fy))) {
          o[String(gr.astm)] = Number(gr.fy);
        }
      });
      return o;
    },

    onUpdate: function (fn) {
      if (typeof fn === "function") listeners.push(fn);
    },

    reloadFromFetch: function () {
      return fetch("data/steel-grades.json", { credentials: "same-origin" }).then(function (r) {
        return r.ok ? r.json() : Promise.reject(new Error("steel-grades.json"));
      }).then(function (payload) {
        ingest(payload);
        g.__STEEL_GRADES_PAYLOAD__ = payload;
        return grades;
      });
    },
  };
})(typeof window !== "undefined" ? window : this);
