const { Router } = require("express");
const signupRouter = require("./signup");
const loginRouter = require("./login");

const router = Router();

router.use("/signup", signupRouter);
router.use("/login", loginRouter);

module.exports = router;
