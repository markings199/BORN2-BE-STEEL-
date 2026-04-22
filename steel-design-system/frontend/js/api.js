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
  };
})(typeof window !== "undefined" ? window : this);
