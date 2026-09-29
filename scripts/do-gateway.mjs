import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const PORT = Number(process.env.DO_GATEWAY_PORT ?? 18110);
const OPENHANDS_BASE_URL = (process.env.OPENHANDS_BASE_URL ?? "http://127.0.0.1:18100").replace(/\/$/, "");
const OPENHANDS_SESSION_API_KEY = process.env.OPENHANDS_SESSION_API_KEY ?? "";
const OPENHANDS_LLM_MODEL = process.env.OPENHANDS_LLM_MODEL ?? "";
const OPENHANDS_LLM_API_KEY = process.env.OPENHANDS_LLM_API_KEY ?? "";
const OPENHANDS_LLM_BASE_URL = process.env.OPENHANDS_LLM_BASE_URL ?? "";

function json(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": process.env.DO_GATEWAY_CORS_ORIGIN ?? "*",
    "access-control-allow-headers": "content-type, x-do-gateway-key",
    "access-control-allow-methods": "GET, POST, OPTIONS",
  });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function headers() {
  return {
    "content-type": "application/json",
    ...(OPENHANDS_SESSION_API_KEY
      ? { "X-Session-API-Key": OPENHANDS_SESSION_API_KEY }
      : {}),
  };
}

async function openHands(path, init = {}) {
  return fetch(`${OPENHANDS_BASE_URL}${path}`, {
    ...init,
    headers: { ...headers(), ...(init.headers ?? {}) },
  });
}

async function createRun(task) {
  const conversationId = randomUUID();
  const prompt = [
    "You are executing a DO plan step.",
    `DO goal: ${task.instruction}`,
    `Step: ${task.stepTitle}`,
    `Step details: ${task.stepDescription}`,
    "",
    "Complete this step and report the concrete result.",
  ].join("\n");

  const agentSettings = OPENHANDS_LLM_MODEL
    ? {
        agent_kind: "openhands",
        llm: {
          model: OPENHANDS_LLM_MODEL,
          ...(OPENHANDS_LLM_API_KEY ? { api_key: OPENHANDS_LLM_API_KEY } : {}),
          ...(OPENHANDS_LLM_BASE_URL ? { base_url: OPENHANDS_LLM_BASE_URL } : {}),
        },
      }
    : undefined;

  const response = await openHands("/api/conversations", {
    method: "POST",
    body: JSON.stringify({
      conversation_id: conversationId,
      initial_message: {
        role: "user",
        content: [{ type: "text", text: prompt }],
      },
      workspace: {
        kind: "LocalWorkspace",
        working_dir: `workspace/project/do-${task.goalId}`,
      },
      worktree: false,
      max_iterations: 20,
      stuck_detection: true,
      autotitle: false,
      ...(agentSettings ? { agent_settings: agentSettings } : {}),
    }),
  });

  const text = await response.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { message: text };
  }

  if (!response.ok) {
    throw new Error(body.detail ?? body.message ?? `OpenHands returned ${response.status}`);
  }

  return {
    id: body.id ?? conversationId,
    status: "queued",
    message: "OpenHands conversation created.",
    statusUrl: `/run/${encodeURIComponent(body.id ?? conversationId)}`,
  };
}

async function getRun(id) {
  const response = await openHands(`/api/conversations/${encodeURIComponent(id)}`);
  const text = await response.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { message: text };
  }

  if (!response.ok) {
    throw new Error(body.detail ?? body.message ?? `OpenHands returned ${response.status}`);
  }

  const raw = String(body.execution_status ?? body.status ?? "queued").toLowerCase();
  const status =
    raw === "finished" || raw === "completed"
      ? "completed"
      : raw === "error" || raw === "failed" || raw === "stuck"
        ? "failed"
        : raw === "running"
          ? "running"
          : "queued";

  return {
    id,
    status,
    message: body.title ?? body.execution_status ?? "OpenHands run status.",
  };
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") {
      json(res, 204, {});
      return;
    }

    if (req.method === "GET" && req.url === "/health") {
      json(res, 200, { ok: true, openHandsBaseUrl: OPENHANDS_BASE_URL });
      return;
    }

    if (req.method === "POST" && req.url === "/run") {
      const task = await readJson(req);
      if (!task.goalId || !task.instruction || !task.stepId) {
        json(res, 400, { message: "goalId, instruction and stepId are required" });
        return;
      }
      const result = await createRun(task);
      json(res, 200, result);
      return;
    }

    const statusMatch = req.url?.match(/^\/run\/([^/]+)$/);
    if (req.method === "GET" && statusMatch) {
      json(res, 200, await getRun(decodeURIComponent(statusMatch[1])));
      return;
    }

    json(res, 404, { message: "Not found" });
  } catch (error) {
    json(res, 502, {
      status: "failed",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`DO gateway listening on http://127.0.0.1:${PORT}`);
  console.log(`OpenHands: ${OPENHANDS_BASE_URL}`);
});
