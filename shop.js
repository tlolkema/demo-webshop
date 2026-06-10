const PRODUCTS = {
  apple: { name: "Apple", emoji: "🍏", price: 1.25 },
  banana: { name: "Banana", emoji: "🍌", price: 0.95 },
  lemon: { name: "Lemon", emoji: "🍋", price: 0.75 },
  pineapple: { name: "Pineapple", emoji: "🍍", price: 3.5 },
};

function getBasket() {
  try {
    const basket = localStorage.getItem("basket");
    if (!basket) return [];
    const parsed = JSON.parse(basket);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Error parsing basket from localStorage:", error);
    return [];
  }
}

function addToBasket(product) {
  const basket = getBasket();
  basket.push(product);
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
  // Aggregate quantities per product id
  const counts = {};
  basket.forEach((p) => {
    counts[p] = (counts[p] || 0) + 1;
  });
  let total = 0;
  Object.keys(counts).forEach((productId) => {
    const qty = counts[productId];
    const item = PRODUCTS[productId];
    if (item) {
      const lineTotal = (item.price || 0) * qty;
      total += lineTotal;
      const li = document.createElement("li");
      li.innerHTML = `<span class='basket-emoji'>${item.emoji}</span> <span>${item.name}</span> <span class='basket-qty'>x${qty}</span> <span class='basket-price'>$${lineTotal.toFixed(2)}</span>`;
      basketList.appendChild(li);
    }
  });
  // Append subtotal
  const subtotalLi = document.createElement("li");
  subtotalLi.className = 'basket-subtotal';
  subtotalLi.innerHTML = `<strong>Subtotal:</strong> <span class='basket-total'>$${total.toFixed(2)}</span>`;
  basketList.appendChild(subtotalLi);
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
  if (basket.length > 0) {
    indicator.textContent = basket.length;
    indicator.style.display = "flex";
  } else {
    indicator.style.display = "none";
  }
}

// Call this on page load and after basket changes
if (document.readyState !== "loading") {
  renderBasketIndicator();
} else {
  document.addEventListener("DOMContentLoaded", renderBasketIndicator);
}

// Patch basket functions to update indicator
const origAddToBasket = window.addToBasket;
window.addToBasket = function (product) {
  origAddToBasket(product);
  renderBasketIndicator();
};
const origClearBasket = window.clearBasket;
window.clearBasket = function () {
  origClearBasket();
  renderBasketIndicator();
};
