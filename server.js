import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 4000;
const n8nApiUrl = `${process.env.N8N_URL}/api/v1`; // change to /rest if needed

const getAuthHeaders = () => ({
  "X-N8N-API-KEY": process.env.N8N_API_KEY,
  "Content-Type": "application/json",
});

// Generic proxy helper
const proxyN8nRequest = async (path, method = "GET", body = null) => {
  const url = `${n8nApiUrl}${path}`;
  const res = await fetch(url, {
    method,
    headers: getAuthHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`n8n returned ${res.status}: ${text}`);
  }

  const contentType = res.headers.get("content-type");
  return contentType && contentType.includes("application/json") ? await res.json() : {};
};

// 🟢 Fetch all workflows
app.get("/api/workflows", async (req, res) => {
  try {
    const data = await proxyN8nRequest("/workflows");
    res.json(data);
  } catch (err) {
    console.error("❌ Error fetching workflows:", err.message);
    res.status(500).json({
      error: `n8n returned 401: {"status":"error","message":"Unauthorized"}`,
      hint: "Check API key or base path (/api/v1 vs /rest)",
    });
  }
});

// ▶️ Trigger workflow run
app.post("/api/workflows/:id/run", async (req, res) => {
  const workflowId = req.params.id;
  try {
    await proxyN8nRequest(`/workflows/${workflowId}/run`, "POST");
    res.json({ success: true, message: "Workflow triggered successfully." });
  } catch (err) {
    console.error(`❌ Error running workflow ${workflowId}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🕓 Fetch workflow execution history
app.get("/api/workflows/:id/executions", async (req, res) => {
  const workflowId = req.params.id;
  try {
    const data = await proxyN8nRequest(`/executions?filter[workflowId]=${workflowId}`);
    res.json(data);
  } catch (err) {
    console.error(`❌ Error fetching executions for ${workflowId}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () =>
  console.log(`✅ Proxy running at http://localhost:${PORT}`)
);
