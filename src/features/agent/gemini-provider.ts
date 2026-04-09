/**
 * Gemini provider — calls the Operio API Worker which proxies to Gemini.
 *
 * The API key never touches the client. The Worker holds it as a secret.
 */

import type { AgentProvider, AgentProviderRequest, AgentProviderResponse } from "./provider";
import type { AgentProviderId } from "./types";

const DEFAULT_WORKER_URL = "https://operio-api.sadullaevakhmad707.workers.dev";

export class GeminiProvider implements AgentProvider {
  readonly id: AgentProviderId = "gemini";
  readonly modelId = "gemini-2.5-pro";

  private readonly workerUrl: string;

  constructor(workerUrl?: string) {
    this.workerUrl = workerUrl ?? DEFAULT_WORKER_URL;
  }

  async generate(request: AgentProviderRequest): Promise<AgentProviderResponse> {
    // Chat requests go to /chat, everything else to /generate
    const isChat = request.type === ("chat" as string);
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
