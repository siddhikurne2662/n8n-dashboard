import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.static("public")); // serves your index.html, script.js, etc.

// -------------------------------------------------------------
// 🔐 Auth Header Helper
// -------------------------------------------------------------
const getAuthHeaders = () => ({
  "X-N8N-API-KEY": process.env.N8N_API_KEY,
  "Content-Type": "application/json",
});

// -------------------------------------------------------------
// 🧱 ROUTES
// -------------------------------------------------------------

// ✅ 1. Fetch all workflows
app.get("/api/workflows", async (req, res) => {
  try {
    const response = await fetch(`${process.env.N8N_URL}/rest/workflows`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`n8n API Error ${response.status}: ${text}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("❌ Error fetching workflows:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ✅ 2. Get workflow by ID (details)
app.get("/api/workflows/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const response = await fetch(`${process.env.N8N_URL}/rest/workflows/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`n8n API Error ${response.status}: ${text}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("❌ Error fetching workflow details:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ✅ 3. Trigger a workflow run manually
app.post("/api/workflows/:id/run", async (req, res) => {
  const { id } = req.params;
  try {
    const response = await fetch(`${process.env.N8N_URL}/rest/workflows/${id}/run`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({}), // even if empty
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.message || "Run failed");
    res.json(data);
  } catch (error) {
    console.error("❌ Failed to trigger run:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ✅ 4. Fetch workflow execution history
app.get("/api/workflows/:id/executions", async (req, res) => {
  const { id } = req.params;
  try {
    const response = await fetch(`${process.env.N8N_URL}/rest/executions?workflowId=${id}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`n8n API Error ${response.status}: ${text}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("❌ Error fetching executions:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ✅ 5. Create new workflow
app.post("/api/workflows", async (req, res) => {
  try {
    const response = await fetch(`${process.env.N8N_URL}/rest/workflows`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(req.body || {}),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`n8n API Error ${response.status}: ${text}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("❌ Error creating workflow:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ✅ 6. Settings (scaffold)
app.get("/api/settings", (req, res) => {
  res.json({
    n8nUrl: process.env.N8N_URL,
    version: "1.0",
    lastSync: new Date().toISOString(),
  });
});

// ✅ 7. Default route
app.get("/", (req, res) => {
  res.sendFile("index.html", { root: "./public" });
});

// -------------------------------------------------------------
// 🚀 START SERVER
// -------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`✅ Proxy running at http://localhost:${PORT}`);
});
