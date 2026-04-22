(function (global) {
  "use strict";

  global.SteelUtils = {
    parseNum: function (value) {
      if (value === "" || value == null) return null;
      var n = Number(value);
      return Number.isFinite(n) ? n : null;
    },

    clamp: function (x, lo, hi) {
      return Math.min(hi, Math.max(lo, x));
    },

    formatRatio: function (r) {
      if (r == null || !Number.isFinite(r)) return "—";
      return (Math.round(r * 1000) / 1000).toString();
    },
  };
})(typeof window !== "undefined" ? window : this);
