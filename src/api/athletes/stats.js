const { Router } = require("express");
const { Profile, sequelize } = require("../../database/models");
const {
  addStatsSchema,
  updateStatsSchema,
} = require("../../schemas/athletes-schema");

const router = Router();

router.post("/add-stats", async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const validationResult = addStatsSchema.safeParse(req.body);

    if (!validationResult.success) {
      await transaction.rollback();
      return res.status(400).json({
        error: "Validation failed",
        details: validationResult.error.format(),
      });
    }

    const { userId, stats } = validationResult.data;

    const profile = await Profile.findOne({
      where: { userId },
      transaction,
    });

    if (!profile) {
      await transaction.rollback();
      return res.status(404).json({
        error: "Profile not found for the given user ID",
      });
    }

    const updatedStats = [...(profile.stats || []), ...stats];

    if (updatedStats.length > 50) {
      await transaction.rollback();
      return res.status(400).json({
        error: "Total stats cannot exceed 50 entries",
      });
    }

    await profile.update({ stats: updatedStats }, { transaction });

    await transaction.commit();

    return res.status(200).json({
      message: "Stats added successfully",
      profile: {
        id: profile.id,
        userId: profile.userId,
        sports: profile.sports,
        bio: profile.bio,
        age: profile.age,
        location: profile.location,
        stats: profile.stats,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error: Error adding profile stats:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

router.post("/update-stats", async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const validationResult = updateStatsSchema.safeParse(req.body);

    if (!validationResult.success) {
      await transaction.rollback();
      return res.status(400).json({
        error: "Validation failed",
        details: validationResult.error.format(),
      });
    }

    const { userId, stats } = validationResult.data;

    const profile = await Profile.findOne({
      where: { userId },
      transaction,
    });

    if (!profile) {
      await transaction.rollback();
      return res.status(404).json({
        error: "Profile not found for the given user ID",
      });
    }

    await profile.update({ stats }, { transaction });

    await transaction.commit();

    return res.status(200).json({
      message: "Stats updated successfully",
      profile: {
        id: profile.id,
        userId: profile.userId,
        sports: profile.sports,
        bio: profile.bio,
        age: profile.age,
        location: profile.location,
        stats: profile.stats,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error: Error updating profile stats:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

module.exports = router;
