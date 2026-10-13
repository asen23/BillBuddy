import { type Page, type Route } from "@playwright/test";
import { readFileSync } from "node:fs";

export const API_KEY = "test-api-key";

export type SeedMember = { id: number; name: string; color: string };
export type SeedItem = {
  id: number;
  name: string;
  unitPrice: number;
  count: number;
  members: number[];
};

/** Seed the persisted zustand stores before the app boots. */
export const seedStorage = async (
  page: Page,
  seed: {
    apiKey?: string;
    bill?: { members: SeedMember[]; items: SeedItem[] };
  },
) => {
  await page.addInitScript((value) => {
    if (value.apiKey !== undefined) {
      localStorage.setItem(
        "billbuddy.apiKey",
        JSON.stringify({ state: { apiKey: value.apiKey }, version: 0 }),
      );
    }
    if (value.bill !== undefined) {
      const { members, items } = value.bill;
      const nextMemberId = members.reduce(
        (max, m) => Math.max(max, m.id + 1),
        0,
      );
      const nextItemId = items.reduce((max, i) => Math.max(max, i.id + 1), 0);
      localStorage.setItem(
        "billbuddy.bill",
        JSON.stringify({
          state: { members, items, nextMemberId, nextItemId },
          version: 1,
        }),
      );
    }
  }, seed);
};

const GEMINI_GLOB = "**://generativelanguage.googleapis.com/**";
const GEMINI_BASE = "https://generativelanguage.googleapis.com";

export const geminiUploadResponse = {
  name: "files/mock-receipt",
  uri: `${GEMINI_BASE}/v1beta/files/mock-receipt`,
  mimeType: "image/png",
  state: "ACTIVE",
};

/**
 * Cross-origin responses must opt into CORS and header exposure, exactly like
 * the real API does — without these the SDK cannot see x-goog-upload-* headers.
 */
export const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "*",
  "access-control-expose-headers": "*",
};

export const fulfillJson = (route: Route, json: unknown) =>
  route.fulfill({ headers: CORS_HEADERS, json });

/**
 * The v2 SDK uploads in two legs: a "start" request that must answer with an
 * `x-goog-upload-url` header, then the byte upload to that URL, which must
 * answer with the File JSON plus an `x-goog-upload-status` header.
 */
export const fulfillUploadStart = (route: Route) =>
  route.fulfill({
    status: 200,
    headers: {
      ...CORS_HEADERS,
      "x-goog-upload-url": `${GEMINI_BASE}/upload/v1beta/files/mock-session`,
    },
    json: {},
  });

export const fulfillUploadBytes = (route: Route) =>
  route.fulfill({
    status: 200,
    headers: { ...CORS_HEADERS, "x-goog-upload-status": "final" },
    json: { file: geminiUploadResponse },
  });

export const geminiGenerateResponse = (text: string) => ({
  candidates: [
    {
      content: { parts: [{ text }], role: "model" },
      finishReason: "STOP",
      index: 0,
    },
  ],
  modelVersion: "gemini-3.8-flash",
});

export const routeGemini = (
  page: Page,
  handler: (
    route: Route,
    kind: "upload-start" | "upload-bytes" | "generate" | "delete" | "other",
  ) => Promise<void>,
) => {
  if (process.env.DEBUG_GEMINI) {
    page.on("console", (message) =>
      console.log(`[browser:${message.type()}]`, message.text()),
    );
  }
  return page.route(GEMINI_GLOB, async (route) => {
    const url = route.request().url();
    const method = route.request().method();
    const uploadCommand = route.request().headers()["x-goog-upload-command"];
    if (process.env.DEBUG_GEMINI) {
      console.log(`[gemini] ${method} ${url} [${uploadCommand ?? "-"}]`);
    }
    const kind =
      method === "DELETE"
        ? "delete"
        : uploadCommand === "start"
          ? "upload-start"
          : uploadCommand
            ? "upload-bytes"
            : url.includes(":generateContent")
              ? "generate"
              : "other";
    await handler(route, kind);
  });
};

export const mockGeminiSuccess = async (
  page: Page,
  items: { name: string; count: number; price: number }[],
) =>
  routeGemini(page, async (route, kind) => {
    if (kind === "upload-start") return fulfillUploadStart(route);
    if (kind === "upload-bytes") return fulfillUploadBytes(route);
    if (kind === "generate") {
      return fulfillJson(route, geminiGenerateResponse(JSON.stringify(items)));
    }
    return fulfillJson(route, {});
  });

/** Pick the fixture receipt, wait for the crop surface, and start extraction. */
export const uploadReceipt = async (page: Page) => {
  await page.goto("/");
  await page.setInputFiles("#receipt-input", "e2e/fixtures/receipt.png");
  await page.getByRole("button", { name: "Read receipt" }).click();
};

/**
 * Drop an in-memory file onto the upload page's drop zone. The bytes go over
 * as a data URL so nothing has to be fetched from a server.
 */
export const dropFile = async (
  page: Page,
  file: { name: string; type: string; bytes: Buffer },
) => {
  const dataTransfer = await page.evaluateHandle(
    async ({ dataUrl, name, type }) => {
      const blob = await (await fetch(dataUrl)).blob();
      const transfer = new DataTransfer();
      transfer.items.add(new File([blob], name, { type }));
      return transfer;
    },
    {
      dataUrl: `data:${file.type};base64,${file.bytes.toString("base64")}`,
      name: file.name,
      type: file.type,
    },
  );
  const target = 'label[for="receipt-input"]';
  await page.dispatchEvent(target, "dragenter", { dataTransfer });
  await page.dispatchEvent(target, "dragover", { dataTransfer });
  await page.dispatchEvent(target, "drop", { dataTransfer });
};

/** Drop the fixture receipt onto the upload page's drop zone. */
export const dropReceipt = (page: Page) =>
  dropFile(page, {
    name: "receipt.png",
    type: "image/png",
    bytes: readFileSync("e2e/fixtures/receipt.png"),
  });
