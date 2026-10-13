import { expect, test } from "@playwright/test";
import { seedStorage } from "./helpers";

test("first run shows a non-dismissable key gate", async ({ page }) => {
  await page.goto("/");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Gemini API key")).toBeVisible();

  await expect(page.getByRole("button", { name: "Close" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Cancel" })).toHaveCount(0);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
});

test("saving a key unlocks the app and persists", async ({ page }) => {
  await page.goto("/");
  const dialog = page.getByRole("dialog");

  const save = dialog.getByRole("button", { name: "Save key" });
  await expect(save).toBeDisabled();
  await dialog.getByLabel("API key").fill("test-api-key");
  await save.click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText("Split a receipt")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("settings reopens the gate, dismissably", async ({ page }) => {
  await seedStorage(page, { apiKey: "test-api-key" });
  await page.goto("/");
  await page.getByRole("button", { name: "Settings" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});
