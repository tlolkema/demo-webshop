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
}

function renderBasket() {
  const basket = getBasket();
  const basketList = document.getElementById("basketList");
  const cartButtonsRow = document.querySelector(".cart-buttons-row");
  const smoothieOption = document.getElementById("smoothieOption");
  const smoothiePreview = document.getElementById("smoothiePreview");
  const blendCheckbox = document.getElementById("blendSmoothieCheckbox");
  if (!basketList) return;
  basketList.innerHTML = "";
  if (basket.length === 0) {
    basketList.innerHTML = "<li>No products in basket.</li>";
    if (cartButtonsRow) cartButtonsRow.style.display = "none";
    if (smoothieOption) smoothieOption.style.display = "none";
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

  // Show smoothie option when we have items
  if (smoothieOption) smoothieOption.style.display = "block";

  // Initialize checkbox from localStorage
  if (blendCheckbox) {
    const stored = localStorage.getItem("blendSmoothie");
    blendCheckbox.checked = stored === "true";
    blendCheckbox.onchange = function () {
      localStorage.setItem("blendSmoothie", this.checked ? "true" : "false");
      renderSmoothiePreview();
    };
  }

  function computeSmoothie(basketItems) {
    if (!basketItems || basketItems.length === 0) return null;
    // Count fruit types
    const types = basketItems.map((p) => p && p.toLowerCase()).filter(Boolean);
    if (types.length === 0) return null;
    const unique = Array.from(new Set(types));
    if (unique.length === 1) {
      return { type: "single", flavour: PRODUCTS[unique[0]] ? PRODUCTS[unique[0]].name : unique[0], contents: types };
    }
    // Multi-flavour blended
    const flavourNames = unique.map((u) => (PRODUCTS[u] ? PRODUCTS[u].name : u));
    return { type: "mixed", flavour: flavourNames.join(' + '), contents: types };
  }

  function renderSmoothiePreview() {
    if (!smoothiePreview) return;
    const shouldBlend = blendCheckbox ? blendCheckbox.checked : false;
    const smoothie = computeSmoothie(basket);
    if (!shouldBlend || !smoothie) {
      smoothiePreview.style.display = "none";
      smoothiePreview.innerHTML = "";
      return;
    }
    smoothiePreview.style.display = "block";
    smoothiePreview.innerHTML = `<div class='smoothie-box'><strong>Smoothie:</strong> <div>Type: ${smoothie.type === 'single' ? 'Single flavour' : 'Blended / multi-flavour'}</div><div>Flavour: ${smoothie.flavour}</div><div>Contents: ${smoothie.contents.join(', ')}</div></div>`;
  }

  // Render initial preview
  renderSmoothiePreview();
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
