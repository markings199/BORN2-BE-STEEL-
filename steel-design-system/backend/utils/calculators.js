const E_DEFAULT_KSI = 29000;
const PHI_T_DEFAULT = 0.9;
const PHI_C_DEFAULT = 0.9;
const PHI_B_DEFAULT = 0.9;
const PHI_V_DEFAULT = 1.0;

function tensionMember({ Fy, Ag, Pu, phiT = PHI_T_DEFAULT }) {
  const Pn = Fy * Ag;
  const phiPn = phiT * Pn;
  const utilization =
    Pu !== undefined && phiPn > 0 ? Pu / phiPn : undefined;
  return {
    unit: "US customary: Fy (ksi), Ag (in^2), forces (kips), moments (kip-ft)",
    nominal: { Pn },
    design: { phiT, phiPn },
    utilization: utilization !== undefined ? { Pu, ratio: utilization } : undefined,
    notes: ["Nominal: Pn = Fy*Ag per AISC 360 Chapter D (yielding on gross area)."],
  };
}

function tensionRod({ Fy, An, Pu, phiT = PHI_T_DEFAULT }) {
  const Pn = Fy * An;
  const phiPn = phiT * Pn;
  const utilization =
    Pu !== undefined && phiPn > 0 ? Pu / phiPn : undefined;
  return {
    unit: "US customary: Fy (ksi), An (in^2), forces (kips)",
    nominal: { Pn },
    design: { phiT, phiPn },
    utilization: utilization !== undefined ? { Pu, ratio: utilization } : undefined,
    notes: [
      "Simplified: Pn = Fy*An on net area; connection/threads not modeled - verify per AISC D.",
    ],
  };
}

/**
 * `Tension Rod` workbook — demand O25, net required gross bolt area Y23, rod dia Z34.
 * LRFD: O25=MAX(N31,R31), N31=1.2*DL+1.6*LL, R31=1.4*DL; ASD: O25=N31 (DL+LL).
 * Y23 = O25/(0.75*0.75*Fu); Z34 = SQRT(Y23/(PI()/4)).
 */
function tensionRodDesignSheet({
  method,
  deadLoadKips = 0,
  liveLoadKips = 0,
  Fu,
}) {
  const m = String(method || "LRFD").trim().toUpperCase();
  if (m !== "LRFD" && m !== "ASD") {
    const err = new Error('method must be "LRFD" or "ASD"');
    err.status = 400;
    throw err;
  }
  if (!Number.isFinite(Fu) || Fu <= 0) {
    const err = new Error("Fu must be a positive finite number");
    err.status = 400;
    throw err;
  }

  const dl = Math.max(0, Number(deadLoadKips) || 0);
  const ll = Math.max(0, Number(liveLoadKips) || 0);

  let combo1Kips;
  let combo2Kips;
  let governingKips;

  if (m === "ASD") {
    combo1Kips = dl + ll;
    combo2Kips = null;
    governingKips = combo1Kips;
  } else {
    combo1Kips = 1.2 * dl + 1.6 * ll;
    combo2Kips = 1.4 * dl;
    governingKips = Math.max(combo1Kips, combo2Kips);
  }

  const requiredAbIn2 = governingKips / (0.75 * 0.75 * Fu);
  const diameterIn = Math.sqrt(requiredAbIn2 / (Math.PI / 4));

  return {
    method: m,
    combo1Kips,
    combo2Kips,
    governingKips,
    requiredAbIn2,
    diameterIn,
    labels: {
      demandLineFull:
        m === "LRFD"
          ? "→ (LRFD METHOD) GOVERNING Tu ="
          : "→ (ASD METHOD) ALLOWABLE Ta =",
      eq1: m === "LRFD" ? "1.2DL+1.6LL" : "DL+LL",
      eq2: m === "LRFD" ? "Tu =1.4DL" : "Ta =",
      strengthFormula:
        m === "LRFD"
          ? "Tu =(0.75)(0.75)(Fu)(Ab)"
          : "Ta=(0.75)(Fu)(Ab)/2",
    },
  };
}

function flexuralBucklingStress({ Fy, E, KLr }) {
  if (KLr <= 0 || !Number.isFinite(KLr)) {
    const err = new Error("KL/r must be a positive finite number");
    err.status = 400;
    throw err;
  }
  const Fe = (Math.PI ** 2 * E) / (KLr ** 2);
  const limit = 4.71 * Math.sqrt(E / Fy);
  let Fcr;
  if (KLr <= limit) {
    const exp = Fy / Fe;
    Fcr = Math.pow(0.658, exp) * Fy;
  } else {
    Fcr = 0.877 * Fe;
  }
  return { Fe, Fcr, limitKLr: limit };
}

