import {
  createPartFromUri,
  createUserContent,
  GoogleGenAI,
  Type,
} from "@google/genai";
import { useBillStore, useExtractionStore } from "./stores";
import type { ItemDraft } from "./types";

/** Current stable Flash model; the old hardcoded gemini-2.5-flash is retired. */
const MODEL = "gemini-3.8-flash";
const TIMEOUT_MS = 45_000;

type ExtractedItem = { name: string; count: number; price: number };

type Run = { controller: AbortController; cancelled: boolean };

let activeRun: Run | null = null;

const responseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      count: { type: Type.NUMBER },
      price: { type: Type.NUMBER },
    },
    propertyOrdering: ["count", "name", "price"],
  },
};

/** Validate whatever the model returned before it is allowed near the store. */
const parseItems = (text: string): ItemDraft[] => {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];

  return data.flatMap((entry): ItemDraft[] => {
    if (typeof entry !== "object" || entry === null) return [];
    const { name, count, price } = entry as ExtractedItem;
    if (
      typeof name !== "string" ||
      typeof count !== "number" ||
      typeof price !== "number" ||
      !Number.isFinite(count) ||
      !Number.isFinite(price)
    ) {
      return [];
    }
    return [
      {
        name: name.trim() || "Item",
        count: Math.max(1, Math.round(count)),
        unitPrice: Math.max(0, Math.round(price)),
      },
    ];
  });
};

const fail = (message: string) => {
  useExtractionStore.setState({ stage: "error", errorMessage: message });
};

const run = async (blob: Blob, apiKey: string) => {
  // A new run supersedes any in-flight one.
  if (activeRun) {
    activeRun.cancelled = true;
    activeRun.controller.abort();
  }
  const runState: Run = { controller: new AbortController(), cancelled: false };
  activeRun = runState;
  const timeout = setTimeout(() => runState.controller.abort(), TIMEOUT_MS);

  const ai = new GoogleGenAI({ apiKey });
  let uploadedName: string | undefined;

  try {
    useExtractionStore.setState({ stage: "uploading", errorMessage: null });
    const imageUpload = await ai.files.upload({
      file: blob,
      config: { abortSignal: runState.controller.signal },
    });
    uploadedName = imageUpload.name;
    useExtractionStore.setState({ stage: "extracting" });

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        createUserContent([
          "Convert attached receipt image into list of order item, dont use any separator for the price",
          createPartFromUri(imageUpload.uri ?? "", imageUpload.mimeType ?? ""),
        ]),
      ],
      config: {
        abortSignal: runState.controller.signal,
        responseMimeType: "application/json",
        responseSchema,
      },
    });

    if (runState.cancelled) return;

    const items = response.text ? parseItems(response.text) : [];
    if (items.length === 0) {
      fail(
        "Couldn't find any items on that photo — try a clearer crop, or retry.",
      );
      return;
    }
    items.forEach((item) => useBillStore.getState().addItem(item));
    useExtractionStore.setState({
      stage: "idle",
      errorMessage: null,
      lastRequest: null,
    });
  } catch (error) {
    if (runState.cancelled) return;
    console.error("Receipt extraction failed:", error);
    fail(
      runState.controller.signal.aborted
        ? "The receipt took too long to read — check your connection, then retry."
        : "Couldn't read the receipt — check your API key and connection, then retry.",
    );
  } finally {
    clearTimeout(timeout);
    if (uploadedName) {
      try {
        await ai.files.delete({ name: uploadedName });
      } catch {
        // Cleanup is best-effort; a leftover upload is not worth failing over.
      }
    }
    if (activeRun === runState) activeRun = null;
  }
};

/** Start extraction for a freshly cropped receipt. */
export const startExtraction = (blob: Blob, apiKey: string) => {
  useExtractionStore.setState({ lastRequest: { blob, apiKey } });
  void run(blob, apiKey);
};

/** Retry the last extraction without re-cropping. */
export const retryExtraction = () => {
  const request = useExtractionStore.getState().lastRequest;
  if (!request) return;
  void run(request.blob, request.apiKey);
};

/** Abort the in-flight extraction, if any. */
export const cancelExtraction = () => {
  if (activeRun) {
    activeRun.cancelled = true;
    activeRun.controller.abort();
    activeRun = null;
  }
  useExtractionStore.setState({ stage: "idle", errorMessage: null });
};
