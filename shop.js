const PRODUCTS = {
  apple: { name: "Apple", emoji: "🍏" },
  banana: { name: "Banana", emoji: "🍌" },
  lemon: { name: "Lemon", emoji: "🍋" },
  // Skewers are not sold separately; they are added/removed automatically.
  skewers: { name: "Wooden Skewers (5-pack)", emoji: "🥢" },
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
  // Prevent manual adding of the skewer pack.
  if (product === "skewers") return;

  const basket = getBasket();
  basket.push(product);

  // Persist then ensure skewer packs are in sync with fruit count.
  localStorage.setItem("basket", JSON.stringify(basket));
  syncSkewers();
}

function clearBasket() {
  localStorage.removeItem("basket");
}

// Count only fruit items in the basket (apple, banana, lemon)
function countFruitItems(basket) {
  return basket.filter((p) => p === "apple" || p === "banana" || p === "lemon").length;
}

// Compute how many skewer packs are needed: 1 pack per 3 pieces of fruit,
// rounding down.
function neededSkewerPacks(fruitCount) {
  return Math.floor(fruitCount / 3);
}

// Synchronize skewer packs in the basket with the number of fruit items.
function syncSkewers() {
  const basket = getBasket();

  const fruitCount = countFruitItems(basket);
  const needed = neededSkewerPacks(fruitCount);

  // Count existing skewer packs in basket
  const existingSkewers = basket.filter((p) => p === "skewers").length;

  if (existingSkewers < needed) {
    // Add missing skewer packs
    for (let i = 0; i < needed - existingSkewers; i++) {
      basket.push("skewers");
    }
    localStorage.setItem("basket", JSON.stringify(basket));
    return;
  }

  if (existingSkewers > needed) {
    // Remove extra skewer packs
    let toRemove = existingSkewers - needed;
    // Remove from end to avoid disturbing order of fruits
    for (let i = basket.length - 1; i >= 0 && toRemove > 0; i--) {
      if (basket[i] === "skewers") {
        basket.splice(i, 1);
        toRemove--;
      }
    }
    localStorage.setItem("basket", JSON.stringify(basket));
  }
}

function renderBasket() {
  // Ensure skewer packs match the current fruit count before rendering.
  syncSkewers();
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
  document.addEventListener("DOMContentLoaded", function () {
    syncSkewers();
    renderBasketIndicator();
  });
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
  // After clearing, ensure skewers are synchronized (no skewers remain)
  syncSkewers();
  renderBasket();
  renderBasketIndicator();
};
