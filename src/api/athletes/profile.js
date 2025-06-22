const { Router } = require("express");
const {
  Profile,
  Certification,
  Achievements,
  sequelize,
} = require("../../database/models");

const router = Router();

// TODO: Test and refactor Update Athlete Profile according to need.

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const profile = await Profile.findOne({
      where: { userId: id },
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

router.put("/:id", async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { sports, bio, age, location, stats, certifications, achievements } =
      req.body;

    const profile = await Profile.findOne({
      where: { userId: id },
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
    if (stats !== undefined) updatedProfileFields.stats = stats;

    await profile.update(updatedProfileFields, { transaction });

    if (certifications && Array.isArray(certifications)) {
      await Certification.destroy({
        where: { profileId: profile.id },
        transaction,
      });

      const certificationPromises = certifications.map((cert) =>
        Certification.create(
          {
            userId: id,
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

    if (achievements && Array.isArray(achievements)) {
      await Achievements.destroy({
        where: { profileId: profile.id },
        transaction,
      });

      const achievementPromises = achievements.map((ach) =>
        Achievements.create(
          {
            userId: id,
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
      where: { userId: id },
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
