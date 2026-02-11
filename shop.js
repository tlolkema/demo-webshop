const PRODUCTS = {
  maine_coon: { name: "Maine Coon", emoji: "🐈‍⬛" },
  nordic_forest_cat: { name: "Nordic Forest Cat", emoji: "🐱" },
  british_shorthair: { name: "British Shorthair", emoji: "😺" },
  bengal: { name: "Bengal", emoji: "🐈" },
  skewers: { name: "Wooden Skewers (5-pack)", emoji: "🔱", isPromo: true },
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

function syncSkewers() {
  const basket = getBasket();
  // Count non-skewer items (cat breeds only)
  const fruitCount = basket.filter((item) => item !== "skewers").length;
  // Calculate required skewer packs: 1 pack per 3 fruits
  const requiredSkewers = Math.floor(fruitCount / 3);
  // Count current skewers in basket
  const currentSkewers = basket.filter((item) => item === "skewers").length;
  
  // Adjust skewers to match required amount
  if (requiredSkewers > currentSkewers) {
    // Add skewers
    for (let i = 0; i < requiredSkewers - currentSkewers; i++) {
      basket.push("skewers");
    }
  } else if (requiredSkewers < currentSkewers) {
    // Remove excess skewers
    const itemsToRemove = currentSkewers - requiredSkewers;
    for (let i = 0; i < itemsToRemove; i++) {
      const idx = basket.lastIndexOf("skewers");
      if (idx !== -1) {
        basket.splice(idx, 1);
      }
    }
  }
  
  localStorage.setItem("basket", JSON.stringify(basket));
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
  basket.forEach((product) => {
    const item = PRODUCTS[product];
    if (item) {
      const li = document.createElement("li");
      li.innerHTML = `<span class='basket-emoji'>${item.emoji}</span> <span>${item.name}</span>`;
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
  if (basket.length > 0) {
    indicator.textContent = basket.length;
    indicator.style.display = "flex";
  } else {
    indicator.style.display = "none";
  }
}

// Call this on page load and after basket changes
if (document.readyState !== "loading") {
  syncSkewers();
  renderBasketIndicator();
} else {
  document.addEventListener("DOMContentLoaded", () => {
    syncSkewers();
    renderBasketIndicator();
  });
}

// Patch basket functions to update indicator and sync skewers
const origAddToBasket = window.addToBasket;
window.addToBasket = function (product) {
  origAddToBasket(product);
  syncSkewers();
  renderBasketIndicator();
};
const origClearBasket = window.clearBasket;
window.clearBasket = function () {
  origClearBasket();
  renderBasketIndicator();
};
