const { Router } = require("express");
const { User, Profile, sequelize } = require("../../database/models");
const bcrypt = require("bcrypt");
const { loginSchema } = require("../../schemas/auth-schema");

const router = Router();

// Added Transactions -> https://sequelize.org/docs/v6/other-topics/transactions/#unmanaged-transactions

router.post("/login", async (req, res) => {
  try {
    const validationResult = loginSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationResult.error.format(),
      });
    }

    const { username, password } = validationResult.data;

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({
        error: "Invalid username or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Invalid username or password",
      });
    }

    const transaction = await sequelize.transaction();
    try {
      let profile = await Profile.findOne({
        where: { userId: user.id },
        transaction,
      });
      if (!profile) {
        profile = await Profile.create(
          {
            userId: user.id,
            sports: [],
            bio: null,
            age: null,
            location: null,
            stats: [],
          },
          { transaction }
        );
      }

      await transaction.commit();

      return res.status(200).json({
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobileNumber: user.mobileNumber,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        profile: {
          id: profile.id,
          sports: profile.sports,
          bio: profile.bio,
          age: profile.age,
          location: profile.location,
          stats: profile.stats,
        },
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Error: Error creating profile:", error);
      return res.status(500).json({
        error: "Internal server error",
      });
    }
  } catch (error) {
    console.error("Error: Error logging in user:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

module.exports = router;
