import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors()); // allow frontend to call this backend

const PORT = 4000;

// Proxy route to get all workflows
app.get("/api/workflows", async (req, res) => {
  try {
    const response = await fetch(`${process.env.N8N_URL}/workflows`, {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            `${process.env.N8N_USER}:${process.env.N8N_PASS}`
          ).toString("base64"),
      },
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to connect to n8n" });
  }
});

app.listen(PORT, () =>
  console.log(`✅ Proxy running at http://localhost:${PORT}`)
);
