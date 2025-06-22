const { Router } = require("express");
const { User, sequelize } = require("../../database/models");
const bcrypt = require("bcrypt");
const { signupSchema } = require("../../schemas/auth-schema");

const router = Router();

const saltRounds = 10;

router.post("/signup", async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const validationResult = signupSchema.safeParse(req.body);

    if (!validationResult.success) {
      await transaction.rollback();
      return res.status(400).json({
        error: "Validation failed",
        details: validationResult.error.format(),
      });
    }

    const { username, firstName, lastName, email, mobileNumber, password } =
      validationResult.data;

    const existingUser = await User.findOne({
      where: { username },
      transaction,
    });
    if (existingUser) {
      await transaction.rollback();
      return res.status(409).json({
        error: "Username already exists",
      });
    }

    const existingEmail = await User.findOne({ where: { email }, transaction });
    if (existingEmail) {
      await transaction.rollback();
      return res.status(409).json({
        error: "Email already exists",
      });
    }

    if (mobileNumber) {
      const existingMobile = await User.findOne({
        where: { mobileNumber },
        transaction,
      });
      if (existingMobile) {
        await transaction.rollback();
        return res.status(409).json({
          error: "Mobile Number already exists",
        });
      }
    }

    const hash = await bcrypt.hash(password, saltRounds);

    try {
      const newUser = await User.create(
        {
          username,
          firstName,
          lastName,
          email,
          mobileNumber,
          password: hash,
        },
        { transaction }
      );

      await transaction.commit();

      return res.status(201).json({
        id: newUser.id,
        username: newUser.username,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        mobileNumber: newUser.mobileNumber,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Error: Error creating user:", error);
      return res.status(500).json({
        error: "Internal server error",
      });
    }
  } catch (error) {
    await transaction.rollback();
    console.error("Error: Error creating user:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

module.exports = router;
