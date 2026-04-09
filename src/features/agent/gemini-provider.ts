/**
 * Gemini provider — connects to Gemini either directly with a user-owned
 * AI Studio API key or through the Operio API Worker proxy.
 *
 * Direct mode is useful for personal/local free-tier usage.
 */

import type { AgentProvider, AgentProviderRequest, AgentProviderResponse } from "./provider";
import type { AgentProviderId } from "./types";

const DEFAULT_WORKER_URL = "https://operio-api.sadullaevakhmad707.workers.dev";
const DEFAULT_MODEL_ID = "gemini-2.5-pro";
const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

type GeminiProviderOptions = {
  workerUrl?: string;
  apiKey?: string;
  modelId?: string;
};

type GeminiApiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: {
    message?: string;
    status?: string;
  };
};

const isChatRequest = (request: AgentProviderRequest) =>
  request.type === ("chat" as string);

const buildGeminiChatPayload = (request: AgentProviderRequest) => ({
  systemInstruction: {
    parts: [{ text: request.prompt }],
  },
  contents: ((request.input.messages as Array<{ role: string; content: string }>) ?? []).map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  })),
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
});

const buildGeminiGeneratePayload = (request: AgentProviderRequest) => ({
  systemInstruction: {
    parts: [{
      text: [
        "You are an AI content generation assistant for Operio, a clinical learning platform.",
        "Generate structured educational content. Output valid JSON only.",
        `Task type: ${request.type}`,
      ].join("\n"),
    }],
  },
  contents: [{
    role: "user",
    parts: [{ text: request.prompt }],
  }],
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
});

const readGeminiText = (data: GeminiApiResponse) =>
  data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";

export class GeminiProvider implements AgentProvider {
  readonly id: AgentProviderId = "gemini";
  readonly modelId: string;

  private readonly workerUrl: string;
  private readonly apiKey?: string;

  constructor(options: GeminiProviderOptions = {}) {
    this.workerUrl = options.workerUrl ?? DEFAULT_WORKER_URL;
    this.apiKey = options.apiKey?.trim() || undefined;
    this.modelId = options.modelId ?? DEFAULT_MODEL_ID;
  }

  async generate(request: AgentProviderRequest): Promise<AgentProviderResponse> {
    if (this.apiKey) {
      return this.generateDirect(request);
    }

    return this.generateViaWorker(request);
  }

  private async generateDirect(request: AgentProviderRequest): Promise<AgentProviderResponse> {
    const isChat = isChatRequest(request);
    const payload = isChat
      ? buildGeminiChatPayload(request)
      : buildGeminiGeneratePayload(request);

    const response = await fetch(`${GEMINI_API_BASE_URL}/${this.modelId}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": this.apiKey!,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({})) as GeminiApiResponse;
    if (!response.ok) {
      throw new Error(data.error?.message ?? `Gemini responded with ${response.status}`);
    }

    const text = readGeminiText(data);

    if (isChat) {
      return {
        output: { reply: text },
        modelId: this.modelId,
        providerId: this.id,
      };
    }

    try {
      return {
        output: JSON.parse(text) as Record<string, unknown>,
        modelId: this.modelId,
        providerId: this.id,
      };
    } catch {
      return {
        output: { raw: text },
        modelId: this.modelId,
        providerId: this.id,
      };
    }
  }

  private async generateViaWorker(request: AgentProviderRequest): Promise<AgentProviderResponse> {
    const isChat = isChatRequest(request);
    const endpoint = isChat ? "/chat" : "/generate";

    const body = isChat
      ? {
          messages: (request.input.messages as Array<{ role: string; content: string }>) ?? [],
          systemPrompt: request.prompt,
          context: request.input.context,
        }
      : {
          type: request.type,
          prompt: request.prompt,
          input: request.input,
        };

    const response = await fetch(`${this.workerUrl}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Request failed" })) as { error?: string; details?: string };
      throw new Error(error.details ?? error.error ?? `Worker responded with ${response.status}`);
    }

    const data = (await response.json()) as Record<string, unknown>;

    if (isChat) {
      return {
        output: { reply: data.reply },
        modelId: (data.modelId as string) ?? this.modelId,
        providerId: this.id,
      };
    }

    return {
      output: (data.output as Record<string, unknown>) ?? data,
      modelId: (data.modelId as string) ?? this.modelId,
      providerId: this.id,
    };
  }
}
