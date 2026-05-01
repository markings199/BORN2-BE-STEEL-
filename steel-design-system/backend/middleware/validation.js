function pickNumber(obj, key, { required = true, positive = false, min, max } = {}) {
  if (obj[key] === undefined || obj[key] === null || obj[key] === "") {
    if (!required) return { ok: true, value: undefined };
    return { ok: false, error: `${key} is required` };
  }
  const n = Number(obj[key]);
  if (!Number.isFinite(n)) {
    return { ok: false, error: `${key} must be a finite number` };
  }
  if (positive && n <= 0) {
    return { ok: false, error: `${key} must be positive` };
  }
  if (min !== undefined && n < min) {
    return { ok: false, error: `${key} must be >= ${min}` };
  }
  if (max !== undefined && n > max) {
    return { ok: false, error: `${key} must be <= ${max}` };
  }
  return { ok: true, value: n };
}

function validateBody(schema) {
  return (req, res, next) => {
    const errors = [];
    const out = {};

    for (const field of schema) {
      const result = pickNumber(req.body, field.key, field.opts || {});
      if (!result.ok) {
        errors.push(result.error);
      } else if (result.value !== undefined) {
        out[field.key] = result.value;
      }
    }

    if (errors.length) {
      return res.status(400).json({ error: "Validation failed", details: errors });
    }

    req.validated = out;
    next();
  };
}

const positive = { positive: true };

const schemas = {
  tension: [
    { key: "Fy", opts: { ...positive } },
    { key: "Ag", opts: { ...positive } },
    { key: "Pu", opts: { required: false, ...positive } },
    { key: "phiT", opts: { required: false, min: 0.5, max: 1.0 } },
  ],
  compression: [
    { key: "Fy", opts: { ...positive } },
    { key: "Ag", opts: { ...positive } },
    { key: "K", opts: { ...positive } },
    { key: "L", opts: { ...positive } },
    { key: "r", opts: { ...positive } },
    { key: "E", opts: { required: false, ...positive } },
    { key: "Pu", opts: { required: false, ...positive } },
    { key: "phiC", opts: { required: false, min: 0.5, max: 1.0 } },
  ],
  tensionRod: [
    { key: "Fy", opts: { ...positive } },
    { key: "An", opts: { ...positive } },
    { key: "Pu", opts: { required: false, ...positive } },
    { key: "phiT", opts: { required: false, min: 0.5, max: 1.0 } },
  ],
  bending: [
    { key: "Fy", opts: { ...positive } },
    { key: "Zx", opts: { ...positive } },
    { key: "Mu", opts: { required: false, ...positive } },
    { key: "phiB", opts: { required: false, min: 0.5, max: 1.0 } },
  ],
  shear: [
    { key: "Fy", opts: { ...positive } },
    { key: "Aw", opts: { ...positive } },
    { key: "Vu", opts: { required: false, ...positive } },
    { key: "phiV", opts: { required: false, min: 0.5, max: 1.0 } },
  ],
  sectionProperties: [
    { key: "Ix", opts: { required: false, ...positive } },
    { key: "Sx", opts: { required: false, ...positive } },
    { key: "Zx", opts: { required: false, ...positive } },
    { key: "Iy", opts: { required: false, ...positive } },
    { key: "Sy", opts: { required: false, ...positive } },
    { key: "Zy", opts: { required: false, ...positive } },
    { key: "Ag", opts: { required: false, ...positive } },
  ],
};

/** Born2BeSteel `Tension Rod` sheet inputs (ksi / kips). */
function validateTensionRodDesign(req, res, next) {
  const errors = [];

  const method = String(req.body.method ?? "LRFD")
    .trim()
    .toUpperCase();
  if (method !== "LRFD" && method !== "ASD") {
    errors.push('method must be "LRFD" or "ASD"');
  }

  function nonNegative(name, val, required = true) {
    if (val === undefined || val === null || val === "") {
      if (!required) return undefined;
      errors.push(`${name} is required`);
      return undefined;
    }
    const n = Number(val);
    if (!Number.isFinite(n)) {
      errors.push(`${name} must be a finite number`);
      return undefined;
    }
    if (n < 0) {
      errors.push(`${name} must be >= 0`);
      return undefined;
    }
    return n;
  }

  const deadLoadKips = nonNegative("deadLoadKips", req.body.deadLoadKips);
  const liveLoadKips = nonNegative("liveLoadKips", req.body.liveLoadKips);

  const fuRaw = req.body.Fu;
  if (fuRaw === undefined || fuRaw === null || fuRaw === "") {
    errors.push("Fu is required");
  } else {
    const Fu = Number(fuRaw);
    if (!Number.isFinite(Fu)) errors.push("Fu must be a finite number");
    else if (Fu <= 0) errors.push("Fu must be positive");
  }

  let modulusEKsi;
  const eRaw = req.body.modulusEKsi;
  if (eRaw !== undefined && eRaw !== null && eRaw !== "") {
    const E = Number(eRaw);
    if (!Number.isFinite(E)) errors.push("modulusEKsi must be a finite number");
    else if (E <= 0) errors.push("modulusEKsi must be positive");
    else modulusEKsi = E;
  }

  if (errors.length) {
    return res.status(400).json({ error: "Validation failed", details: errors });
  }

  req.validated = {
    method,
    deadLoadKips,
    liveLoadKips,
    Fu: Number(req.body.Fu),
    modulusEKsi,
  };
  next();
}

module.exports = { validateBody, schemas, validateTensionRodDesign };
