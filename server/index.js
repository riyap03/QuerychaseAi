const express = require("express");
const cors = require("cors");
const multer = require("multer");
const dotenv = require("dotenv");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const mammoth = require("mammoth");
const { simpleParser } = require("mailparser");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Test Route
app.get("/test", (req, res) => {
  res.send("Backend is running with Gemini!");
});

// Multer Setup
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 50 * 1024 * 1024 },
});

// File Upload Endpoint
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded." });

    const filePath = path.resolve(req.file.path);
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    let extractedText = "";

    if (fileExt === ".pdf") {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      extractedText = pdfData.text || "No text found in PDF.";
    } else if (fileExt === ".docx") {
      const result = await mammoth.extractRawText({ path: filePath });
      extractedText = result.value || "No text found in Word document.";
    } else if (fileExt === ".eml") {
      const mailContent = fs.readFileSync(filePath);
      const parsed = await simpleParser(mailContent);
      extractedText = parsed.text || parsed.html || "No email content found.";
    } else {
      return res.status(400).json({ error: "Unsupported file format." });
    }

    res.json({ text: extractedText });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to process file." });
  } finally {
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting uploaded file:", err);
      });
    }
  }
});

// AI Query Endpoint
app.post("/api/ai/query", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required." });

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const answer = result.response.text() || "No response.";

    res.json({ answer });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Gemini API request failed." });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
