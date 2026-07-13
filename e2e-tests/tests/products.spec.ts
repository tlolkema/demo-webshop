import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
});

test("should show the available products", async ({ page }) => {
  await test.step("Given the shopper is on the product page", async () => {
    await page.goto("/");
  });

  await test.step("Then Apple, Banana, and Lemon are available", async () => {
    await expect(page.getByRole("heading", { name: "Products" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Go to Apple" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Go to Banana" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Go to Lemon" })).toBeVisible();
  });
});

test("should open a product detail page", async ({ page }) => {
  await test.step("Given the shopper is viewing the products", async () => {
    await page.goto("/");
  });

  await test.step("When the shopper selects Banana", async () => {
    await page.getByRole("link", { name: "Go to Banana" }).click();
  });

  await test.step("Then the Banana details are shown", async () => {
    await expect(page).toHaveURL(/product-banana\.html$/);
    await expect(page.getByRole("heading", { name: "Banana" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add Banana to basket" })).toBeVisible();
  });
});
