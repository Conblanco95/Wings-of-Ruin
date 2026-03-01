import express from "express";
import cors from "cors";
import { config } from "dotenv";

config(); // Load .env

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.ANTHROPIC_API_KEY;

if (!API_KEY) {
  console.error("\n╔════════════════════════════════════════════════════════════╗");
  console.error("║  ERROR: ANTHROPIC_API_KEY not found.                      ║");
  console.error("║                                                            ║");
  console.error("║  Create a .env file in the project root with:              ║");
  console.error("║    ANTHROPIC_API_KEY=sk-ant-...your-key-here...            ║");
  console.error("║                                                            ║");
  console.error("║  Get your key at: https://console.anthropic.com/settings/keys ║");
  console.error("╚════════════════════════════════════════════════════════════╝\n");
  process.exit(1);
}

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Proxy endpoint
app.post("/api/messages", async (req, res) => {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (err) {
    console.error("Proxy error:", err.message);
    res.status(500).json({ error: { message: "Proxy server error: " + err.message } });
  }
});

app.listen(PORT, () => {
  console.log(`\n⚔  Wings of Ruin API proxy running on http://localhost:${PORT}`);
  console.log(`   Frontend should be at http://localhost:5173\n`);
});
