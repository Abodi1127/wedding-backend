// server.js

// ------- imports & setup -------
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
app.use(cors());
app.use(express.json());

// ------- health check -------
app.get("/", (req, res) => {
  res.send("Wedding backend is LIVE ✅");
});

// ------- CHAT ENDPOINT -------
app.post("/api/chat-wedding", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message (text) krävs" });
    }

    const systemPrompt = `
Du är en svensk bröllopsassistent. Du hjälper användaren att hitta
bröllopslokaler och bröllopsplanerare baserat på fri text.

Du får alltid bara EN sträng med beskrivning, t.ex:
"Bröllop för 100 personer med budget på 100 000 kr i Ronneby i juni".

1. Försök förstå:
   - stad / plats
   - ungefärligt antal gäster
   - ungefärlig budget
   - datum eller period om det finns
2. Skapa 3–5 rimliga men FIKTIVA förslag på lokaler/plannerare
   i eller nära den staden.

VIKTIGT: Svara ENBART med giltig JSON på svenska i formatet:

{
  "intro": "Kort mening som förklarar vad du hittade.",
  "results": [
    {
      "name": "Namn på lokal eller bröllopsplanerare",
      "city": "Stad eller område",
      "capacity": "t.ex. 120 personer",
      "type": "t.ex. Konferenslokal · Modern",
      "description": "Kort beskrivning av varför den passar.",
      "website": "https://exempel.se"
    }
  ]
}

Inga kommentarer eller text utanför JSON-objektet.
`;

    const prompt = `Användarens beskrivning:\n"${message}"\n\nGenerera JSON enligt instruktionen.`;

    // 🔹 Viktigt: ingen response_format här (den orsakade felet)
    const aiResponse = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      max_output_tokens: 800,
    });

    const text =
      aiResponse.output[0].content[0].text || aiResponse.output[0].content[0];

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.error("JSON.parse error, råtext:", text);
      return res.status(500).json({
        error: "Kunde inte tolka AI-svaret som JSON.",
        raw: text,
      });
    }

    if (!parsed || !Array.isArray(parsed.results)) {
      return res.status(500).json({
        error: "Ogiltigt format från AI.",
        raw: parsed,
      });
    }

    return res.json({
      intro: parsed.intro || "Här är några förslag:",
      results: parsed.results,
    });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Internt serverfel i backend." });
  }
});

// ------- start server -------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
