const { Router } = require("express");
const profileRouter = require("./profile");
const statsRouter = require("./stats");
const achievementsRouter = require("./achievements");
const certificationsRouter = require("./certifications");
const router = Router();

router.use(profileRouter);
router.use("/stats", statsRouter);
router.use("/achievements", achievementsRouter);
router.use("/certifications", certificationsRouter);

module.exports = router;
