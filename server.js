import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
// IMPORTANT FIX: Use middleware to parse JSON request bodies
app.use(express.json());

const PORT = 4000;
// CORRECTED: Define the full n8n API base URL using the correct /api/v1 path
const n8nApiUrl = `${process.env.N8N_URL}/api/v1`;

const getAuthHeaders = () => ({
  Authorization:
    "Basic " +
    Buffer.from(
      `${process.env.N8N_USER}:${process.env.N8N_PASS}`
    ).toString("base64"),
  'Content-Type': 'application/json',
});

// Helper function to handle fetch boilerplate and error checking
const proxyN8nRequest = async (path, method, body = null) => {
    const url = `${n8nApiUrl}${path}`;
    const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `n8n API responded with status ${response.status}`);
    }

    // Check if the response body is empty (e.g., n8n returns 204 for start/toggle)
    const contentLength = response.headers.get('content-length');
    if (response.status === 204 || (contentLength && parseInt(contentLength, 10) === 0)) {
        return {};
    }

    return response.json();
}

// 1. Proxy route to get all workflows: GET /api/workflows
app.get("/api/workflows", async (req, res) => {
  try {
    const data = await proxyN8nRequest('/workflows', 'GET');
    res.json(data);
  } catch (err) {
    console.error("Error fetching workflows from n8n:", err.message);
    res.status(500).json({ error: "Failed to connect to n8n, check if n8n is running and .env is correct." });
  }
});

// 2. NEW Proxy route to run a workflow: POST /api/workflows/:id/run
app.post("/api/workflows/:id/run", async (req, res) => {
  const workflowId = req.params.id;
  try {
    // The actual n8n endpoint for running is /start
    const data = await proxyN8nRequest(`/workflows/${workflowId}/start`, 'POST');
    res.json({ success: true, message: "Workflow run triggered.", data });
  } catch (err) {
    console.error(`Error running workflow ${workflowId}:`, err.message);
    res.status(500).json({ error: `Failed to run workflow ${workflowId}: ${err.message}` });
  }
});

// 3. NEW Proxy route to toggle a workflow: POST /api/workflows/:id/toggle
app.post("/api/workflows/:id/toggle", async (req, res) => {
  const workflowId = req.params.id;
  const { active } = req.body; // Expecting { active: true } or { active: false } from the frontend
  const action = active ? "activate" : "deactivate";

  try {
    const data = await proxyN8nRequest(`/workflows/${workflowId}/${action}`, 'POST');
    res.json({ success: true, message: `Workflow ${workflowId} ${action}d.`, data });
  } catch (err) {
    console.error(`Error toggling workflow ${workflowId}:`, err.message);
    res.status(500).json({ error: `Failed to ${action} workflow ${workflowId}: ${err.message}` });
  }
});

// 4. NEW Proxy route to view executions: GET /api/workflows/:id/executions
app.get("/api/workflows/:id/executions", async (req, res) => {
  const workflowId = req.params.id;
  // n8n API filters executions by workflowId
  try {
    const data = await proxyN8nRequest(`/executions?filters[workflowId]=${workflowId}`, 'GET');
    res.json(data);
  } catch (err) {
    console.error(`Error fetching executions for workflow ${workflowId}:`, err.message);
    res.status(500).json({ error: `Failed to fetch executions for workflow ${workflowId}: ${err.message}` });
  }
});


app.listen(PORT, () =>
  console.log(`✅ Proxy running at http://localhost:${PORT}`)
);