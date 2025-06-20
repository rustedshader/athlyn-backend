const { Router } = require("express");
const {
  Profile,
  User,
  Certification,
  Achievements,
  sequelize,
} = require("../../database/models");

//TODO: Refactor Tommorow

const router = Router();

router.get(":id", async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;

    const profile = await Profile.findOne({
      where: { userId: id },
      include: [
        {
          model: User,
          attributes: [
            "id",
            "username",
            "firstName",
            "lastName",
            "email",
            "mobileNumber",
            "createdAt",
            "updatedAt",
          ],
        },
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
      transaction,
    });

    if (!profile) {
      await transaction.rollback();
      return res.status(404).json({
        error: "Athlete profile not found",
      });
    }

    await transaction.commit();

    return res.status(200).json({
      id: profile.userId,
      username: profile.User.username,
      firstName: profile.User.firstName,
      lastName: profile.User.lastName,
      email: profile.User.email,
      mobileNumber: profile.User.mobileNumber,
      profile: {
        id: profile.id,
        sports: profile.sports,
        bio: profile.bio,
        age: profile.age,
        location: profile.location,
        stats: profile.stats,
        certifications: profile.Certifications,
        achievements: profile.Achievements,
      },
      createdAt: profile.User.createdAt,
      updatedAt: profile.User.updatedAt,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error retrieving athlete profile:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

router.put(":id", async (req, res) => {
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
          model: User,
          attributes: [
            "id",
            "username",
            "firstName",
            "lastName",
            "email",
            "mobileNumber",
            "createdAt",
            "updatedAt",
          ],
        },
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
      transaction: await sequelize.transaction(),
    });

    return res.status(200).json({
      id: updatedProfile.userId,
      username: updatedProfile.User.username,
      firstName: updatedProfile.User.firstName,
      lastName: updatedProfile.User.lastName,
      email: updatedProfile.User.email,
      mobileNumber: updatedProfile.User.mobileNumber,
      profile: {
        id: updatedProfile.id,
        sports: updatedProfile.sports,
        bio: updatedProfile.bio,
        age: updatedProfile.age,
        location: updatedProfile.location,
        stats: updatedProfile.stats,
        certifications: updatedProfile.Certifications,
        achievements: updatedProfile.Achievements,
      },
      createdAt: updatedProfile.User.createdAt,
      updatedAt: updatedProfile.User.updatedAt,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating athlete profile:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

module.exports = router;
