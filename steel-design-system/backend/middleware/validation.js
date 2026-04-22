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

module.exports = { validateBody, schemas };
