const PRODUCTS = {
  apple: { name: "Apple", emoji: "🍏" },
  banana: { name: "Banana", emoji: "🍌" },
  lemon: { name: "Lemon", emoji: "🍋" },
};

function getBasket() {
  const basket = localStorage.getItem("basket");
  if (!basket) return [];
  const parsed = JSON.parse(basket);

  // Migrate legacy format: array of product keys (["apple","apple","banana"]) -> [{product,quantity}, ...]
  if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "string") {
    const grouped = parsed.reduce((acc, product) => {
      const idx = acc.findIndex((it) => it.product === product);
      if (idx !== -1) acc[idx].quantity += 1;
      else acc.push({ product, quantity: 1 });
      return acc;
    }, []);
    localStorage.setItem("basket", JSON.stringify(grouped));
    return grouped;
  }

  return parsed;
}

function addToBasket(product) {
  const basket = getBasket();
  const index = basket.findIndex((item) => item.product === product);
  if (index !== -1) {
    basket[index].quantity += 1;
  } else {
    basket.push({ product, quantity: 1 });
  }
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
  if (basket.length === 0) {
    basketList.innerHTML = "<li>No products in basket.</li>";
    if (cartButtonsRow) cartButtonsRow.style.display = "none";
    return;
  }
  basket.forEach(({ product, quantity }) => {
    const item = PRODUCTS[product];
    if (item) {
      const li = document.createElement("li");
      li.innerHTML = `<span class='basket-emoji'>${item.emoji}</span> <span>${quantity}x ${item.name}</span>`;
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
  const totalQuantity = basket.reduce((sum, item) => sum + (item.quantity || 0), 0);
  if (totalQuantity > 0) {
    indicator.textContent = totalQuantity;
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

// Patch global functions so existing callers still work and UI updates after changes
window.addToBasket = function (product) {
  addToBasket(product);
  renderBasketIndicator();
  renderBasket();
};
window.clearBasket = function () {
  clearBasket();
  renderBasketIndicator();
  renderBasket();
};
