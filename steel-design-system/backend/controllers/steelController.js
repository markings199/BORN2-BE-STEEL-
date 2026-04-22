const steelData = require("../models/steelData");

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

module.exports = { listSections, getSection };
