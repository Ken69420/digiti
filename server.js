const express = require("express");
const multer = require("multer");
const axios = require("axios");
const fs = require("fs");
require("dotenv").config();

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(express.json());
app.use(express.static("public"));

const formatPrompt = (text) => `
You are an AI that extracts key details from receipts text.

Here is a receipt:
"""
${text}
"""

Return only the result in pure JSON using this format. Do not guess values — only extract what you see.

If you see:
- "20 ITEM NAME @3.50" → quantity: 20, price: RM3.50
- "x2 ITEM NAME - RM3.50" → quantity: 2, price: RM3.50
If values aren't clear, return "Unknown".

If you see:
- e.g. 20 May 25 → date: "20/05/2025".

and get the time after the receipt is closed e.g. CLOSED 28 Feb 25 16:24:28-Thank you & please come again → time: "16:24:28".

Example format:
{
  "store": "Store name or 'Unknown'",
  "store_location": "Location or 'Unknown'",
  "receipt_id": "Receipt ID or 'Unknown'",
  "date": "DD/MM/YYYY or 'Unknown'",
  "time": "HH:MM:SS or 'Unknown'",
  "subtotal": "RM0.00 or 'Unknown'",
  "service_charge": "RM0.00 or 'Unknown'",
  "service_tax": "RM0.00 or 'Unknown'",
  "grand_total": "RM0.00 or 'Unknown'",
  "payment_method": "e.g. Visa, MyDebit, Cash or 'Unknown'",
  "items": [
    {
      "name": "Item name",
      "quantity": 1,
      "price": "RM0.00"
    }
  ]
}

Do not include any markdown or explanations — only valid JSON output.
`;

async function extractTextWithVisionAPI(imagePath) {
  const image = fs.readFileSync(imagePath, { encoding: "base64" });

  const body = {
    requests: [
      {
        image: { content: image },
        features: [{ type: "TEXT_DETECTION" }],
      },
    ],
  };

  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;

  const response = await axios.post(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    body,
    { headers: { "Content-Type": "application/json" } }
  );

  const text = response.data.responses[0].fullTextAnnotation?.text || "";
  return text;
}

function cleanAIJsonResponse(raw) {
  return raw.replace(/```json|```/g, "").trim();
}

async function formatWithAI(receiptText) {
  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: "mistralai/mistral-small-3.1-24b-instruct:free",
      messages: [
        {
          role: "system",
          content:
            "You are an AI that extracts key details from receipts text.",
        },
        { role: "user", content: formatPrompt(receiptText) },
      ],
      stream: false,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      timeout: 10000,
    }
  );
  return response.data.choices[0].message.content.trim();
}

app.post("/upload", upload.single("receipt"), async (req, res) => {
  const imagePath = req.file.path;

  try {
    const text = await extractTextWithVisionAPI(imagePath);
    const aiResponse = await formatWithAI(text);
    let formatted;
    try {
      formatted = JSON.parse(aiResponse);
    } catch (err) {
      // fallback: try to clean markdown
      const cleaned = aiResponse.replace(/```json|```/g, "").trim();
      try {
        formatted = JSON.parse(cleaned);
      } catch (finalErr) {
        console.error("Final JSON parse failed:", finalErr);
        formatted = {
          error: "AI response could not be parsed",
          raw: aiResponse,
        };
      }
    }

    fs.unlink(imagePath, (err) => {
      if (err) console.error("Failed to delete file:", err);
    });

    res.json({ raw: text, formatted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process receipt." });
  }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
