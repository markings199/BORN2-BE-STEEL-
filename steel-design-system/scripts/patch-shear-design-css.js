/**
 * Mirrors Bending Design Calculator CSS selectors onto Shear (#shearSection #shearViewDesign).
 */
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "frontend", "index.html");
let s = fs.readFileSync(file, "utf8");

function expandBendDesignSelectors(sel) {
  return sel.replace(/#bendingSection #bendDesignView/g, "#shearSection #shearViewDesign").replace(
    /#bendingDesignGrade/g,
    "#shearSteelGrade"
  ).replace(/#bendingDesignE/g, "#shearE").replace(/#bendingDesignFy/g, "#shearFy").replace(
    /#bendingDesignSafeSection/g,
    "#shearDesignSectionName"
  );
}

/** True when rule needs a parallel shear-* ID branch (not :not(#bending...) references). */
function needsShearIdBranch(line) {
  return (
    /(?:^|[,\s])#bendingDesign(?:Grade|E|Fy|SafeSection)\b/.test(line) ||
    /(?:^|[,\s])input#bendingDesign(?:E|Fy)\b/.test(line) ||
    /(?:^|[,\s])select#bendingDesignGrade\b/.test(line)
  );
}

const lines = s.split("\n");
const out = lines.map((line) => {
  if (!line.includes("#bendingSection #bendDesignView")) return line;
  if (line.includes("#shearSection #shearViewDesign")) return line;

  const brace = line.indexOf("{");
  if (brace === -1) return line;

  let selectors = line.slice(0, brace).trimEnd();
  const rest = line.slice(brace);

  if (needsShearIdBranch(line)) {
    const shearSel = expandBendDesignSelectors(selectors);
    if (shearSel !== selectors) {
      const indent = line.match(/^\s*/)[0];
      const mid =
        selectors.includes(",") && line.includes(",")
          ? ",\n    " + indent.replace(/\n/g, "") + shearSel
          : ", " + shearSel;
      return selectors + mid + " " + rest;
    }
    return line;
  }

  const doubled = selectors.replace(
    /#bendingSection #bendDesignView/g,
    "#bendingSection #bendDesignView, #shearSection #shearViewDesign"
  );
  return doubled + " " + rest;
});

s = out.join("\n");

/* Dashboard shell: tabs + grid span — include #shearSection */
s = s.replace(
  /#bendingSection \.bending-calculator-dashboard \{/g,
  "#bendingSection .bending-calculator-dashboard,\n    #shearSection .bending-calculator-dashboard {"
);
s = s.replace(
  /#bendingSection \.bending-calculator-dashboard > \.compression-top-tabs \{/g,
  "#bendingSection .bending-calculator-dashboard > .compression-top-tabs,\n    #shearSection .bending-calculator-dashboard > .compression-top-tabs {"
);
s = s.replace(
  /#bendingSection \.bending-calculator-dashboard \.compression-tab \{/g,
  "#bendingSection .bending-calculator-dashboard .compression-tab,\n    #shearSection .bending-calculator-dashboard .compression-tab {"
);
s = s.replace(
  /#bendingSection \.bending-calculator-dashboard \.compression-tab\.is-active \{/g,
  "#bendingSection .bending-calculator-dashboard .compression-tab.is-active,\n    #shearSection .bending-calculator-dashboard .compression-tab.is-active {"
);

s = s.replace(
  /#bendingSection \.bending-calculator-dashboard > #bendDesignView \{/g,
  "#bendingSection .bending-calculator-dashboard > #bendDesignView,\n    #shearSection .bending-calculator-dashboard > #shearViewDesign {"
);
s = s.replace(
  /#bendingSection \.bending-calculator-dashboard > #bendAnalysisView \{/g,
  "#bendingSection .bending-calculator-dashboard > #bendAnalysisView,\n    #shearSection .bending-calculator-dashboard > #shearViewAnalysis {"
);
s = s.replace(
  /#bendingSection \.bending-calculator-dashboard > #bendCapacityView \{/g,
  "#bendingSection .bending-calculator-dashboard > #bendCapacityView,\n    #shearSection .bending-calculator-dashboard > #shearViewCapacity {"
);

fs.writeFileSync(file, s);
console.log("patch-shear-design-css: wrote", file);
