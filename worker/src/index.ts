/**
 * Operio API Worker — proxies chat and generation requests to Gemini.
 *
 * Secrets (set via `wrangler secret put`):
 *   GEMINI_API_KEY — Google AI Studio API key
 *
 * Environment variables (set in wrangler.toml):
 *   ALLOWED_ORIGIN — CORS origin for the frontend
 */

interface Env {
  GEMINI_API_KEY: string;
  ALLOWED_ORIGIN: string;
}

interface ChatRequest {
  messages: Array<{ role: string; content: string }>;
  systemPrompt: string;
  context?: Record<string, unknown>;
}

interface GenerateRequest {
  type: string;
  prompt: string;
  input: Record<string, unknown>;
}

type RequestBody = ChatRequest | GenerateRequest;

const GEMINI_MODEL = "gemini-2.5-pro-preview-06-05";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const corsHeaders = (origin: string, allowed: string): HeadersInit => {
  const isAllowed = origin === allowed || allowed === "*" || origin.endsWith(".operio.pages.dev");
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
};

const isChat = (body: RequestBody): body is ChatRequest =>
  "messages" in body && "systemPrompt" in body;

const buildGeminiChatPayload = (body: ChatRequest) => {
  const contents = body.messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  return {
    system_instruction: { parts: [{ text: body.systemPrompt }] },
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
    safetySettings: [
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
    ],
  };
};

const buildGeminiGeneratePayload = (body: GenerateRequest) => {
  const systemInstruction = [
    "You are an AI content generation assistant for Operio, a clinical learning platform.",
    "Generate structured educational content. Output valid JSON only.",
    `Task type: ${body.type}`,
  ].join("\n");

  return {
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: "user", parts: [{ text: body.prompt }] }],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
    },
    safetySettings: [
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
    ],
  };
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin") ?? "";
    const cors = corsHeaders(origin, env.ALLOWED_ORIGIN);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    // Only POST /chat and /generate
    const url = new URL(request.url);

    if (request.method !== "POST" || (url.pathname !== "/chat" && url.pathname !== "/generate")) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (!env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured" }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    try {
      const body = (await request.json()) as RequestBody;

      const geminiPayload = isChat(body)
        ? buildGeminiChatPayload(body)
        : buildGeminiGeneratePayload(body as GenerateRequest);

      const geminiResponse = await fetch(`${GEMINI_URL}?key=${env.GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiPayload),
      });

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        return new Response(JSON.stringify({ error: "Gemini API error", details: errorText }), {
          status: geminiResponse.status,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      const geminiData = (await geminiResponse.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };

      const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

      // For chat: return the reply text
      // For generate: return the parsed JSON output
      let result: Record<string, unknown>;
      if (isChat(body)) {
        result = { reply: text, modelId: GEMINI_MODEL, providerId: "gemini" };
      } else {
        try {
          const parsed = JSON.parse(text) as Record<string, unknown>;
          result = { output: parsed, modelId: GEMINI_MODEL, providerId: "gemini" };
        } catch {
          result = { output: { raw: text }, modelId: GEMINI_MODEL, providerId: "gemini" };
        }
      }

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
  },
} satisfies ExportedHandler<Env>;
