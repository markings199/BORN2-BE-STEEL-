(function (global) {
  "use strict";

  var api = global.SteelAPI;
  if (!api) {
    return;
  }

  /** Calls your Express /api/calculations/* routes (LRFD helpers on the server). */
  global.SteelCalculator = {
    tension: function (body) {
      return api.post("/api/calculations/tension", body);
    },
    compression: function (body) {
      return api.post("/api/calculations/compression", body);
    },
    tensionRod: function (body) {
      return api.post("/api/calculations/tension-rod", body);
    },
    bending: function (body) {
      return api.post("/api/calculations/bending", body);
    },
    shear: function (body) {
      return api.post("/api/calculations/shear", body);
    },
    sectionProperties: function (body) {
      return api.post("/api/calculations/section-properties", body);
    },
  };
})(typeof window !== "undefined" ? window : this);
