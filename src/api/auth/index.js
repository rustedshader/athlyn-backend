const { Router } = require("express");
const signupRouter = require("./signup");
const loginRouter = require("./login");

const router = Router();

router.use(signupRouter);
router.use(loginRouter);

module.exports = router;
