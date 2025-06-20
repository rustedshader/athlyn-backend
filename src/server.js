const express = require("express");
const sequelize = require("./database/config/connection");
const mainRouter = require("./api");

const PORT = 3000;

const app = express();

app.use(express.json());

app.use("/api", mainRouter);

sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
  });
});
