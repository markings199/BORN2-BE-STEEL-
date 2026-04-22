const steelData = require("../models/steelData");
const calculators = require("../utils/calculators");

function tension(req, res, next) {
  try {
    const v = req.validated;
    const result = calculators.tensionMember({
      Fy: v.Fy,
      Ag: v.Ag,
      Pu: v.Pu,
      phiT: v.phiT,
    });
    res.json({ check: "tension", input: v, result });
  } catch (err) {
    next(err);
  }
}

function compression(req, res, next) {
  try {
    const v = req.validated;
    const result = calculators.compressionMember({
      Fy: v.Fy,
      Ag: v.Ag,
      K: v.K,
      L: v.L,
      r: v.r,
      E: v.E,
      Pu: v.Pu,
      phiC: v.phiC,
    });
    res.json({ check: "compression", input: v, result });
  } catch (err) {
    next(err);
  }
}

function tensionRod(req, res, next) {
  try {
    const v = req.validated;
    const result = calculators.tensionRod({
      Fy: v.Fy,
      An: v.An,
      Pu: v.Pu,
      phiT: v.phiT,
    });
    res.json({ check: "tension-rod", input: v, result });
  } catch (err) {
    next(err);
  }
}

function bending(req, res, next) {
  try {
    const v = req.validated;
    const result = calculators.bendingCompact({
      Fy: v.Fy,
      Zx: v.Zx,
      Mu: v.Mu,
      phiB: v.phiB,
    });
    res.json({ check: "bending", input: v, result });
  } catch (err) {
    next(err);
  }
}

function shear(req, res, next) {
  try {
    const v = req.validated;
    const result = calculators.shearWeb({
      Fy: v.Fy,
      Aw: v.Aw,
      Vu: v.Vu,
      phiV: v.phiV,
    });
    res.json({ check: "shear", input: v, result });
  } catch (err) {
    next(err);
  }
}

function sectionProperties(req, res, next) {
  try {
    const v = { ...req.validated };
    const rawDesignation =
      typeof req.body.designation === "string" ? req.body.designation.trim() : "";
    if (rawDesignation) {
      const catalog = steelData.getSection(rawDesignation);
      if (!catalog) {
        return res.status(404).json({
          error: "Section not found",
          designation: rawDesignation,
        });
      }
      Object.assign(v, {
        Ix: v.Ix ?? catalog.Ix,
        Sx: v.Sx ?? catalog.Sx,
        Zx: v.Zx ?? catalog.Zx,
        Iy: v.Iy ?? catalog.Iy,
        Sy: v.Sy ?? catalog.Sy,
        Zy: v.Zy ?? catalog.Zy,
        Ag: v.Ag ?? catalog.Ag,
      });
    }

    const hasAny =
      v.Ix !== undefined ||
      v.Sx !== undefined ||
      v.Zx !== undefined ||
      v.Iy !== undefined ||
      v.Sy !== undefined ||
      v.Zy !== undefined ||
      v.Ag !== undefined;

    if (!hasAny) {
      return res.status(400).json({
        error:
          "Provide at least one property in the body, or designation of a known section.",
      });
    }

    const result = calculators.sectionPropertiesReport(v);
    if (rawDesignation) {
      result.catalogDesignation = rawDesignation;
    }
    res.json({ check: "section-properties", input: v, result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  tension,
  compression,
  tensionRod,
  bending,
  shear,
  sectionProperties,
};
