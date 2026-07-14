import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
});

test("should hide the smoothie toggle when the basket is empty", async ({ page }) => {
  await test.step("Given the basket is empty", async () => {
    await page.goto("/basket.html");
  });

  await test.step("Then the smoothie toggle is not visible", async () => {
    await expect(page.locator("#smoothieToggleContainer")).not.toBeVisible();
  });
});

test("should show the smoothie toggle when the basket has items", async ({ page }) => {
  await test.step("Given the shopper adds an Apple to the basket", async () => {
    await page.goto("/product-apple.html");
    await page.getByRole("button", { name: "Add Apple to basket" }).click();
    await page.goto("/basket.html");
  });

  await test.step("Then the smoothie toggle is visible", async () => {
    await expect(page.locator("#smoothieToggleContainer")).toBeVisible();
    await expect(page.locator(".smoothie-label")).toHaveText("Blend into a smoothie");
  });
});

test("should show 'Single flavour smoothie' for one fruit type", async ({ page }) => {
  await test.step("Given the shopper has only Apple in the basket", async () => {
    await page.goto("/product-apple.html");
    await page.getByRole("button", { name: "Add Apple to basket" }).click();
    await page.goto("/basket.html");
  });

  await test.step("When the shopper enables the smoothie toggle", async () => {
    await page.locator(".smoothie-switch").click();
  });

  await test.step("Then the flavour label shows 'Single flavour smoothie'", async () => {
    await expect(page.locator("#smoothieFlavourLabel")).toHaveText("Single flavour smoothie");
  });
});

test("should show 'Multi flavour smoothie' for multiple fruit types", async ({ page }) => {
  await test.step("Given the shopper has Apple and Banana in the basket", async () => {
    await page.goto("/product-apple.html");
    await page.getByRole("button", { name: "Add Apple to basket" }).click();
    await page.goto("/product-banana.html");
    await page.getByRole("button", { name: "Add Banana to basket" }).click();
    await page.goto("/basket.html");
  });

  await test.step("When the shopper enables the smoothie toggle", async () => {
    await page.locator(".smoothie-switch").click();
  });

  await test.step("Then the flavour label shows 'Multi flavour smoothie'", async () => {
    await expect(page.locator("#smoothieFlavourLabel")).toHaveText("Multi flavour smoothie");
  });
});

test("should show the smoothie choice on the checkout page", async ({ page }) => {
  await test.step("Given the shopper has Apple and Banana in the basket with smoothie enabled", async () => {
    await page.goto("/product-apple.html");
    await page.getByRole("button", { name: "Add Apple to basket" }).click();
    await page.goto("/product-banana.html");
    await page.getByRole("button", { name: "Add Banana to basket" }).click();
    await page.goto("/basket.html");
    await page.locator(".smoothie-switch").click();
  });

  await test.step("When the shopper proceeds to checkout", async () => {
    await page.getByRole("link", { name: "Proceed to checkout" }).click();
  });

  await test.step("Then the smoothie choice is shown on checkout", async () => {
    await expect(page.locator("#smoothieSummary")).toBeVisible();
    await expect(page.locator("#smoothieSummary")).toContainText("Multi flavour smoothie");
  });
});
