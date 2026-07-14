import { expect, test } from "@playwright/test";

const AVATAR = "Chat with Pearcy, the shopping assistant";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
});

test("Pearcy avatar is present on every storefront page", async ({ page }) => {
  const pages = [
    "/",
    "/product-apple.html",
    "/product-banana.html",
    "/product-lemon.html",
    "/basket.html",
    "/checkout.html",
  ];

  for (const path of pages) {
    await test.step(`Given the shopper opens ${path}`, async () => {
      await page.goto(path);
    });
    await test.step("Then Pearcy is waiting in the corner", async () => {
      await expect(page.getByRole("button", { name: AVATAR })).toBeVisible();
    });
  }
});

test("clicking Pearcy opens and closes the chat panel", async ({ page }) => {
  await test.step("Given the shopper is on the homepage", async () => {
    await page.goto("/");
  });

  await test.step("When the shopper clicks Pearcy", async () => {
    await page.getByRole("button", { name: AVATAR }).click();
  });

  await test.step("Then the chat panel opens", async () => {
    await expect(page.getByRole("dialog", { name: "Chat with Pearcy" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Type your message to Pearcy" })).toBeFocused();
  });

  await test.step("When the shopper closes the chat", async () => {
    await page.getByRole("button", { name: "Close chat" }).click();
  });

  await test.step("Then the chat panel is hidden", async () => {
    await expect(page.getByRole("dialog", { name: "Chat with Pearcy" })).toBeHidden();
  });
});

test("Escape closes the chat panel", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: AVATAR }).click();
  await expect(page.getByRole("dialog", { name: "Chat with Pearcy" })).toBeVisible();

  await page.keyboard.press("Escape");

  await expect(page.getByRole("dialog", { name: "Chat with Pearcy" })).toBeHidden();
});

test("Pearcy answers a product question with a recommendation", async ({ page }) => {
  await test.step("Given the chat is open", async () => {
    await page.goto("/");
    await page.getByRole("button", { name: AVATAR }).click();
  });

  await test.step("When the shopper asks for a recommendation", async () => {
    await page.getByRole("textbox", { name: "Type your message to Pearcy" }).fill("What do you recommend?");
    await page.getByRole("button", { name: "Send message" }).click();
  });

  await test.step("Then a typing indicator shows while Pearcy thinks", async () => {
    await expect(page.getByLabel("Pearcy is typing")).toBeVisible();
  });

  await test.step("Then Pearcy replies with picks from the catalog", async () => {
    const log = page.getByRole("log", { name: "Conversation with Pearcy" });
    await expect(log).toContainText("pear-sonal picks", { timeout: 5000 });
    await expect(log.getByRole("link", { name: /Apple/ })).toBeVisible();
  });
});

test("Pearcy remembers the conversation across page navigation", async ({ page }) => {
  await test.step("Given the shopper chatted with Pearcy", async () => {
    await page.goto("/");
    await page.getByRole("button", { name: AVATAR }).click();
    await page.getByRole("textbox", { name: "Type your message to Pearcy" }).fill("Tell me about the lemon");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(
      page.getByRole("log", { name: "Conversation with Pearcy" })
    ).toContainText("Lemon", { timeout: 5000 });
  });

  await test.step("When the shopper navigates to another page and reopens the chat", async () => {
    await page.goto("/basket.html");
    await page.getByRole("button", { name: AVATAR }).click();
  });

  await test.step("Then the earlier messages are still there", async () => {
    const log = page.getByRole("log", { name: "Conversation with Pearcy" });
    await expect(log).toContainText("Tell me about the lemon");
    await expect(log).toContainText("Lemon");
  });
});

test("Pearcy shows a graceful fallback when the backend is unavailable", async ({ page }) => {
  await test.step("Given the AI backend is unavailable", async () => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("pearcy:offline", "1"));
    await page.getByRole("button", { name: AVATAR }).click();
  });

  await test.step("When the shopper sends a message", async () => {
    await page.getByRole("textbox", { name: "Type your message to Pearcy" }).fill("Hello?");
    await page.getByRole("button", { name: "Send message" }).click();
  });

  await test.step("Then a friendly fallback message is shown", async () => {
    await expect(
      page.getByRole("log", { name: "Conversation with Pearcy" })
    ).toContainText("offline", { timeout: 5000 });
  });
});

test("proactive tip can be dismissed and opted out of", async ({ page }) => {
  await test.step("Given proactive tips appear quickly", async () => {
    await page.addInitScript(() => {
      (window as unknown as { PEARCY_TIP_DELAY_MS: number }).PEARCY_TIP_DELAY_MS = 200;
    });
    await page.goto("/");
  });

  await test.step("Then a proactive tip appears", async () => {
    await expect(page.getByRole("status")).toBeVisible();
  });

  await test.step("When the shopper chooses 'Don't show again' and reloads", async () => {
    await page.getByRole("button", { name: "Don't show again" }).click();
    await expect(page.getByRole("status")).toBeHidden();
    await page.reload();
  });

  await test.step("Then no tip appears again", async () => {
    // Wait past the (short) tip delay to be sure it stays hidden.
    await page.waitForTimeout(500);
    await expect(page.getByRole("status")).toBeHidden();
  });
});

test("the avatar can be dismissed and restored", async ({ page }) => {
  await test.step("Given the shopper is on the homepage", async () => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: AVATAR })).toBeVisible();
  });

  await test.step("When the shopper hides Pearcy", async () => {
    await page.getByRole("button", { name: "Hide Pearcy" }).click({ force: true });
  });

  await test.step("Then the avatar is gone and a restore control appears", async () => {
    await expect(page.getByRole("button", { name: AVATAR })).toBeHidden();
    await expect(
      page.getByRole("button", { name: "Show Pearcy the shopping assistant" })
    ).toBeVisible();
  });

  await test.step("When the shopper restores Pearcy", async () => {
    await page.getByRole("button", { name: "Show Pearcy the shopping assistant" }).click();
  });

  await test.step("Then the avatar is back", async () => {
    await expect(page.getByRole("button", { name: AVATAR })).toBeVisible();
  });
});
