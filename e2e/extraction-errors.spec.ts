import { expect, test } from "@playwright/test";
import {
  API_KEY,
  CORS_HEADERS,
  fulfillJson,
  fulfillUploadBytes,
  fulfillUploadStart,
  geminiGenerateResponse,
  routeGemini,
  seedStorage,
  uploadReceipt,
} from "./helpers";

test("an API failure surfaces with Retry, which recovers", async ({ page }) => {
  await seedStorage(page, { apiKey: API_KEY });
  let generateCalls = 0;
  await routeGemini(page, async (route, kind) => {
    if (kind === "upload-start") return fulfillUploadStart(route);
    if (kind === "upload-bytes") return fulfillUploadBytes(route);
    if (kind === "generate") {
      generateCalls += 1;
      if (generateCalls === 1) {
        return route.fulfill({
          status: 401,
          headers: CORS_HEADERS,
          json: {
            error: {
              code: 401,
              message: "invalid key",
              status: "UNAUTHENTICATED",
            },
          },
        });
      }
      return fulfillJson(
        route,
        geminiGenerateResponse(
          JSON.stringify([{ name: "Sate Ayam", count: 1, price: 20000 }]),
        ),
      );
    }
    return fulfillJson(route, {});
  });

  await uploadReceipt(page);
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(
    page.getByText(
      "Couldn't read the receipt — check your API key and connection, then retry.",
    ),
  ).toBeVisible();

  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.getByLabel("Item name")).toHaveValue("Sate Ayam");
});

test("an empty read is an actionable error, not an empty bill", async ({
  page,
}) => {
  await seedStorage(page, { apiKey: API_KEY });
  await routeGemini(page, async (route, kind) => {
    if (kind === "upload-start") return fulfillUploadStart(route);
    if (kind === "upload-bytes") return fulfillUploadBytes(route);
    if (kind === "generate") {
      return fulfillJson(route, geminiGenerateResponse("[]"));
    }
    return fulfillJson(route, {});
  });

  await uploadReceipt(page);
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(
    page.getByText(
      "Couldn't find any items on that photo — try a clearer crop, or retry.",
    ),
  ).toBeVisible();
  await expect(
    page.getByText("No items yet. Go back and read a receipt first."),
  ).toHaveCount(0);
});

test("Cancel aborts a slow extraction", async ({ page }) => {
  await seedStorage(page, { apiKey: API_KEY });
  await routeGemini(page, async (route, kind) => {
    if (kind === "upload-start") return fulfillUploadStart(route);
    if (kind === "upload-bytes") return fulfillUploadBytes(route);
    if (kind === "generate") {
      await new Promise((resolve) => setTimeout(resolve, 5_000));
      try {
        await fulfillJson(route, geminiGenerateResponse("[]"));
      } catch {
        // The page was cancelled and closed while we waited; nothing to do.
      }
      return;
    }
    return fulfillJson(route, {});
  });

  await uploadReceipt(page);
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByText("Reading your receipt…")).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByText("Reading your receipt…")).toHaveCount(0);
  await expect(
    page.getByText("No items yet. Go back and read a receipt first."),
  ).toBeVisible();
});
