const express = require("express");
const calculationController = require("../controllers/calculationController");
const {
  validateBody,
  schemas,
  validateTensionRodDesign,
} = require("../middleware/validation");

const router = express.Router();

router.post(
  "/tension-rod-design",
  validateTensionRodDesign,
  calculationController.tensionRodDesignSheet
);

router.post(
  "/tension",
  validateBody(schemas.tension),
  calculationController.tension
);
router.post(
  "/compression",
  validateBody(schemas.compression),
  calculationController.compression
);
router.post(
  "/tension-rod",
  validateBody(schemas.tensionRod),
  calculationController.tensionRod
);
router.post(
  "/bending",
  validateBody(schemas.bending),
  calculationController.bending
);
router.post(
  "/shear",
  validateBody(schemas.shear),
  calculationController.shear
);
router.post(
  "/section-properties",
  validateBody(schemas.sectionProperties),
  calculationController.sectionProperties
);

module.exports = router;
