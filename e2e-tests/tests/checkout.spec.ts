import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
});

test("should complete checkout", async ({ page }) => {
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
