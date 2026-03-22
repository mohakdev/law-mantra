const { extractText } = require("../services/ocr");
const { classifyScam, generateActions, chatForComplaintDetails, legalChat } = require("../services/ai");
const { getLegalInfo } = require("../services/legalMap");
const { generateComplaintPDF } = require("../services/pdf");
const { cleanText } = require("../utils/cleanText");

const getRiskLevel = (confidence) => {
  if (confidence > 80) return "HIGH";
  if (confidence > 50) return "MEDIUM";
  return "LOW";
};

const analyzeImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded. Please provide an image file." });
    }

    // Step 1: OCR
    const rawText = await extractText(req.file.buffer);
    if (!rawText || rawText.trim().length < 5) {
      return res.status(422).json({
        error: "Could not extract readable text from the image. Please try a clearer image.",
      });
    }

    const text = cleanText(rawText);

    // Step 2: AI Classification
    const classification = await classifyScam(text);
    const { type, confidence, reason } = classification;

    // Step 3: Static Legal Mapping
    const law = getLegalInfo(type);

    // Step 4: AI Action Steps
    const actions = await generateActions(type);

    // Step 5: Risk Level
    const riskLevel = getRiskLevel(confidence);

    return res.json({
      scamType: type,
      confidence,
      riskLevel,
      law,
      actions,
      explanation: reason,
      extractedText: text,
    });
  } catch (err) {
    console.error("analyzeImage error:", err.message);
    return res.status(500).json({
      error: "Could not analyze image. Please try again.",
    });
  }
};

const generatePDF = async (req, res) => {
  try {
    const {
      scamType, description, fullName, phone, email,
      aadhaarLast4, aadhaarFull, pan, address, dateOfIncident, imageBase64,
    } = req.body;

    if (!scamType || !fullName) {
      return res.status(400).json({ error: "Missing required fields: scamType and fullName." });
    }

    const pdfBuffer = await generateComplaintPDF({
      scamType, description, fullName, phone, email,
      aadhaarLast4, aadhaarFull, pan, address, dateOfIncident, imageBase64,
    });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="cybercrime_complaint_${Date.now()}.pdf"`,
      "Content-Length": pdfBuffer.length,
    });

    return res.send(pdfBuffer);
  } catch (err) {
    console.error("generatePDF error:", err.message);
    return res.status(500).json({ error: "Could not generate PDF. Please try again." });
  }
};

const handleChat = async (req, res) => {
  try {
    const { conversationHistory, scamContext, collectedFields } = req.body;

    if (!conversationHistory || !Array.isArray(conversationHistory)) {
      return res.status(400).json({ error: "conversationHistory array is required." });
    }

    const result = await chatForComplaintDetails(
      conversationHistory,
      scamContext || "Unknown scam",
      collectedFields || {}
    );

    return res.json(result);
  } catch (err) {
    console.error("handleChat error:", err.message);
    return res.status(500).json({
      error: "Chat failed. Please try again.",
      message: "Sorry, I had trouble processing that. Could you please repeat?",
      extractedFields: {},
      allCollected: false,
    });
  }
};


const handleLegalChat = async (req, res) => {
  try {
    const { conversationHistory } = req.body;
    if (!conversationHistory || !Array.isArray(conversationHistory)) {
      return res.status(400).json({ error: "conversationHistory array is required." });
    }
    const message = await legalChat(conversationHistory);
    return res.json({ message });
  } catch (err) {
    console.error("handleLegalChat error:", err.message);
    return res.status(500).json({ error: "Chat failed. Please try again." });
  }
};

module.exports = { analyzeImage, generatePDF, handleChat, handleLegalChat };
