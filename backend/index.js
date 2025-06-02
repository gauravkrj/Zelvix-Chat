const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const xlsx = require("xlsx");
const serverless = require("serverless-http");
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// NOTE: Skip app.listen()

// Create "uploads" folder if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
app.use("/uploads", express.static(uploadsDir));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const faqPath = path.join(__dirname, "faq.json");
const faq = JSON.parse(fs.readFileSync(faqPath, "utf-8"));


function getPrompt(userQuestion) {
  const context = faq.map(f => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n");
  return `${context}\n\nUser: ${userQuestion}\nAI:`;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

app.post("/chat", async (req, res) => {
  const { message } = req.body;
  const prompt = getPrompt(message);

  try {
    const result = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      { contents: [{ parts: [{ text: prompt }] }] }
    );
    const reply = result.data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini.";
    res.json({ reply });
  } catch (err) {
    console.error("Gemini API error:", err.response?.data || err.message);
    res.status(500).json({ reply: "Error talking to Gemini API." });
  }
});

app.post("/upload", upload.single("file"), async (req, res) => {
  const file = req.file;
  const ext = path.extname(file.originalname).toLowerCase();
  let preview = "";

  try {
    if (ext === ".pdf") {
      const buffer = fs.readFileSync(file.path);
      const data = await pdfParse(buffer);
      preview = data.text.slice(0, 1000);
    } else if (ext === ".docx") {
      const data = await mammoth.extractRawText({ path: file.path });
      preview = data.value.slice(0, 1000);
    } else if (ext === ".xlsx") {
      const workbook = xlsx.readFile(file.path);
      const sheet = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
      preview = JSON.stringify(sheet.slice(0, 3), null, 2);
    } else if ([".jpg", ".jpeg", ".png"].includes(ext)) {
      preview = "🖼️ Image file uploaded.";
    } else {
      preview = "Unsupported file type.";
    }

    const fileUrl = `/uploads/${file.filename}`; // No hardcoded localhost
    res.json({ preview, fileUrl });
  } catch (error) {
    console.error("File processing error:", error);
    res.status(500).json({ preview: "Error processing file." });
  }
});

// ✅ Export for serverless
module.exports = app;
module.exports.handler = serverless(app);
