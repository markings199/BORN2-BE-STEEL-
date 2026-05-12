const fs = require("fs");
const path = require("path");
const steelData = require("../models/steelData");

const COMPRESSION_CAPACITY_JSON = path.join(
  __dirname,
  "..",
  "..",
  "frontend",
  "data",
  "compression-capacity.json"
);

function listSections(req, res, next) {
  try {
    res.json({ count: steelData.listSections().length, sections: steelData.listSections() });
  } catch (err) {
    next(err);
  }
}

function getSection(req, res, next) {
  try {
    const row = steelData.getSection(req.params.designation);
    if (!row) {
      return res.status(404).json({
        error: "Section not found",
        designation: req.params.designation,
      });
    }
    res.json(row);
  } catch (err) {
    next(err);
  }
}

/** Excel-exported `Compression-Capacity` rows (see `scripts/export-compression-capacity.js`). */
function listCompressionCapacity(req, res, next) {
  try {
    const raw = fs.readFileSync(COMPRESSION_CAPACITY_JSON, "utf8");
    const data = JSON.parse(raw);
    res.json({
      sourceWorkbook: data.sourceWorkbook,
      sheet: data.sheet,
      generatedAt: data.generatedAt,
      rowCount: data.rowCount,
      rows: data.rows || [],
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { listSections, getSection, listCompressionCapacity };
