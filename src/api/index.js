const { Router } = require("express");
const authRouter = require("./auth");
const athletesRouter = require("./athletes");
const mainRouter = Router();

mainRouter.use("/auth", authRouter);
mainRouter.use("/athletes", athletesRouter);

module.exports = mainRouter;
