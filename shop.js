const PRODUCTS = {
  apple: { name: "Apple", emoji: "🍏", allergies: [] },
  banana: { name: "Banana", emoji: "🍌", allergies: [] },
  lemon: { name: "Lemon", emoji: "🍋", allergies: ["citrus"] },
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
  basket.forEach((product) => {
    const item = PRODUCTS[product];
    if (item) {
      const li = document.createElement("li");
      li.innerHTML = `<span class='basket-emoji'>${item.emoji}</span> <span>${item.name}</span>`;
      basketList.appendChild(li);
    }
  });
  if (cartButtonsRow) cartButtonsRow.style.display = "flex";
  
  // Check for allergies
  const allergies = new Set();
  basket.forEach(product => {
    const item = PRODUCTS[product];
    if (item && item.allergies) {
      item.allergies.forEach(allergy => allergies.add(allergy));
    }
  });
  if (allergies.size > 0) {
    const allergyList = document.createElement("li");
    allergyList.innerHTML = `<strong>Allergy Warning:</strong> This basket contains items that may cause allergies: ${Array.from(allergies).join(", ")}`;
    allergyList.style.background = "#ffebee";
    allergyList.style.border = "1px solid #ffcdd2";
    allergyList.style.color = "#c62828";
    allergyList.style.padding = "0.5rem";
    allergyList.style.borderRadius = "5px";
    basketList.appendChild(allergyList);
  }
}

function renderAllergies(productKey) {
  const product = PRODUCTS[productKey];
  const allergyDiv = document.getElementById("allergyWarnings");
  if (!allergyDiv || !product.allergies || product.allergies.length === 0) return;
  
  allergyDiv.innerHTML = "<h2>Allergy Warnings</h2><ul>" +
    product.allergies.map(allergy => `<li>${allergy}</li>`).join("") +
    "</ul>";
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
