import { expect, test } from "@playwright/test";
import { CORS_HEADERS, fulfillJson, routeGemini } from "./helpers";

const geminiError = (code: number, status: string, message: string) => ({
  error: { code, message, status },
});

test("Test verifies a working key without saving it", async ({ page }) => {
  await routeGemini(page, async (route, kind) => {
    if (kind === "other") return fulfillJson(route, { models: [] });
    return fulfillJson(route, {});
  });

  await page.goto("/");
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("API key").fill("good-key");
  await dialog.getByRole("button", { name: "Test" }).click();

  await expect(dialog.getByText("Key works.")).toBeVisible();
  // Testing never saves or dismisses the gate.
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Save key" })).toBeVisible();
});

test("Test reports an invalid key", async ({ page }) => {
  await routeGemini(page, async (route, kind) => {
    if (kind === "other")
      return route.fulfill({
        status: 401,
        headers: CORS_HEADERS,
        json: geminiError(401, "UNAUTHENTICATED", "invalid key"),
      });
    return fulfillJson(route, {});
  });

  await page.goto("/");
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("API key").fill("bad-key");
  await dialog.getByRole("button", { name: "Test" }).click();

  await expect(dialog.getByText("Invalid key.")).toBeVisible();
});

test("Test reports a busy model (503) distinctly", async ({ page }) => {
  await routeGemini(page, async (route, kind) => {
    if (kind === "other")
      return route.fulfill({
        status: 503,
        headers: CORS_HEADERS,
        json: geminiError(503, "UNAVAILABLE", "model overloaded"),
      });
    return fulfillJson(route, {});
  });

  await page.goto("/");
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("API key").fill("good-key");
  await dialog.getByRole("button", { name: "Test" }).click();

  await expect(
    dialog.getByText("Gemini is busy — try again in a moment."),
  ).toBeVisible();
});
