import { expect, test } from "@playwright/test";
import { API_KEY, dropFile, dropReceipt, seedStorage } from "./helpers";

test("dropping a photo loads it into the cropper", async ({ page }) => {
  await seedStorage(page, { apiKey: API_KEY });
  await page.goto("/");

  await expect(page.getByRole("button", { name: "Read receipt" })).toHaveCount(
    0,
  );

  await dropReceipt(page);

  await expect(
    page.getByRole("button", { name: "Read receipt" }),
  ).toBeVisible();
  await expect(page.locator("#crop")).toHaveAttribute(
    "src",
    /^data:image\/png/,
  );
});

test("dropping a non-image is ignored", async ({ page }) => {
  await seedStorage(page, { apiKey: API_KEY });
  await page.goto("/");

  await dropFile(page, {
    name: "notes.txt",
    type: "text/plain",
    bytes: Buffer.from("not a receipt"),
  });

  await expect(page.getByRole("button", { name: "Read receipt" })).toHaveCount(
    0,
  );
});
