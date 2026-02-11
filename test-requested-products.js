// Test suite for custom product request feature
console.log("Starting custom product request tests...\n");

// Mock localStorage
const mockStorage = {};
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, value) => {
    mockStorage[key] = value;
  },
  removeItem: (key) => {
    delete mockStorage[key];
  },
  clear: () => {
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
  },
};

// Load shop.js functions (simplified versions for testing)
const PRODUCTS = {
  maine_coon: { name: "Maine Coon", emoji: "🐈‍⬛" },
  nordic_forest_cat: { name: "Nordic Forest Cat", emoji: "🐱" },
  british_shorthair: { name: "British Shorthair", emoji: "😺" },
  bengal: { name: "Bengal", emoji: "🐈" },
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
    return [];
  }
}

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
  const basket = getBasket();
  basket.push(id);
  localStorage.setItem("basket", JSON.stringify(basket));
  return id;
}

function editRequestedProduct(id, name, description, link) {
  const requested = localStorage.getItem("requested_products");
  const products = requested ? JSON.parse(requested) : {};
  if (products[id]) {
    products[id] = { name, description, link };
    localStorage.setItem("requested_products", JSON.stringify(products));
    return true;
  }
  return false;
}

function removeRequestedProduct(id) {
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
}

// Tests
let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    localStorage.clear();
    requestedProductCounter = 0;
    fn();
    console.log(`✓ ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}\n`);
    testsFailed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// Test 1: Add a requested product
test("Add a requested product", () => {
  const id = addRequestedProduct("Siamese Cat", "Beautiful breed", "https://example.com");
  assert(id.startsWith("requested_"), "ID should start with 'requested_'");
  const data = getRequestedProduct(id);
  assert(data !== null, "Product should exist");
  assert(data.name === "Siamese Cat", "Name should match");
  assert(data.description === "Beautiful breed", "Description should match");
  assert(data.link === "https://example.com", "Link should match");
  const basket = getBasket();
  assert(basket.includes(id), "Product should be in basket");
});

// Test 2: Add multiple requested products
test("Add multiple requested products", () => {
  const id1 = addRequestedProduct("Siamese", "Siamese Cat", "https://siamese.com");
  const id2 = addRequestedProduct("Persian", "Persian Cat", "https://persian.com");
  const basket = getBasket();
  assert(basket.length === 2, "Basket should have 2 items");
  assert(basket.includes(id1), "First product should be in basket");
  assert(basket.includes(id2), "Second product should be in basket");
});

// Test 3: Edit a requested product
test("Edit a requested product", () => {
  const id = addRequestedProduct("Siamese", "Siamese Cat", "https://siamese.com");
  const success = editRequestedProduct(id, "Thai Cat", "Updated description", "https://updated.com");
  assert(success, "Edit should succeed");
  const data = getRequestedProduct(id);
  assert(data.name === "Thai Cat", "Name should be updated");
  assert(data.description === "Updated description", "Description should be updated");
  assert(data.link === "https://updated.com", "Link should be updated");
});

// Test 4: Remove a requested product
test("Remove a requested product", () => {
  const id = addRequestedProduct("Siamese", "Siamese Cat", "https://siamese.com");
  removeRequestedProduct(id);
  const data = getRequestedProduct(id);
  assert(data === null, "Product should be removed");
  const basket = getBasket();
  assert(!basket.includes(id), "Product should be removed from basket");
});

// Test 5: Requested product with empty optional fields
test("Requested product with empty optional fields", () => {
  const id = addRequestedProduct("Bengal", "", "");
  const data = getRequestedProduct(id);
  assert(data !== null, "Product should exist");
  assert(data.name === "Bengal", "Name should be set");
  assert(data.description === "", "Description can be empty");
  assert(data.link === "", "Link can be empty");
});

// Test 6: Mix regular and requested products in basket
test("Mix regular and requested products in basket", () => {
  const basket = getBasket();
  basket.push("maine_coon");
  basket.push("bengal");
  localStorage.setItem("basket", JSON.stringify(basket));
  
  const id = addRequestedProduct("Siamese", "Siamese Cat", "https://siamese.com");
  const updated = getBasket();
  assert(updated.includes("maine_coon"), "Regular product should exist");
  assert(updated.includes("bengal"), "Regular product should exist");
  assert(updated.includes(id), "Requested product should exist");
  assert(updated.length === 3, "Basket should have 3 items");
});

console.log(`\n${testsPassed} passed, ${testsFailed} failed`);
process.exit(testsFailed > 0 ? 1 : 0);
