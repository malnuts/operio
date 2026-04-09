/**
 * Agent provider initialization.
 *
 * Import this module once at app startup to register the Gemini provider.
 *
 * Connection priority:
 * 1. Direct Gemini API via VITE_GEMINI_API_KEY
 * 2. Proxy Worker via VITE_AGENT_WORKER_URL or the default Worker URL
 */

import { GeminiProvider } from "./gemini-provider";
import { registerProvider } from "./provider";

const WORKER_URL = import.meta.env.VITE_AGENT_WORKER_URL as string | undefined;
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const MODEL_ID = import.meta.env.VITE_GEMINI_MODEL as string | undefined;

registerProvider(new GeminiProvider({
  workerUrl: WORKER_URL || undefined,
  apiKey: API_KEY || undefined,
  modelId: MODEL_ID || undefined,
}));
