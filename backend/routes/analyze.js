const express = require("express");
const multer = require("multer");
const router = express.Router();
const { analyzeImage, generatePDF, handleChat } = require("../controllers/analyzeController");

// Store uploads in memory (no disk writes needed)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed."));
    }
    cb(null, true);
  },
});

router.post("/analyze", upload.single("image"), analyzeImage);
router.post("/generate-pdf", generatePDF);
router.post("/chat", handleChat);

module.exports = router;
