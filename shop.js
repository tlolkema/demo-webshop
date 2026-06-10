const PRODUCTS = {
  apple: { name: "Apple", emoji: "🍏" },
  banana: { name: "Banana", emoji: "🍌" },
  lemon: { name: "Lemon", emoji: "🍋" },
};

function getBasket() {
  try {
    const basket = localStorage.getItem("basket");
    if (!basket) return {};
    const parsed = JSON.parse(basket);
    // Backwards-compat: if an array was stored, convert to a map of counts
    if (Array.isArray(parsed)) {
      const map = {};
      parsed.forEach((p) => {
        map[p] = (map[p] || 0) + 1;
      });
      return map;
    }
    // If it's an object mapping product -> quantity, return as-is
    if (parsed && typeof parsed === "object") return parsed;
    return {};
  } catch (error) {
    console.warn("Error parsing basket from localStorage:", error);
    return {};
  }
}

function addToBasket(product) {
  const basket = getBasket();
  basket[product] = (basket[product] || 0) + 1;
  localStorage.setItem("basket", JSON.stringify(basket));
}

function clearBasket() {
  localStorage.removeItem("basket");
}

function renderBasket() {
  const basket = getBasket();
  const basketList = document.getElementById("basketList");
  const cartButtonsRow = document.querySelector(".cart-buttons-row");
  if (!basketList) return;
  basketList.innerHTML = "";
  const keys = Object.keys(basket || {});
  if (keys.length === 0) {
    basketList.innerHTML = "<li>No products in basket.</li>";
    if (cartButtonsRow) cartButtonsRow.style.display = "none";
    return;
  }
  // Render grouped items as "<qty>x <ProductName>"
  keys.forEach((product) => {
    const qty = basket[product];
    const item = PRODUCTS[product];
    if (item && qty > 0) {
      const li = document.createElement("li");
      li.innerHTML = `<span class='basket-emoji'>${item.emoji}</span> <span>${qty}x ${item.name}</span>`;
      basketList.appendChild(li);
    }
  });
  if (cartButtonsRow) cartButtonsRow.style.display = "flex";
}

function renderBasketIndicator() {
  const basket = getBasket();
  let indicator = document.querySelector(".basket-indicator");
  if (!indicator) {
    const basketLink = document.querySelector(".basket-link");
    if (!basketLink) return;
    indicator = document.createElement("span");
    indicator.className = "basket-indicator";
    basketLink.appendChild(indicator);
  }
  // Sum quantities for indicator
  const total = Object.values(basket || {}).reduce((s, v) => s + (Number(v) || 0), 0);
  if (total > 0) {
    indicator.textContent = total;
    indicator.style.display = "flex";
  } else {
    indicator.style.display = "none";
  }
}

// Call this on page load and after basket changes
if (document.readyState !== "loading") {
  renderBasketIndicator();
  renderBasket();
} else {
  document.addEventListener("DOMContentLoaded", () => {
    renderBasketIndicator();
    renderBasket();
  });
}

// Patch basket functions to update indicator
const origAddToBasket = window.addToBasket;
window.addToBasket = function (product) {
  origAddToBasket(product);
  renderBasketIndicator();
  renderBasket();
};
const origClearBasket = window.clearBasket;
window.clearBasket = function () {
  origClearBasket();
  renderBasketIndicator();
  renderBasket();
};
