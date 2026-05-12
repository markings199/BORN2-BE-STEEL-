const express = require("express");
const steelController = require("../controllers/steelController");
const calculationRoutes = require("./calculations");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "steel-design-system",
    timestamp: new Date().toISOString(),
  });
});

router.get("/steel/sections", steelController.listSections);
router.get("/steel/sections/:designation", steelController.getSection);
router.get("/steel/compression-capacity", steelController.listCompressionCapacity);

router.use("/calculations", calculationRoutes);

module.exports = router;
