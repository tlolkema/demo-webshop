// Test script for skewers feature
// This simulates the basket logic without DOM dependencies

const PRODUCTS = {
  maine_coon: { name: "Maine Coon", emoji: "🐈‍⬛" },
  nordic_forest_cat: { name: "Nordic Forest Cat", emoji: "🐱" },
  british_shorthair: { name: "British Shorthair", emoji: "😺" },
  bengal: { name: "Bengal", emoji: "🐈" },
  skewers: { name: "Wooden Skewers (5-pack)", emoji: "🔱", isPromo: true },
};

let mockBasket = [];

function getBasket() {
  return [...mockBasket];
}

function addToBasket(product) {
  mockBasket.push(product);
}

function syncSkewers() {
  const basket = getBasket();
  const fruitCount = basket.filter((item) => item !== "skewers").length;
  const requiredSkewers = Math.floor(fruitCount / 3);
  const currentSkewers = basket.filter((item) => item === "skewers").length;
  
  if (requiredSkewers > currentSkewers) {
    for (let i = 0; i < requiredSkewers - currentSkewers; i++) {
      mockBasket.push("skewers");
    }
  } else if (requiredSkewers < currentSkewers) {
    const itemsToRemove = currentSkewers - requiredSkewers;
    for (let i = 0; i < itemsToRemove; i++) {
      const idx = mockBasket.lastIndexOf("skewers");
      if (idx !== -1) {
        mockBasket.splice(idx, 1);
      }
    }
  }
}

function printBasket() {
  const cats = mockBasket.filter(p => p !== "skewers").length;
  const skewer = mockBasket.filter(p => p === "skewers").length;
  console.log(
    `Basket: ${cats} cats, ${skewer} skewer pack(s). Total items: ${mockBasket.length}`,
    mockBasket
  );
}

// Test cases
console.log("=== SKEWERS TEST SUITE ===\n");

// Test 1: Add 3 fruits, should get 1 skewer pack
console.log("Test 1: Add 3 fruits → expect 1 skewer pack");
mockBasket = [];
addToBasket("maine_coon");
addToBasket("nordic_forest_cat");
addToBasket("british_shorthair");
syncSkewers();
printBasket();
console.log(
  `✓ PASS` + (mockBasket.filter(p => p === "skewers").length === 1 ? "" : " (FAIL)")
);
console.log();

// Test 2: Add 6 fruits, should get 2 skewer packs
console.log("Test 2: Add 6 fruits → expect 2 skewer packs");
mockBasket = [];
for (let i = 0; i < 6; i++) {
  addToBasket("bengal");
}
syncSkewers();
printBasket();
console.log(
  `✓ PASS` + (mockBasket.filter(p => p === "skewers").length === 2 ? "" : " (FAIL)")
);
console.log();

// Test 3: Add 4 fruits, should get 1 skewer pack (4/3 = 1)
console.log("Test 3: Add 4 fruits → expect 1 skewer pack (4 < 6)");
mockBasket = [];
for (let i = 0; i < 4; i++) {
  addToBasket("maine_coon");
}
syncSkewers();
printBasket();
console.log(
  `✓ PASS` + (mockBasket.filter(p => p === "skewers").length === 1 ? "" : " (FAIL)")
);
console.log();

// Test 4: Add 9 fruits, should get 3 skewer packs
console.log("Test 4: Add 9 fruits → expect 3 skewer packs");
mockBasket = [];
for (let i = 0; i < 9; i++) {
  addToBasket("british_shorthair");
}
syncSkewers();
printBasket();
console.log(
  `✓ PASS` + (mockBasket.filter(p => p === "skewers").length === 3 ? "" : " (FAIL)")
);
console.log();

// Test 5: Remove fruit below threshold - reduce 6 fruits to 4, skewers should go 2→1
console.log("Test 5: Start with 6 fruits (2 skewers), remove 2 → expect 1 skewer");
mockBasket = [];
for (let i = 0; i < 6; i++) {
  addToBasket("bengal");
}
syncSkewers();
console.log("Before removal:");
printBasket();
// Remove 2 fruits
mockBasket = mockBasket.filter(p => p !== "skewers").slice(0, 4);
syncSkewers();
console.log("After removal:");
printBasket();
console.log(
  `✓ PASS` + (mockBasket.filter(p => p === "skewers").length === 1 ? "" : " (FAIL)")
);
console.log();

// Test 6: Remove all fruits - skewers should be removed too
console.log("Test 6: Clear all fruits → expect 0 skewer packs");
mockBasket = [];
for (let i = 0; i < 5; i++) {
  addToBasket("maine_coon");
}
syncSkewers();
console.log("Before clearing:");
printBasket();
mockBasket = [];
syncSkewers();
console.log("After clearing:");
printBasket();
console.log(
  `✓ PASS` + (mockBasket.filter(p => p === "skewers").length === 0 ? "" : " (FAIL)")
);
console.log();

console.log("=== ALL TESTS COMPLETE ===");
