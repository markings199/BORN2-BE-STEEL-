(function (global) {
  "use strict";

  /** Same origin as the static app (Express serves /api on this host). */
  var base = "";

  global.SteelAPI = {
    base: base,

    get: function (path) {
      return fetch(base + path, {
        headers: { Accept: "application/json" },
      }).then(function (r) {
        return r.json().catch(function () {
          return {};
        }).then(function (data) {
          if (!r.ok) {
            throw new Error(data.error || r.statusText || String(r.status));
          }
          return data;
        });
      });
    },

    post: function (path, body) {
      return fetch(base + path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      }).then(function (r) {
        return r.json().catch(function () {
          return {};
        }).then(function (data) {
          if (!r.ok) {
            var msg =
              data.error ||
              (data.details && data.details.join("; ")) ||
              r.statusText ||
              String(r.status);
            throw new Error(msg);
          }
          return data;
        });
      });
    },

    health: function () {
      return this.get("/api/health");
    },

    listSections: function () {
      return this.get("/api/steel/sections");
    },

    getSection: function (designation) {
      return this.get(
        "/api/steel/sections/" + encodeURIComponent(designation)
      );
    },

    /** ASTM grades from Excel export (static JSON / embed); same shape as legacy mocks. */
    /** `Tension Rod` workbook-aligned demand + required diameter (ksi / kips). */
    tensionRodDesign: function (body) {
      var payload = body || {};
      var relPath = "/api/calculations/tension-rod-design";
      var host = typeof window !== "undefined" && window.location
        ? window.location.hostname
        : "";
      var port = typeof window !== "undefined" && window.location
        ? String(window.location.port || "")
        : "";
      var isLocalHost =
        host === "localhost" || host === "127.0.0.1" || host === "::1";
      var isLikelyStaticHost = isLocalHost && port && port !== "3040";

      // When frontend is served by a static dev server (e.g. :3000), call the API server directly.
      if (isLikelyStaticHost) {
        return this.post("http://localhost:3040" + relPath, payload).catch(
          function () {
            // Fallback to same-origin path for environments that proxy /api.
            return global.SteelAPI.post(relPath, payload);
          }
        );
      }
      return this.post(relPath, payload);
    },

    listSteelGrades: function () {
      var S = global.SteelGradesService;
      if (!S || typeof S.ensureLoaded !== "function") {
        return Promise.resolve({ grades: [] });
      }
      return S.ensureLoaded().then(function (list) {
        var out = (list || []).map(function (g) {
          return {
            astm: String(g.astm || "").trim(),
            fy: Number(g.fy),
            fu: Number(g.fu),
          };
        }).filter(function (g) {
          return g.astm && Number.isFinite(g.fy) && Number.isFinite(g.fu);
        });
        return { grades: out };
      });
    },

    /** Compression capacity database rows (prefer backend route, fallback to static JSON export). */
    listCompressionCapacity: function () {
      var self = this;
      return self.get("/api/steel/compression-capacity").catch(function () {
        return fetch("/data/compression-capacity.json", {
          headers: { Accept: "application/json" },
          credentials: "same-origin",
        }).then(function (r) {
          if (!r.ok) throw new Error(r.statusText || String(r.status));
          return r.json();
        });
      });
    },
  };
})(typeof window !== "undefined" ? window : this);
