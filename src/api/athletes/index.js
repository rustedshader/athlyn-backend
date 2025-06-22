const { Router } = require("express");
const profileRouter = require("./profile");
const router = Router();

router.use(profileRouter);

module.exports = router;
