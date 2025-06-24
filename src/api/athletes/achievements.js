const { Router } = require("express");
const { Profile, Achievements, sequelize } = require("../../database/models");
const {
  addAchievementsSchema,
  updateAchievementsSchema,
} = require("../../schemas/athletes-schema");
const { authenticateToken } = require("../../security/jwt");

const router = Router();

router.get("/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        error: "User ID is required",
      });
    }

    const profile = await Profile.findOne({
      where: { userId },
      include: [{ model: Achievements }],
    });

    if (!profile) {
      return res.status(404).json({
        error: "Profile not found for the given user ID",
      });
    }

    return res.status(200).json({
      achievements: profile.Achievements || [],
    });
  } catch (error) {
    console.error("Error: Error retrieving achievements:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

router.post("/:userId", authenticateToken, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { userId } = req.params;
    const validationResult = addAchievementsSchema.safeParse(req.body);

    if (!validationResult.success) {
      await transaction.rollback();
      return res.status(400).json({
        error: "Validation failed",
        details: validationResult.error.format(),
      });
    }

    const { title, description, date } = validationResult.data;

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

    const achievement = await Achievements.create(
      {
        title,
        description,
        date,
        userId,
        profileId: profile.id,
      },
      { transaction }
    );

    await transaction.commit();

    return res.status(201).json({
      message: "Achievement added successfully",
      achievement: {
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        date: achievement.date,
        userId: achievement.userId,
        profileId: achievement.profileId,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error: Error adding achievement:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

router.put("/:userId/:achievementId", authenticateToken, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { userId, achievementId } = req.params;
    const validationResult = updateAchievementsSchema.safeParse(req.body);

    if (!validationResult.success) {
      await transaction.rollback();
      return res.status(400).json({
        error: "Validation failed",
        details: validationResult.error.format(),
      });
    }

    const { title, description, date } = validationResult.data;

    const achievement = await Achievements.findOne({
      where: {
        id: achievementId,
        userId,
      },
      transaction,
    });

    if (!achievement) {
      await transaction.rollback();
      return res.status(404).json({
        error:
          "Achievement not found or you don't have permission to update it",
      });
    }

    await achievement.update(
      {
        title,
        description,
        date,
      },
      { transaction }
    );

    await transaction.commit();

    return res.status(200).json({
      message: "Achievement updated successfully",
      achievement: {
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        date: achievement.date,
        userId: achievement.userId,
        profileId: achievement.profileId,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error: Error updating achievement:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

module.exports = router;
