/**
 * Agent provider initialization.
 *
 * Import this module once at app startup to register the Gemini provider.
 * Falls back to the stub provider if the Worker URL is not configured.
 */

import { GeminiProvider } from "./gemini-provider";
import { registerProvider } from "./provider";

const WORKER_URL = import.meta.env.VITE_AGENT_WORKER_URL as string | undefined;

if (WORKER_URL) {
  registerProvider(new GeminiProvider(WORKER_URL));
} else {
  // In production, use the default Worker URL
  // In dev without VITE_AGENT_WORKER_URL, the stub provider remains active
  if (import.meta.env.PROD) {
    registerProvider(new GeminiProvider());
  }
}
