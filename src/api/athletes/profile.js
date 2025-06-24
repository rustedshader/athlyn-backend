const { Router } = require("express");
const {
  Profile,
  Certification,
  Achievements,
  sequelize,
} = require("../../database/models");
const { authenticateToken } = require("../../security/jwt");
const { z } = require("zod");
const {
  addStatsSchema,
  addAchievementsSchema,
  ProfileSchema,
  FileSchema,
} = require("../../schemas/athletes-schema");

const router = Router();

router.get("/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    const profile = await Profile.findOne({
      where: { userId: userId },
      include: [
        {
          model: Certification,
          attributes: [
            "id",
            "fileUrl",
            "title",
            "issuedBy",
            "createdAt",
            "updatedAt",
          ],
        },
        {
          model: Achievements,
          attributes: [
            "id",
            "title",
            "description",
            "date",
            "createdAt",
            "updatedAt",
          ],
        },
      ],
    });

    if (!profile) {
      return res.status(404).json({
        error: "Athlete profile not found",
      });
    }

    return res.status(200).json({
      id: profile.id,
      sports: profile.sports,
      bio: profile.bio,
      age: profile.age,
      location: profile.location,
      stats: profile.stats,
      certifications: profile.Certifications,
      achievements: profile.Achievements,
    });
  } catch (error) {
    console.error("Error: Error retrieving athlete profile:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

router.put("/:userId", authenticateToken, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { userId } = req.params;

    const { sports, bio, age, location, stats, certifications, achievements } =
      req.body;

    const profileValidation = ProfileSchema.safeParse({
      sports,
      bio,
      age,
      location,
    });
    if (!profileValidation.success) {
      await transaction.rollback();
      return res.status(400).json({
        error: "Validation failed for profile fields",
        details: profileValidation.error.format(),
      });
    }

    if (stats !== undefined) {
      const statsValidation = addStatsSchema.safeParse({ stats });
      if (!statsValidation.success) {
        await transaction.rollback();
        return res.status(400).json({
          error: "Validation failed for stats",
          details: statsValidation.error.format(),
        });
      }
    }

    if (certifications !== undefined) {
      if (!Array.isArray(certifications)) {
        await transaction.rollback();
        return res.status(400).json({
          error: "Certifications must be an array",
        });
      }
      for (const cert of certifications) {
        const certValidation = FileSchema.safeParse({
          userId: userId,
          title: cert.title,
          issuedBy: cert.issuedBy,
          url: cert.fileUrl,
          originalName: cert.originalName,
          mimeType: cert.mimeType,
          size: cert.size,
        });
        if (!certValidation.success) {
          await transaction.rollback();
          return res.status(400).json({
            error: "Validation failed for certifications",
            details: certValidation.error.format(),
          });
        }
      }
    }

    if (achievements !== undefined) {
      if (!Array.isArray(achievements)) {
        await transaction.rollback();
        return res.status(400).json({
          error: "Achievements must be an array",
        });
      }
      for (const ach of achievements) {
        const achValidation = addAchievementsSchema.safeParse(ach);
        if (!achValidation.success) {
          await transaction.rollback();
          return res.status(400).json({
            error: "Validation failed for achievements",
            details: achValidation.error.format(),
          });
        }
      }
    }

    const profile = await Profile.findOne({
      where: { userId: userId }, // Fix: Use userId instead of id
      transaction,
    });

    if (!profile) {
      await transaction.rollback();
      return res.status(404).json({
        error: "Athlete profile not found",
      });
    }

    const updatedProfileFields = {};
    if (sports !== undefined) updatedProfileFields.sports = sports;
    if (bio !== undefined) updatedProfileFields.bio = bio;
    if (age !== undefined) updatedProfileFields.age = age;
    if (location !== undefined) updatedProfileFields.location = location;
    if (stats !== undefined) {
      const currentStats = Array.isArray(profile.stats) ? profile.stats : [];
      const newStats = stats;
      const totalStats = [...currentStats, ...newStats];
      if (totalStats.length > 50) {
        await transaction.rollback();
        return res.status(400).json({
          error: "Total stats cannot exceed 50 entries",
        });
      }
      updatedProfileFields.stats = totalStats;
    }

    await profile.update(updatedProfileFields, { transaction });

    if (certifications !== undefined) {
      await Certification.destroy({
        where: { profileId: profile.id },
        transaction,
      });

      const certificationPromises = certifications.map((cert) =>
        Certification.create(
          {
            userId: userId,
            profileId: profile.id,
            fileUrl: cert.fileUrl,
            title: cert.title,
            issuedBy: cert.issuedBy,
          },
          { transaction }
        )
      );
      await Promise.all(certificationPromises);
    }

    if (achievements !== undefined) {
      await Achievements.destroy({
        where: { profileId: profile.id },
        transaction,
      });

      const achievementPromises = achievements.map((ach) =>
        Achievements.create(
          {
            userId: userId,
            profileId: profile.id,
            title: ach.title,
            description: ach.description,
            date: ach.date,
          },
          { transaction }
        )
      );
      await Promise.all(achievementPromises);
    }

    await transaction.commit();

    const updatedProfile = await Profile.findOne({
      where: { userId: userId }, // Fix: Use userId instead of id
      include: [
        {
          model: Certification,
          attributes: [
            "id",
            "fileUrl",
            "title",
            "issuedBy",
            "createdAt",
            "updatedAt",
          ],
        },
        {
          model: Achievements,
          attributes: [
            "id",
            "title",
            "description",
            "date",
            "createdAt",
            "updatedAt",
          ],
        },
      ],
      // Remove transaction since it's already committed
    });

    return res.status(200).json({
      id: updatedProfile.id,
      sports: updatedProfile.sports,
      bio: updatedProfile.bio,
      age: updatedProfile.age,
      location: updatedProfile.location,
      stats: updatedProfile.stats,
      certifications: updatedProfile.Certifications,
      achievements: updatedProfile.Achievements,
      createdAt: updatedProfile.createdAt,
      updatedAt: updatedProfile.updatedAt,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error: updating athlete profile:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

module.exports = router;
