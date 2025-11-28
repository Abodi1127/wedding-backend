// server.js

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("Wedding backend is LIVE ✅");
});

// 🔴 MAIN CHAT ENDPOINT – NOTE THE PATH:
/*
   POST /api/search-weddings
   Body: { prompt: string }
*/
app.post("/api/search-weddings", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    console.log("🔔 Incoming chat prompt:", prompt);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
  "Du är en professionell bröllopsplanerare i Sverige. " +
  "Användaren skriver fritt – t.ex. 'Bröllop för 100 personer med budget på 100 000 kr i Ronneby i juni'. " +
  "\n\n" +
  "🎯 Ditt jobb är att: " +
  "- Förstå antal gäster (om det finns) " +
  "- Förstå budget (om det finns) " +
  "- Förstå stad (om det finns) " +
  "- Förstå datum / månad (om det finns)" +
  "- Om något saknas, anta ett rimligt värde (t.ex. stad = 'Okänd stad', budget = 'Ej angivet')." +
  "\n\n" +
  "📦 Du ska ALLTID svara i följande JSON-format (obligatoriskt): " +
  "{ " +
  "  \"assistantMessage\": string, " +
  "  \"results\": [ " +
  "    { " +
  "      \"name\": string, " +
  "      \"city\": string, " +
  "      \"capacity\": string, " +
  "      \"type\": string, " +
  "      \"style\": string, " +
  "      \"description\": string, " +
  "      \"website\": string " +
  "    } " +
  "  ] " +
  "}." +
  "\n\n" +
  "📝 Regler: " +
  "- assistantMessage ska vara kort och på svenska. " +
  "- ALLA fält måste vara ifyllda – inga 'undefined', inga tomma värden. " +
  "- Om något saknas, använd en realistisk placeholder (t.ex. stad: 'Stockholm'). " +
  "- Skapa 2–4 resultat baserat på användarens input. " +
  "- Hitta på rimliga bröllopslokaler, företag eller planerare i Sverige. " +
  "- Om du inte vet verkliga webbadresser: använd https://example.com. " +
  "\n\n" +
  "Returnera ENDAST JSON. Ingen text utanför JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = completion.choices[0].message.content;
    console.log("🟢 Raw model content:", content);

    let data;
    try {
      data = JSON.parse(content);
    } catch (err) {
      console.error("⚠️ Could not parse JSON, falling back to plain text:", err);
      data = {
        assistantMessage: content,
        results: [],
      };
    }

    if (!Array.isArray(data.results)) {
      data.results = [];
    }

    res.json(data);
  } catch (err) {
    console.error("❌ Server / OpenAI error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
