const PRODUCTS = {
  apple: { name: "Apple", emoji: "🍏" },
  banana: { name: "Banana", emoji: "🍌" },
  lemon: { name: "Lemon", emoji: "🍋" },
};

// Theme Management
const THEME_KEY = "fruit-shop-theme";
const THEMES = {
  LIGHT: "light",
  DARK: "dark",
  AUTO: "auto",
};

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? THEMES.DARK
    : THEMES.LIGHT;
}

function getSavedTheme() {
  try {
    const savedTheme = localStorage.getItem(THEME_KEY);
    return savedTheme && Object.values(THEMES).includes(savedTheme)
      ? savedTheme
      : THEMES.AUTO;
  } catch (error) {
    console.warn("Error reading theme from localStorage:", error);
    return THEMES.AUTO;
  }
}

function applyTheme(themePref) {
  const actualTheme = themePref === THEMES.AUTO ? getSystemTheme() : themePref;
  
  if (actualTheme === THEMES.DARK) {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  
  // Update button states
  updateThemeButtons(themePref);
}

function setTheme(themePref) {
  try {
    localStorage.setItem(THEME_KEY, themePref);
    applyTheme(themePref);
  } catch (error) {
    console.warn("Error saving theme to localStorage:", error);
  }
}

function updateThemeButtons(currentTheme) {
  const buttons = document.querySelectorAll(".theme-toggle button");
  buttons.forEach((btn) => {
    if (btn.dataset.theme === currentTheme) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

function initTheme() {
  const savedTheme = getSavedTheme();
  applyTheme(savedTheme);
  
  // Listen for system theme changes when in auto mode
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (e) => {
      if (getSavedTheme() === THEMES.AUTO) {
        applyTheme(THEMES.AUTO);
      }
    });
}

function initThemeToggle() {
  const themeButtons = document.querySelectorAll(".theme-toggle button");
  themeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      setTheme(btn.dataset.theme);
    });
  });
}

// Initialize theme on page load
if (document.readyState !== "loading") {
  initTheme();
} else {
  document.addEventListener("DOMContentLoaded", initTheme);
}

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
