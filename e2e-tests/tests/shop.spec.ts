import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
});

test("shows the available products", async ({ page }) => {
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

test("opens a product detail page", async ({ page }) => {
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

test("adds a product to the basket", async ({ page }) => {
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

test("removes a product from the basket", async ({ page }) => {
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

test("completes checkout", async ({ page }) => {
  await test.step("Given the shopper has Apple in the basket and opens checkout", async () => {
    await page.goto("/product-apple.html");
    await page.getByRole("button", { name: "Add Apple to basket" }).click();
    await page.goto("/basket.html");
    await page.getByRole("link", { name: "Proceed to checkout" }).click();
  });

  await test.step("When the shopper submits their delivery details", async () => {
    await page.getByRole("textbox", { name: "Enter your full name" }).fill("Alex Shopper");
    await page.getByRole("textbox", { name: "Enter your delivery address" }).fill("1 Fruit Lane");
    await page.getByRole("button", { name: "Place order" }).click();
  });

  await test.step("Then the order is confirmed", async () => {
    await expect(page.getByRole("alert")).toHaveText("Thank you for your order!");
    await expect(page.getByRole("form", { name: "Checkout form" })).toBeHidden();
  });
});
