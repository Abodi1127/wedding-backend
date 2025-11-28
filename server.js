// server.js

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("Wedding backend is LIVE ✅");
});

// Chat endpoint
app.post("/api/chat-wedding", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Body must contain a 'message' string field.",
      });
    }

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "Du är en bröllopsplanerare. Svara ENDAST som JSON med formatet: { \"suggestions\": [ { \"name\": \"...\", \"city\": \"...\", \"capacity\": 100, \"type\": \"...\", \"description\": \"...\", \"website\": \"...\" } ] }. Hitta realistiska platser baserat på användarens stad.",
        },
        { role: "user", content: message },
      ],
      response_format: { type: "json_object" },
    });

    const text = response.output[0].content[0].text;

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("JSON-fel:", text);
      return res.status(500).json({ error: "Invalid JSON from OpenAI" });
    }

    res.json(data);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
