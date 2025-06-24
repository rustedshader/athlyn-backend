import { S3Client } from "@aws-sdk/client-s3";
import multer from "multer";
import multerS3 from "multer-s3";
import dotenv from "dotenv";

dotenv.config();

const s3 = new S3Client({
  endpoint: process.env.DO_ENDPOINT,
  region: process.env.DO_REGION,
  credentials: {
    accessKeyId: process.env.DO_ACCESS_KEY_ID,
    secretAccessKey: process.env.DO_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: "athlyn-backend",
    acl: "public-read",
    key: function (_request, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const extension = file.originalname.split(".").pop();
      cb(null, `${uniqueSuffix}.${extension}`);
    },
  }),
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only PDFs and images (JPEG, PNG, GIF) are allowed"));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
}).single("upload");

export { upload };
