const express = require("express");
const sequelize = require("./database/config/connection");
const mainRouter = require("./api");

const PORT = 3000;

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log(`Log: Database Connection Successful`);
  } catch (error) {
    console.error(`Error: Could not connect to the Database`);
    process.exit(1);
  }
}

const app = express();

app.use(express.json());

app.use("/api", mainRouter);

app.use((req, res, next) => {
  console.log(`Log: Request Path`, req.path);
  next();
});

testConnection();

sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Log: API listening on port ${PORT}`);
  });
});
