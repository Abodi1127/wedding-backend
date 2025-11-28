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

// 🔧 Hjälpfunktion: kalla Google Places Text Search
async function searchPlaces({ city, guests }) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_MAPS_API_KEY is missing");
  }

  const baseUrl = "https://maps.googleapis.com/maps/api/place/textsearch/json";
  // Exempel-sökning: "wedding venue for 100 people in Karlskrona Sweden"
  const query = `wedding venue for ${guests || "100"} people in ${city ||
    "Sweden"} wedding`;

  const url = new URL(baseUrl);
  url.searchParams.set("query", query);
  url.searchParams.set("region", "se");
  url.searchParams.set("language", "sv");
  url.searchParams.set("key", apiKey);

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    console.error("Google Places error:", data);
    throw new Error(`Google Places status: ${data.status}`);
  }

  return data.results || [];
}

// 🔴 Huvud-endpoint som Framer kallar
app.post("/api/search-weddings", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    console.log("🔔 Incoming chat prompt:", prompt);

    // 1) Steg 1 – använd OpenAI för att tolka stad + antal gäster
    const extraction = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Du får ett fritt formulerat meddelande om ett bröllop på svenska. " +
            "Din uppgift är att plocka ut STAD och ANTAL GÄSTER. " +
            "Svara ENBART med JSON på formatet: " +
            "{ \"city\": string | null, \"guests\": number | null }. " +
            "Om något saknas, sätt värdet till null.",
        },
        { role: "user", content: prompt },
      ],
    });

    let extracted = { city: null, guests: null };
    try {
      extracted = JSON.parse(extraction.choices[0].message.content);
    } catch (err) {
      console.error("Failed to parse extraction JSON:", err);
    }

    const city = extracted.city || "Sverige";
    const guests = extracted.guests || 100;

    console.log("📌 Parsed from prompt:", { city, guests });

    // 2) Steg 2 – hämta riktiga platser från Google Places
    const places = await searchPlaces({ city, guests });

    // Begränsa till t.ex. 4 resultat
    const topPlaces = places.slice(0, 4);

    // 3) Mappa till det format som Framer-komponenten förväntar sig
    const results = topPlaces.map((place) => {
      const name = place.name;
      const rating = place.rating;
      const reviews = place.user_ratings_total;
      const address = place.formatted_address;

      // Länk till Google Maps med place_id
      const mapsUrl = place.place_id
        ? `https://www.google.com/maps/place/?q=place_id:${place.place_id}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            name + " " + city
          )}`;

      return {
        name,
        city,
        capacity: `${guests}+ personer (uppskattning)`,
        type: "Verklig plats från Google Maps",
        style: "",
        description:
          address +
          (rating
            ? ` – Betyg ${rating} (${reviews || 0} omdömen på Google).`
            : ""),
        website: mapsUrl,
      };
    });

    // 4) Skapa ett kort assistent-svar
    const assistantMessage =
      results.length > 0
        ? `Här är några verkliga lokaler nära ${city} som passar ungefär ${guests} gäster.`
        : `Jag hittade tyvärr inga tydliga lokaler nära ${city}, men testa gärna en annan stad eller formulering.`;

    res.json({
      assistantMessage,
      results,
    });
  } catch (err) {
    console.error("❌ Server / OpenAI/Google error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
