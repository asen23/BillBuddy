import { expect, test } from "@playwright/test";
import {
  API_KEY,
  seedStorage,
  type SeedItem,
  type SeedMember,
} from "./helpers";

const ana: SeedMember = { id: 0, name: "Ana", color: "#e2734a" };
const budi: SeedMember = { id: 1, name: "Budi", color: "#4f8f6a" };
const cinta: SeedMember = { id: 2, name: "Cinta", color: "#4a7dbf" };

const seedResult = async (
  page: Parameters<typeof seedStorage>[0],
  members: SeedMember[],
  items: SeedItem[],
) => {
  await seedStorage(page, { apiKey: API_KEY, bill: { members, items } });
  await page.goto("/result");
};

test("count multiplies the line total before splitting", async ({ page }) => {
  // 2 × Rp 15.000 = Rp 30.000, split two ways → Rp 15.000 each.
  await seedResult(
    page,
    [ana, budi],
    [
      {
        id: 0,
        name: "Nasi Goreng",
        unitPrice: 15000,
        count: 2,
        members: [0, 1],
      },
    ],
  );

  await expect(page.getByText("2×")).toHaveCount(2);
  await expect(page.getByText("Rp 15.000", { exact: true })).toHaveCount(4); // 2 shares + 2 totals
  await expect(page.getByText("Rp 30.000", { exact: true })).toHaveCount(1); // grand total
});

test("remainders are handed out a rupiah at a time, in member order", async ({
  page,
}) => {
  // Rp 30.001 split two ways → Rp 15.001 (first member) and Rp 15.000.
  await seedResult(
    page,
    [ana, budi],
    [
      {
        id: 0,
        name: "Ikan Bakar",
        unitPrice: 30001,
        count: 1,
        members: [0, 1],
      },
    ],
  );

  await expect(page.getByText("Rp 15.001", { exact: true })).toHaveCount(2); // share + total for Ana
  await expect(page.getByText("Rp 15.000", { exact: true })).toHaveCount(2); // share + total for Budi
  await expect(page.getByText("Rp 30.001", { exact: true })).toHaveCount(1); // grand total
});

test("three-way splits divide evenly when they can", async ({ page }) => {
  await seedResult(
    page,
    [ana, budi, cinta],
    [{ id: 0, name: "Sate", unitPrice: 30000, count: 1, members: [0, 1, 2] }],
  );

  await expect(page.getByText("Rp 10.000", { exact: true })).toHaveCount(6); // 3 shares + 3 totals
  await expect(page.getByText("Rp 30.000", { exact: true })).toHaveCount(1);
});

test("unassigned and stale-assigned items stay visible", async ({ page }) => {
  await seedResult(
    page,
    [ana],
    [
      { id: 0, name: "Roti", unitPrice: 12000, count: 1, members: [] },
      { id: 1, name: "Kopi", unitPrice: 5000, count: 2, members: [99] }, // 99 = deleted member
    ],
  );

  await expect(page.getByText("Unassigned items")).toBeVisible();
  await expect(page.getByText("Roti")).toBeVisible();
  await expect(page.getByText("Kopi")).toBeVisible();
  await expect(page.getByText("Rp 12.000", { exact: true })).toHaveCount(1); // Roti line total
  await expect(page.getByText("Rp 10.000", { exact: true })).toHaveCount(1); // Kopi line total
  await expect(page.getByText("Rp 22.000", { exact: true })).toHaveCount(1); // grand total still includes both
  await expect(page.getByText("Rp 0", { exact: true })).toHaveCount(1); // Ana owes nothing
});
