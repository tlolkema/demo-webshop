const PRODUCTS = {
  apple: { name: "Apple", emoji: "🍏" },
  banana: { name: "Banana", emoji: "🍌" },
  lemon: { name: "Lemon", emoji: "🍋" },
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
  localStorage.removeItem("smoothiePreference");
}

function getSmoothiePreference() {
  try {
    const pref = localStorage.getItem("smoothiePreference");
    return pref === "true";
  } catch (error) {
    console.warn("Error reading smoothie preference:", error);
    return false;
  }
}

function setSmoothiePreference(enabled) {
  localStorage.setItem("smoothiePreference", enabled ? "true" : "false");
}

function getSmoothieFlavor() {
  const basket = getBasket();
  if (basket.length === 0) return null;

  const uniqueFruits = [...new Set(basket)];

  if (uniqueFruits.length === 1) {
    const fruit = uniqueFruits[0];
    const fruitName = PRODUCTS[fruit]?.name || fruit;
    return `${fruitName} Smoothie 🥤`;
  } else {
    const fruitNames = uniqueFruits
      .map((f) => PRODUCTS[f]?.name || f)
      .join(" & ");
    return `${fruitNames} Smoothie 🥤`;
  }
}

function renderSmoothieSection() {
  const smoothieSection = document.getElementById("smoothieSection");
  const smoothieCheckbox = document.getElementById("smoothieCheckbox");
  const smoothieFlavor = document.getElementById("smoothieFlavor");

  if (!smoothieSection || !smoothieCheckbox || !smoothieFlavor) return;

  const basket = getBasket();
  if (basket.length === 0) {
    smoothieSection.classList.remove("visible");
    return;
  }

  smoothieSection.classList.add("visible");
  const flavor = getSmoothieFlavor();
  if (flavor) {
    smoothieFlavor.textContent = " - " + flavor;
  }
  smoothieCheckbox.checked = getSmoothiePreference();
}

function renderOrderSummary() {
  const summaryList = document.getElementById("summaryList");
  const smoothieSummary = document.getElementById("smoothieSummary");

  if (!summaryList || !smoothieSummary) return;

  const basket = getBasket();
  summaryList.innerHTML = "";

  if (basket.length === 0) {
    summaryList.innerHTML = "<li>No products in basket.</li>";
    smoothieSummary.innerHTML = "";
    return;
  }

  basket.forEach((product) => {
    const item = PRODUCTS[product];
    if (item) {
      const li = document.createElement("li");
      li.innerHTML = `<span class='basket-emoji'>${item.emoji}</span> <span>${item.name}</span>`;
      summaryList.appendChild(li);
    }
  });

  const smoothieEnabled = getSmoothiePreference();
  if (smoothieEnabled) {
    const flavor = getSmoothieFlavor();
    smoothieSummary.innerHTML = `<div class="smoothie-order-item">🥤 <strong>${flavor}</strong></div>`;
  } else {
    smoothieSummary.innerHTML = "";
  }
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
    renderSmoothieSection();
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
  renderSmoothieSection();
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
  renderSmoothieSection();
};
const origClearBasket = window.clearBasket;
window.clearBasket = function () {
  origClearBasket();
  renderBasketIndicator();
  renderSmoothieSection();
};
