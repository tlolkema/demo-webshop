import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
});

test("should add a product to the basket", async ({ page }) => {
  await test.step("Given the shopper is viewing Apple", async () => {
    await page.goto("/product-apple.html");
  });

  await test.step("When the shopper adds Apple to the basket", async () => {
    await page.getByRole("button", { name: "Add Apple to basket" }).click();
    await page.getByRole("link", { name: "View shopping basket" }).click();
  });

  await test.step("Then Apple is in the basket", async () => {
    await expect(page.getByRole("list", { name: "Shopping basket items" })).toContainText("Apple");
    await expect(page.getByRole("button", { name: "Clear all items from basket" })).toBeVisible();
  });
});

test("should combine identical products into a single line item", async ({ page }) => {
  await test.step("Given the shopper adds Apple twice and Banana once", async () => {
    await page.goto("/product-apple.html");
    await page.getByRole("button", { name: "Add Apple to basket" }).click();
    await page.getByRole("button", { name: "Add Apple to basket" }).click();
    await page.goto("/product-banana.html");
    await page.getByRole("button", { name: "Add Banana to basket" }).click();
  });

  await test.step("When the shopper views the basket", async () => {
    await page.goto("/basket.html");
  });

  await test.step("Then identical products are grouped with a quantity", async () => {
    const items = page.getByRole("list", { name: "Shopping basket items" }).getByRole("listitem");
    await expect(items).toHaveCount(2);
    await expect(items.nth(0)).toContainText("2x Apple");
    await expect(items.nth(1)).toContainText("1x Banana");
  });
});

test("should remove a product from the basket", async ({ page }) => {
  await test.step("Given Apple is in the shopper's basket", async () => {
    await page.goto("/product-apple.html");
    await page.getByRole("button", { name: "Add Apple to basket" }).click();
    await page.goto("/basket.html");
    await expect(page.getByRole("list", { name: "Shopping basket items" })).toContainText("Apple");
  });

  await test.step("When the shopper clears the basket", async () => {
    await page.getByRole("button", { name: "Clear all items from basket" }).click();
  });

  await test.step("Then the basket is empty", async () => {
    await expect(page.getByRole("list", { name: "Shopping basket items" })).toHaveText("No products in basket.");
    await expect(page.getByRole("button", { name: "Clear all items from basket" })).toBeHidden();
  });
});
