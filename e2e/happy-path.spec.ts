import { expect, test } from "@playwright/test";
import {
  API_KEY,
  mockGeminiSuccess,
  seedStorage,
  uploadReceipt,
} from "./helpers";

test("split a receipt end to end", async ({ page }) => {
  await seedStorage(page, { apiKey: API_KEY });
  await mockGeminiSuccess(page, [
    { name: "Nasi Goreng", count: 2, price: 15000 },
    { name: "Es Teh", count: 1, price: 8000 },
  ]);

  await uploadReceipt(page);
  await expect(page).toHaveURL(/\/members$/);

  // Members
  await page.getByRole("button", { name: "Add member" }).click();
  await page.getByRole("button", { name: "Add member" }).click();
  await page.getByPlaceholder("Member 1").fill("Ana");
  await page.getByPlaceholder("Member 2").fill("Budi");
  // Budi's row is the second member card.
  await page.getByRole("button", { name: "Use color #4f8f6a" }).nth(1).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/bill$/);

  // Items extracted (mocked) and editable
  const names = page.getByLabel("Item name");
  await expect(names).toHaveCount(2);
  await expect(names.nth(0)).toHaveValue("Nasi Goreng");
  await expect(names.nth(1)).toHaveValue("Es Teh");
  await expect(page.getByLabel("Count").nth(0)).toHaveValue("2");
  await expect(page.getByText("2 unassigned items")).toBeVisible();

  await names.nth(1).fill("Es Teh Manis");

  // Assign: Nasi → Ana + Budi, Es Teh Manis → Ana
  await page.getByRole("button", { name: "Assign Ana" }).first().click();
  await page.getByRole("button", { name: "Assign Budi" }).first().click();
  await expect(page.getByText("1 unassigned item")).toBeVisible();
  await page.getByRole("button", { name: "Assign Ana" }).first().click();
  await expect(page.getByText(/unassigned item/)).toHaveCount(0);

  // Result: Ana 15.000 + 8.000 = 23.000, Budi 15.000, total 38.000
  await page.getByRole("button", { name: "Finish" }).click();
  await expect(page).toHaveURL(/\/result$/);
  await expect(page.getByText("Rp 23.000", { exact: true })).toHaveCount(1);
  await expect(page.getByText("Rp 15.000", { exact: true })).toHaveCount(3);
  await expect(page.getByText("Rp 38.000", { exact: true })).toHaveCount(1);
  await expect(page.getByText("Unassigned items")).toHaveCount(0);
  await expect(page.getByText("Es Teh Manis")).toBeVisible();

  // New bill clears everything
  await page.getByRole("button", { name: "New bill", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/members");
  await expect(
    page.getByText("No members yet — add the first one below."),
  ).toBeVisible();
});