function compressionMember({
  Fy,
  Ag,
  K,
  L,
  r,
  E = E_DEFAULT_KSI,
  Pu,
  phiC = PHI_C_DEFAULT,
}) {
  const KLr = (K * L) / r;
  const { Fe, Fcr, limitKLr } = flexuralBucklingStress({ Fy, E, KLr });
  const Pn = Fcr * Ag;
  const phiPn = phiC * Pn;
  const utilization =
    Pu !== undefined && phiPn > 0 ? Pu / phiPn : undefined;
  return {
    unit: "US customary: Fy, E (ksi); Ag (in^2); K*L and r (in); forces (kips)",
    slenderness: { KLr, Fe, limitKLr },
    nominal: { Fcr, Pn },
    design: { phiC, phiPn },
    utilization: utilization !== undefined ? { Pu, ratio: utilization } : undefined,
    notes: [
      "Flexural buckling only (AISC 360 E3); no torsional/flexural-torsional checks.",
    ],
  };
}

function bendingCompact({ Fy, Zx, Mu, phiB = PHI_B_DEFAULT }) {
  const Mn_kip_in = Fy * Zx;
  const Mn_kip_ft = Mn_kip_in / 12;
  const phiMn_kip_ft = (phiB * Mn_kip_in) / 12;
  const utilization =
    Mu !== undefined && phiMn_kip_ft > 0 ? Mu / phiMn_kip_ft : undefined;
  return {
    unit: "US customary: Fy (ksi), Zx (in^3), moments (kip-ft)",
    nominal: { Mn_kip_in, Mn_kip_ft },
    design: { phiB, phiMn_kip_ft },
    utilization: utilization !== undefined ? { Mu, ratio: utilization } : undefined,
    notes: [
      "Plastic moment: Mn = Fy*Zx for compact doubly symmetric I-shapes (AISC 360 Chapter F overview).",
      "Lateral-torsional buckling and flange local buckling not checked here.",
    ],
  };
}

function shearWeb({ Fy, Aw, Vu, phiV = PHI_V_DEFAULT }) {
  const Vn = 0.6 * Fy * Aw;
  const phiVn = phiV * Vn;
  const utilization =
    Vu !== undefined && phiVn > 0 ? Vu / phiVn : undefined;
  return {
    unit: "US customary: Fy (ksi), Aw (in^2), forces (kips)",
    nominal: { Vn },
    design: { phiV, phiVn },
    utilization: utilization !== undefined ? { Vu, ratio: utilization } : undefined,
    notes: ["Web shear yielding: Vn = 0.6*Fy*Aw (AISC 360 G2.1)."],
  };
}

function sectionPropertiesReport(props) {
  const out = { ...props };

  let rx;
  if (props.rx !== undefined && Number.isFinite(Number(props.rx))) {
    rx = Number(props.rx);
  } else if (
    props.Ix !== undefined &&
    props.Ag !== undefined &&
    props.Ag > 0
  ) {
    rx = Number(Math.sqrt(props.Ix / props.Ag).toFixed(4));
  }

  let ry;
  if (props.ry !== undefined && Number.isFinite(Number(props.ry))) {
    ry = Number(props.ry);
  } else if (
    props.Iy !== undefined &&
    props.Ag !== undefined &&
    props.Ag > 0
  ) {
    ry = Number(Math.sqrt(props.Iy / props.Ag).toFixed(4));
  }

  if (rx !== undefined) out.rx = rx;
  if (ry !== undefined) out.ry = ry;

  return {
    unit: "Lengths in inches; Ag (in^2); I (in^4); S, Z (in^3); rx, ry (in)",
    properties: out,
    notes: [
      "When rx and ry are supplied (Key Geometric Properties / catalog), those values are used as in Excel.",
      "Otherwise rx = sqrt(Ix/Ag), ry = sqrt(Iy/Ag) when the inputs needed are present.",
    ],
  };
}

module.exports = {
  tensionMember,
  tensionRod,
  tensionRodDesignSheet,
  compressionMember,
  bendingCompact,
  shearWeb,
  sectionPropertiesReport,
  E_DEFAULT_KSI,
};
