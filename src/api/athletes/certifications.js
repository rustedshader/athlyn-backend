const { Router } = require("express");
const { upload } = require("../../s3/s3-handler");
const { z } = require("zod");
const { Certification, Profile } = require("../../database/models");
const { Sequelize } = require("sequelize");
const multer = require("multer");
const { FileSchema } = require("../../schemas/athletes-schema");

const db = {
  async saveFile(fileData, sequelize) {
    console.log("Log: Saving to DB:", fileData);

    const transaction = await sequelize.transaction();
    try {
      const profile = await Profile.findOne({
        where: { userId: fileData.userId },
        transaction,
      });
      if (!profile) {
        throw new Error("Profile not found for the given user ID");
      }

      const certification = await Certification.create(
        {
          userId: fileData.userId,
          profileId: profile.id,
          fileUrl: fileData.url,
          title: fileData.title,
          issuedBy: fileData.issuedBy,
        },
        { transaction }
      );

      await transaction.commit();
      return { id: certification.id, ...fileData };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
  async getCertificates(userId, sequelize) {
    try {
      const certifications = await Certification.findAll({
        where: { userId },
        attributes: [
          "id",
          "userId",
          "profileId",
          "fileUrl",
          "title",
          "issuedBy",
          "createdAt",
          "updatedAt",
        ],
      });
      return certifications;
    } catch (error) {
      throw error;
    }
  },
};

const router = Router();

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: err.message,
      error: err.code,
    });
  }
  next(err);
};

router.post("/:userId", upload, handleMulterError, async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const fileData = {
      userId: userId,
      title: req.body.title,
      issuedBy: req.body.issuedBy,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: req.file.location,
    };

    const validatedData = FileSchema.parse(fileData);

    const savedFile = await db.saveFile(validatedData, Certification.sequelize);

    res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      file: {
        id: savedFile.id,
        originalName: savedFile.originalName,
        mimeType: savedFile.mimeType,
        size: savedFile.size,
        url: savedFile.url,
        title: savedFile.title,
        issuedBy: savedFile.issuedBy,
      },
    });
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.errors,
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || "Upload failed",
      error: error.message,
    });
  }
});

router.get("/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const certificates = await db.getCertificates(
      userId,
      Certification.sequelize
    );

    if (!certificates || certificates.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No certificates found for this user",
      });
    }

    res.status(200).json({
      success: true,
      message: "Certificates retrieved successfully",
      certificates: certificates.map((cert) => ({
        id: cert.id,
        userId: cert.userId,
        profileId: cert.profileId,
        fileUrl: cert.fileUrl,
        title: cert.title,
        issuedBy: cert.issuedBy,
        createdAt: cert.createdAt,
        updatedAt: cert.updatedAt,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve certificates",
      error: error.message,
    });
  }
});

module.exports = router;
