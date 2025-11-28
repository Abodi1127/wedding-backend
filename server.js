const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const OpenAI = require("openai");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/api/search-weddings", async (req, res) => {
  try {
    const { attendees, city, dateFrom, dateTo } = req.body;

    if (!attendees || !city || !dateFrom || !dateTo) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // ... same ChatGPT code as earlier ...
    // res.json({ results: [...] });
  } catch (err) {
    console.error("SEARCH ERROR:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
