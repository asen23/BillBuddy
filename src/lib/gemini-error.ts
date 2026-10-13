import { ApiError } from "@google/genai";

/**
 * Why a Gemini call failed, collapsed to the distinctions the UI acts on.
 * This taxonomy lives in one place so extraction and the key dialog's Test
 * action agree on what each HTTP status means.
 */
export type GeminiErrorReason =
  | "invalid-key"
  | "rate-limited"
  | "busy"
  | "timeout"
  | "unreachable"
  | "generic";

/**
 * Classify an error thrown by the Gemini SDK.
 *
 * `aborted` is supplied by the caller because only it knows whether its own
 * AbortController fired — an aborted fetch has no distinguishing shape.
 */
export const classifyGeminiError = (
  error: unknown,
  { aborted = false }: { aborted?: boolean } = {},
): GeminiErrorReason => {
  if (aborted) return "timeout";
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) return "invalid-key";
    if (error.status === 429) return "rate-limited";
    if (error.status === 503) return "busy";
    return "generic";
  }
  // A rejected fetch (offline, CORS, DNS) surfaces as a TypeError, not an ApiError.
  if (error instanceof TypeError) return "unreachable";
  return "generic";
};

/** Message shown on the Bill screen when an extraction fails. */
export const EXTRACTION_ERROR_MESSAGES: Record<GeminiErrorReason, string> = {
  "invalid-key":
    "Gemini rejected your API key — open Settings and check it, then retry.",
  "rate-limited": "You've hit Gemini's rate limit — wait a bit and retry.",
  busy: "Gemini is overloaded right now — wait a moment and retry.",
  timeout:
    "The receipt took too long to read — check your connection, then retry.",
  unreachable: "Couldn't reach Gemini — check your connection, then retry.",
  generic:
    "Couldn't read the receipt — check your API key and connection, then retry.",
};

/** Inline status shown under the key field after a Test. */
export const KEY_TEST_MESSAGES: Record<GeminiErrorReason, string> = {
  "invalid-key": "Invalid key.",
  "rate-limited": "Rate limited — try again shortly.",
  busy: "Gemini is busy — try again in a moment.",
  timeout: "Gemini took too long — try again.",
  unreachable: "Couldn't reach Gemini.",
  generic: "Couldn't test the key — try again.",
};
