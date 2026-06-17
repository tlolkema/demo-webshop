const PRODUCTS = {
  apple: { name: "Apple", emoji: "🍏" },
  banana: { name: "Banana", emoji: "🍌" },
  lemon: { name: "Lemon", emoji: "🍋" },
};

function normalizeBasket(basket) {
  if (!Array.isArray(basket)) return [];

  return basket.reduce((lineItems, item) => {
    const isLegacyProduct = typeof item === "string";
    const product = isLegacyProduct ? item : item?.product;
    const quantity = isLegacyProduct ? 1 : Number(item?.quantity) || 1;

    if (!PRODUCTS[product]) return lineItems;

    const existingLineItem = lineItems.find(
      (lineItem) => lineItem.product === product,
    );
    if (existingLineItem) {
      existingLineItem.quantity += quantity;
    } else {
      lineItems.push({ product, quantity });
    }

    return lineItems;
  }, []);
}

function getBasket() {
  try {
    const basket = localStorage.getItem("basket");
    if (!basket) return [];
    return normalizeBasket(JSON.parse(basket));
  } catch (error) {
    console.warn("Error parsing basket from localStorage:", error);
    return [];
  }
}

function addToBasket(product) {
  if (!PRODUCTS[product]) return;

  const basket = getBasket();
  const existingLineItem = basket.find(
    (lineItem) => lineItem.product === product,
  );

  if (existingLineItem) {
    existingLineItem.quantity += 1;
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
  basket.forEach((lineItem) => {
    const item = PRODUCTS[lineItem.product];
    if (item) {
      const li = document.createElement("li");
      li.innerHTML = `<span class='basket-emoji'>${item.emoji}</span> <span>${lineItem.quantity}x ${item.name}</span>`;
      basketList.appendChild(li);
    }
  });
  if (cartButtonsRow) cartButtonsRow.style.display = "flex";
}

function getBasketItemCount() {
  return getBasket().reduce((total, lineItem) => total + lineItem.quantity, 0);
}

function renderBasketIndicator() {
  const basketItemCount = getBasketItemCount();
  let indicator = document.querySelector(".basket-indicator");
  if (!indicator) {
    const basketLink = document.querySelector(".basket-link");
    if (!basketLink) return;
    indicator = document.createElement("span");
    indicator.className = "basket-indicator";
    basketLink.appendChild(indicator);
  }
  if (basketItemCount > 0) {
    indicator.textContent = basketItemCount;
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
