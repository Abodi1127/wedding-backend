// server.js (debug version)

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// middlewares
app.use(cors());
app.use(express.json());

// health-check route
app.get("/", (req, res) => {
  res.send("Wedding backend is LIVE ✅");
});

// MAIN ROUTE that Framer calls
app.post("/api/search-weddings", async (req, res) => {
  try {
    console.log("🔔 Incoming request body:", req.body);

    const { attendees, city, dateFrom, dateTo } = req.body;

    // Just return some FAKE data for now so we see something in Framer
    const fakeResults = [
      {
        name: "Grand City Wedding Hall",
        city: city || "Unknown city",
        capacity: attendees || "N/A",
        type: "Venue",
        style: "Modern",
        description: `Example result for ${attendees} guests in ${city} between ${dateFrom} and ${dateTo}.`,
        website: "https://example-wedding-venue.com",
      },
      {
        name: "Romantic Garden Planner",
        city: city || "Unknown city",
        capacity: attendees || "N/A",
        type: "Wedding planner",
        style: "Romantic outdoor",
        description:
          "Professional wedding planner specializing in outdoor ceremonies and full-service coordination.",
        website: "https://example-wedding-planner.com",
      },
    ];

    res.json({ results: fakeResults });
  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
