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

// Orders: persist and render a simple order history in localStorage
function getOrders() {
  try {
    const orders = localStorage.getItem("orders");
    if (!orders) return [];
    const parsed = JSON.parse(orders);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Error parsing orders from localStorage:", error);
    return [];
  }
}

function saveOrders(orders) {
  try {
    localStorage.setItem("orders", JSON.stringify(orders));
  } catch (error) {
    console.warn("Error saving orders to localStorage:", error);
  }
}

function addOrder(order) {
  const orders = getOrders();
  orders.push(order);
  saveOrders(orders);
}

function createOrderFromBasket(details = {}) {
  const basket = getBasket();
  const order = {
    id: Date.now(),
    date: new Date().toISOString(),
    quantity: basket.length,
    status: details.status || "Placed",
    items: basket.slice(),
    customer: {
      name: details.name || null,
      address: details.address || null,
    },
  };
  addOrder(order);
  return order;
}

function renderOrders(listElementId = "ordersList") {
  const orders = getOrders();
  const list = document.getElementById(listElementId);
  if (!list) return;
  list.innerHTML = "";
  if (orders.length === 0) {
    list.innerHTML = "<li>No orders yet.</li>";
    return;
  }
  // Show newest first
  orders
    .slice()
    .reverse()
    .forEach((order) => {
      const li = document.createElement("li");
      li.className = "order-list-item";
      const date = new Date(order.date);
      li.innerHTML = `
        <div class="order-row">
          <div class="order-date">${date.toLocaleString()}</div>
          <div class="order-qty">${order.quantity}</div>
          <div class="order-status">${order.status}</div>
        </div>
      `;
      list.appendChild(li);
    });
}

// expose order helpers globally for pages to call
window.getOrders = getOrders;
window.addOrder = addOrder;
window.createOrderFromBasket = createOrderFromBasket;
window.renderOrders = renderOrders;
