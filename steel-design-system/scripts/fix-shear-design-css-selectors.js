/**
 * Repairs broken selectors where "#bendDesignView, #shearSection #shearViewDesign"
 * lost the shared suffix on the bending side.
 */
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "frontend", "index.html");
let s = fs.readFileSync(file, "utf8");

/* Glued: #bendDesignView, #shearSection #shearViewDesign.bend-view... */
s = s.replace(
  /#bendingSection #bendDesignView, #shearSection (#shearViewDesign((?:\.[a-zA-Z0-9_-]+)+))\s*\{/g,
  (m, _full, suf) =>
    `#bendingSection #bendDesignView${suf}, #shearSection #shearViewDesign${suf} {`
);

/* Space before descendant: repeat suffix on both roots */
s = s.replace(
  /#bendingSection #bendDesignView, #shearSection #shearViewDesign(\s.+?)\s*\{/g,
  (m, rest) =>
    `#bendingSection #bendDesignView${rest}, #shearSection #shearViewDesign${rest} {`
);

fs.writeFileSync(file, s);
console.log("fix-shear-design-css-selectors: OK");
