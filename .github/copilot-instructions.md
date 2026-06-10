````markdown
## Demo Webshop — Copilot instructions

Purpose: give an AI coding agent the minimal, actionable context to be productive in this tiny static repo.

Overview
- This is a static HTML/CSS/JS demo app (no build step). Pages are in the repo root and wired together by simple DOM scripts (`shop.js`). The app stores the shopping basket in `localStorage` under the key `basket`.

Key files
- `shop.js` — central client logic. Look for `PRODUCTS` (fruit definitions), `getBasket()`, `addToBasket(product)`, `renderBasket()`, and `renderBasketIndicator()`.
- `index.html` — product listing. Add new product links/emoji here.
- `product-*.html` — individual product pages (each page has an `id="addToBasket"` button that calls `addToBasket("<product>")` in an inline script).
- `basket.html` — shows the basket list and a clear-basket button, and calls `renderBasket()` on load.
- `style.css`, `img/` — static assets.
- `README.md` — high-level description and usage note.

Project patterns and conventions (explicit, discoverable)
- Single global `PRODUCTS` constant in `shop.js` defines available fruit keys (e.g. `apple`, `banana`, `lemon`). Keep product keys lowercase and used as the canonical identifier across HTML and JS.
- Basket storage: `localStorage.getItem('basket')` expects a JSON array of product keys. Use `getBasket()` / `addToBasket()` helpers rather than touching localStorage directly.
- DOM hooks:
  - product pages: button with `id="addToBasket"` and inline script `addToBasket("fruitKey")`.
  - basket list: the unordered list that displays current basket items (rendered by `renderBasket()`).
  - basket indicator in header: `.basket-link` gets a dynamically created `.basket-indicator` showing the count via `renderBasketIndicator()`.
- Global overrides: `shop.js` monkeypatches `window.addToBasket` and `window.clearBasket` to update the indicator. Be careful when refactoring — other pages expect these globals.

How to run / debug locally
- There is no build step — open `index.html` in a browser to use the app.
- For reliable local testing (avoids file:// localStorage oddities), run a simple HTTP server from the repo root. Example (macOS / zsh):

```bash
python3 -m http.server 8000
# then open http://localhost:8000/index.html
```

Where to make common changes
- Add a new fruit (example: `strawberry`):
  1. Update `PRODUCTS` in `shop.js` with the new key and an emoji/name entry.
  2. Add a `product-strawberry.html` page (copy `product-apple.html`), update the emoji, title, description and the inline `addToBasket("strawberry")` call.
  3. Add an entry to the product list in `index.html` (an li with a link + emoji similar to existing ones).
  4. If the fruit requires business rules (see banana/strawberry incompatibility), implement the check inside `addToBasket(product)` in `shop.js` so all pages get the same behavior.

Example: banana / strawberry incompatibility (guidance only)
- Centralize the rule in `shop.js` inside `addToBasket(product)` before persisting the basket. Use `getBasket()` to inspect current contents and reject combinations.
- User-visible error: the project uses minimal UI; an acceptable pattern is `alert("Strawberries and bananas cannot be combined.")` or rendering a short message near the `.button-container`. Keep messages short and consistent.
- Acceptance criteria to enforce in code:
  - If basket already contains `banana`, prevent adding `strawberry`.
  - If basket already contains `strawberry`, prevent adding `banana`.
  - All other fruits remain allowed.

Examples from this repo (selectors and call-sites)
- Product pages: `document.getElementById('addToBasket').onclick = function () { addToBasket("banana"); };`
- Basket view: `renderBasket()` writes into the basket list and toggles `.cart-buttons-row` visibility.
- Basket indicator: `renderBasketIndicator()` creates/updates `.basket-indicator` inside `.basket-link`.

Testing notes
- No unit tests are present. Manual testing steps:
  1. Start local server
  2. Visit `product-banana.html`, add a banana
  3. Visit (or add) `product-strawberry.html` and attempt to add a strawberry — expect the rule to block and show the message.
  4. Try other fruit mixes to confirm no unintended blocks.

Edge cases and gotchas for agents
- Multiple pages recreate the same `id="addToBasket"` button; ensure changes to the inline script on each product page are consistent.
- `window.addToBasket` is overwritten at the bottom of `shop.js`; if you refactor, preserve the indicator update behavior or call `renderBasketIndicator()` yourself.
- Keep product keys stable (lowercase single-word) — HTML links and localStorage rely on them.

If you update this file
- Merge any useful content already present in `.github/copilot-instructions.md` (if it exists). Prefer concise, example-driven edits. Ask maintainers for clarification if the business rule for fruit combinations becomes more complex.

Questions for maintainers
- Preferred UX for error messages (alert vs inline)?
- Any plan to add tests or CI for business rules?

---
If anything in this doc is unclear or you want concrete code edits (for example: implementing the strawberry/banana rule), say so and I will create the changes and tests.

````
