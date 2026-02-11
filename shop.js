const PRODUCTS = {
  maine_coon: { name: "Maine Coon", emoji: "🐈‍⬛" },
  nordic_forest_cat: { name: "Nordic Forest Cat", emoji: "🐱" },
  british_shorthair: { name: "British Shorthair", emoji: "😺" },
  bengal: { name: "Bengal", emoji: "🐈" },
  apple: { name: "Apple", emoji: "🍎", isFruit: true },
  banana: { name: "Banana", emoji: "🍌", isFruit: true },
  lemon: { name: "Lemon", emoji: "🍋", isFruit: true },
  skewers: { name: "Wooden Skewers (5-pack)", emoji: "🔱", isPromo: true },
};

let requestedProductCounter = 0;

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
  const smoothieSection = document.getElementById("smoothieSection");
  if (!basketList) return;
  basketList.innerHTML = "";
  if (basket.length === 0) {
    basketList.innerHTML = "<li>No products in basket.</li>";
    if (cartButtonsRow) cartButtonsRow.style.display = "none";
    if (smoothieSection) smoothieSection.style.display = "none";
    return;
  }
  basket.forEach((product) => {
    const item = PRODUCTS[product];
    if (item) {
      const li = document.createElement("li");
      li.innerHTML = `<span class='basket-emoji'>${item.emoji}</span> <span>${item.name}</span>`;
      basketList.appendChild(li);
    } else if (product.startsWith("requested_")) {
      // Handle requested products
      const reqData = getRequestedProduct(product);
      if (reqData) {
        const li = document.createElement("li");
        li.className = "basket-requested";
        li.innerHTML = `
          <span class='basket-emoji'>📋</span>
          <span>${reqData.name}</span>
          <span class='item-requested-badge'>Customer Requested</span>
          <div class='item-actions'>
            <button class='edit-requested-btn' data-id='${product}' aria-label='Edit requested item'>Edit</button>
            <button class='remove-requested-btn' data-id='${product}' aria-label='Remove requested item'>Remove</button>
          </div>
        `;
        // Attach event listeners
        li.querySelector(".edit-requested-btn").addEventListener("click", () => editRequestedProduct(product));
        li.querySelector(".remove-requested-btn").addEventListener("click", () => removeRequestedProduct(product));
        basketList.appendChild(li);
      }
    }
  });
  if (cartButtonsRow) cartButtonsRow.style.display = "flex";
  
  // Handle smoothie section
  if (smoothieSection) {
    const fruits = getFruits();
    if (fruits.length > 0) {
      smoothieSection.style.display = "block";
      const checkbox = document.getElementById("smoothieCheckbox");
      const flavorText = document.getElementById("smoothieFlavor");
      
      // Update checkbox state
      checkbox.checked = getSmoothieState();
      
      // Update flavor text
      if (checkbox.checked) {
        const flavor = generateSmoothieFlavor(fruits);
        flavorText.textContent = `✨ ${flavor}`;
        
        // Add smoothie item to the list
        const smoothieLi = document.createElement("li");
        smoothieLi.className = "basket-smoothie";
        smoothieLi.innerHTML = `<span class='basket-emoji'>🥤</span> <span>${flavor}</span>`;
        basketList.appendChild(smoothieLi);
      } else {
        flavorText.textContent = "";
      }
    } else {
      smoothieSection.style.display = "none";
    }
  }
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

// Requested products functions
function getRequestedProduct(id) {
  const requested = localStorage.getItem("requested_products");
  if (!requested) return null;
  const products = JSON.parse(requested);
  return products[id] || null;
}

function addRequestedProduct(name, description, link) {
  const id = `requested_${Date.now()}_${requestedProductCounter++}`;
  const requested = localStorage.getItem("requested_products");
  const products = requested ? JSON.parse(requested) : {};
  products[id] = { name, description, link };
  localStorage.setItem("requested_products", JSON.stringify(products));
  // Add to basket
  const basket = getBasket();
  basket.push(id);
  localStorage.setItem("basket", JSON.stringify(basket));
  return id;
}

function editRequestedProduct(id) {
  const reqData = getRequestedProduct(id);
  if (!reqData) return;
  // Show modal with current data
  document.getElementById("productName").value = reqData.name;
  document.getElementById("productDesc").value = reqData.description || "";
  document.getElementById("productLink").value = reqData.link || "";
  document.getElementById("requestModal").dataset.editId = id;
  document.getElementById("requestModal").classList.add("show");
  document.getElementById("requestModal").setAttribute("aria-hidden", "false");
}

function removeRequestedProduct(id) {
  if (!confirm("Remove this requested product?")) return;
  const requested = localStorage.getItem("requested_products");
  if (requested) {
    const products = JSON.parse(requested);
    delete products[id];
    localStorage.setItem("requested_products", JSON.stringify(products));
  }
  const basket = getBasket();
  const idx = basket.indexOf(id);
  if (idx !== -1) {
    basket.splice(idx, 1);
    localStorage.setItem("basket", JSON.stringify(basket));
  }
  renderBasket();
  renderBasketIndicator();
}

// Modal and request form handling
if (document.readyState !== "loading") {
  initRequestModal();
} else {
  document.addEventListener("DOMContentLoaded", initRequestModal);
}

function initRequestModal() {
  const modal = document.getElementById("requestModal");
  if (!modal) return;
  const requestBtn = document.getElementById("requestProductBtn");
  const closeBtn = document.getElementById("closeModal");
  const form = document.getElementById("requestForm");

  if (requestBtn) {
    requestBtn.addEventListener("click", () => {
      modal.dataset.editId = "";
      form.reset();
      modal.classList.add("show");
      modal.setAttribute("aria-hidden", "false");
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.classList.remove("show");
      modal.setAttribute("aria-hidden", "true");
    });
  }

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("show");
      modal.setAttribute("aria-hidden", "true");
    }
  });

  // Close modal on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("show")) {
      modal.classList.remove("show");
      modal.setAttribute("aria-hidden", "true");
    }
  });

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("productName").value.trim();
      const description = document.getElementById("productDesc").value.trim();
      const link = document.getElementById("productLink").value.trim();

      if (!name) {
        alert("Please enter a product name");
        return;
      }

      const editId = modal.dataset.editId;
      if (editId) {
        // Update existing requested product
        const requested = localStorage.getItem("requested_products");
        const products = JSON.parse(requested);
        products[editId] = { name, description, link };
        localStorage.setItem("requested_products", JSON.stringify(products));
      } else {
        // Add new requested product
        addRequestedProduct(name, description, link);
      }

      modal.classList.remove("show");
      modal.setAttribute("aria-hidden", "true");
      form.reset();
      renderBasket();
      renderBasketIndicator();
    });
  }
}

// Smoothie functionality
function getFruits() {
  const basket = getBasket();
  return basket.filter((item) => {
    const product = PRODUCTS[item];
    return product && product.isFruit;
  });
}

function generateSmoothieFlavor(fruits) {
  const fruitNames = fruits.map((fruit) => PRODUCTS[fruit].name);
  if (fruitNames.length === 0) {
    return null;
  }
  if (fruitNames.length === 1) {
    return `${fruitNames[0]} Smoothie`;
  }
  return `${fruitNames.join("-")} Blend`;
}

function getSmoothieState() {
  return localStorage.getItem("smoothie_enabled") === "true";
}

function setSmoothieState(enabled) {
  if (enabled) {
    localStorage.setItem("smoothie_enabled", "true");
  } else {
    localStorage.removeItem("smoothie_enabled");
  }
}
