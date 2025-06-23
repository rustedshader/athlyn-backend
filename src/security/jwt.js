import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export function generateAccessToken(username) {
  return jwt.sign({ username }, process.env.JWT_SECRET, {
    expiresIn: 1800,
  });
}

export function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    console.error(`Error: ${err}`);

    if (err) return res.sendStatus(403);

    req.user = user;

    next();
  });
}

// console.log(generateAccessToken("rustedshader"));
