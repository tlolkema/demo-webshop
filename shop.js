const PRODUCTS = {
  apple: { name: "Apple", emoji: "🍏" },
  banana: { name: "Banana", emoji: "🍌" },
  lemon: { name: "Lemon", emoji: "🍋" },
  pear: { name: "Pear", emoji: "🍐" },
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

function getSmoothieOption() {
  return localStorage.getItem("smoothieOption") === "true";
}

function setSmoothieOption(enabled) {
  localStorage.setItem("smoothieOption", String(enabled));
}

function getSmoothieFlavour(basket) {
  const distinct = new Set(basket).size;
  return distinct <= 1 ? "Single flavour smoothie" : "Multi flavour smoothie";
}

function addToBasket(product) {
  const basket = getBasket();
  basket.push(product);
  localStorage.setItem("basket", JSON.stringify(basket));
}

function clearBasket() {
  localStorage.removeItem("basket");
  localStorage.removeItem("smoothieOption");
}

function removeFromBasket(index) {
  const basket = getBasket();
  if (index < 0 || index >= basket.length) return null;
  const [removed] = basket.splice(index, 1);
  localStorage.setItem("basket", JSON.stringify(basket));
  return removed;
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
  basket.forEach((product, index) => {
    const item = PRODUCTS[product];
    if (item) {
      const li = document.createElement("li");
      li.innerHTML = `<span class='basket-emoji'>${item.emoji}</span> <span>${item.name}</span>`;
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "basket-remove-btn";
      removeBtn.textContent = "✕";
      removeBtn.setAttribute("aria-label", `Remove ${item.name} from basket`);
      removeBtn.addEventListener("click", function () {
        removeFromBasket(index);
        renderBasket();
      });
      li.appendChild(removeBtn);
      basketList.appendChild(li);
    }
  });
  if (cartButtonsRow) cartButtonsRow.style.display = "flex";
  renderSmoothieToggle(basket);
}

function renderSmoothieToggle(basket) {
  const container = document.getElementById("smoothieToggleContainer");
  if (!container) return;
  if (basket.length === 0) {
    container.style.display = "none";
    return;
  }
  container.style.display = "flex";
  const toggle = document.getElementById("smoothieToggle");
  const flavourLabel = document.getElementById("smoothieFlavourLabel");
  if (!toggle) return;
  const enabled = getSmoothieOption();
  toggle.checked = enabled;
  if (flavourLabel) {
    if (enabled) {
      flavourLabel.textContent = getSmoothieFlavour(basket);
      flavourLabel.style.display = "";
    } else {
      flavourLabel.style.display = "none";
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
  renderBasketIndicator();
} else {
  document.addEventListener("DOMContentLoaded", renderBasketIndicator);
}

/* ------------------------------------------------------------------ *
 * Basket personality engine
 *
 * Your basket is a character: a mildly judgmental companion that reacts
 * to your shopping with a dry, observational wit. Every meaningful action
 * fires an event; each event picks a line from a pool and shows it in a
 * speech bubble near the cart icon.
 *
 * Tone rules: dry and observational, never mean. It comments, it never
 * blocks or nags. It throttles chatter (~1 in 3 minor actions) but always
 * speaks up for the big moments, and it hides "combo" lines that only
 * appear if you keep doing something.
 * ------------------------------------------------------------------ */

const BasketVoice = (function () {
  // Roughly one in three minor actions get a comment; big moments bypass this.
  const MINOR_COMMENT_CHANCE = 0.34;
  const BUBBLE_DURATION_MS = 5200;
  const IDLE_DELAY_MS = 60000;

  // --- lightweight persisted state (survives page navigation) -------------
  function loadState() {
    try {
      const raw = localStorage.getItem("basketVoiceState");
      const parsed = raw ? JSON.parse(raw) : {};
      return {
        history: Array.isArray(parsed.history) ? parsed.history : [],
        comboLevel: parsed.comboLevel && typeof parsed.comboLevel === "object" ? parsed.comboLevel : {},
        flags: parsed.flags && typeof parsed.flags === "object" ? parsed.flags : {},
      };
    } catch (error) {
      return { history: [], comboLevel: {}, flags: {} };
    }
  }
  function saveState(state) {
    try {
      localStorage.setItem("basketVoiceState", JSON.stringify(state));
    } catch (error) {
      /* storage full or unavailable — the basket simply goes quiet */
    }
  }

  // --- helpers ------------------------------------------------------------
  function pick(pool) {
    return pool[Math.floor(Math.random() * pool.length)];
  }
  function fill(line, ctx) {
    return line
      .replace(/{name}/g, ctx.name || "that")
      .replace(/{names}/g, ctx.names || (ctx.name ? ctx.name + "s" : "those"))
      .replace(/{n}/g, ctx.n != null ? ctx.n : "");
  }
  function plural(name) {
    return name + "s";
  }
  function countBy(basket) {
    const counts = {};
    basket.forEach((key) => {
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }

  // --- the speech bubble --------------------------------------------------
  let hideTimer = null;
  function showBubble(text) {
    const link = document.querySelector(".basket-link");
    if (!link) return;
    let bubble = link.querySelector(".basket-bubble");
    if (!bubble) {
      bubble = document.createElement("span");
      bubble.className = "basket-bubble";
      bubble.setAttribute("role", "status");
      bubble.setAttribute("aria-live", "polite");
      link.appendChild(bubble);
    }
    bubble.textContent = text;
    // restart the entrance animation
    bubble.classList.remove("basket-bubble--show");
    void bubble.offsetWidth;
    bubble.classList.add("basket-bubble--show");
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      bubble.classList.remove("basket-bubble--show");
    }, BUBBLE_DURATION_MS);
  }

  function say(pool, ctx, opts) {
    const always = opts && opts.always;
    if (!always && Math.random() > MINOR_COMMENT_CHANCE) return;
    const line = fill(pick(pool), ctx || {});
    showBubble(line);
    resetIdle();
  }

  // --- line pools ---------------------------------------------------------
  const LINES = {
    addGeneric: [
      "Noted.",
      "In it goes. No turning back now.",
      "Another {name}. Bold.",
      "Sure. Why not.",
      "A fine choice, probably.",
    ],
    qtyOne: [
      "One {name}. A calculated risk.",
      "Just the one {name}. Restraint. I'm impressed.",
    ],
    qtyOneLemon: [
      "One lemon. Making lemonade or making a point?",
      "A single lemon. Somewhere, a recipe is nervous.",
    ],
    qtyFew: [
      "{n} {names}. We're committing now.",
      "{name} number {n}. A pattern is forming.",
    ],
    qtyFive: [
      "Five {names}. Rough week?",
      "That's five {names}. Everything alright at home?",
    ],
    qtyLots: [
      "{n} {names}. For a friend, I'm sure.",
      "{n} {names}. This is a lot of {name} to explain later.",
    ],
    qtyAbsurd: [
      "{n} {names}. I'm not going to ask.",
      "{n} {names}. We don't have to talk about it.",
    ],
    remove: [
      "Rejected. Harsh, but okay.",
      "Changed our mind, did we.",
      "Gone. I liked that one.",
      "And just like that, it's out. Ruthless.",
    ],
    clear: [
      "So we're just going to pretend this didn't happen.",
      "Empty. Cold. Just like that.",
      "Everything gone. I'll be here. Processing.",
      "A clean slate. For you. I remember everything.",
    ],
    idle: [
      "Take your time. I'm not going anywhere. Literally.",
      "Still here. Still a basket.",
      "No rush. It's not like I have other baskets to be.",
    ],
    idleWithItems: [
      "That {name} isn't going to buy itself, but sure, we can wait.",
      "The {name} and I have been talking. We're worried.",
    ],
    monoLifestyle: [
      "A {name}-only lifestyle. Interesting.",
      "Nothing but {names}. A purist. I respect the commitment.",
    ],
    oneOfEach: [
      "One of everything. The 'I couldn't decide' special.",
      "The full set. An overachiever, or just indecisive.",
    ],
    milestone10: [
      "Ten items. Someone's having a party. I wasn't invited, but that's fine.",
      "Ten. This escalated quickly.",
    ],
    milestone20: [
      "Twenty items. This is less a snack, more a lifestyle.",
      "Twenty. I'm going to need a bigger imaginary shelf.",
    ],
    milestone30: [
      "Thirty items. I've stopped counting for my own wellbeing.",
      "Thirty. At this point I'm just a witness.",
    ],
    combo3: [
      "You okay? We can talk about it.",
      "Add, remove, add, remove. This is a conversation, not a basket.",
    ],
    combo5: [
      "This is a cry for help disguised as a {name}.",
      "Neither of us is leaving until you make peace with this {name}.",
    ],
    checkoutEmpty: [
      "Checking out with nothing. Efficient, I'll give you that.",
      "An empty order. Minimalism taken to its logical, upsetting conclusion.",
    ],
    checkoutSingle: [
      "One {name}. Bold. Minimalist. I respect it.",
      "A single {name}. The whole trip, for this. No notes.",
    ],
    checkoutSingleLemon: [
      "One lemon, checking out. A statement. I hear you.",
      "Just the lemon. Bold. Minimalist. Slightly sour. On brand.",
    ],
    checkoutBulk: [
      "{n} {names}. No notes. Genuinely no notes.",
      "{n} {names} in one order. I have questions but also respect.",
    ],
    checkoutBig: [
      "Big haul. No judgment. Okay, a little judgment.",
      "Off we go with the whole shop. Try not to look back.",
    ],
    checkoutNormal: [
      "Off we go. Try not to look back.",
      "Checking out. It's been an experience.",
    ],
  };

  // --- pattern detection --------------------------------------------------
  function recordAction(state, type, product) {
    state.history.push({ type: type, product: product });
    if (state.history.length > 16) state.history = state.history.slice(-16);
  }

  // Fires when you keep flip-flopping on the same fruit (add/remove/add...).
  function checkCombo(state, product) {
    if (!product) return false;
    let adds = 0;
    let removes = 0;
    state.history.forEach((entry) => {
      if (entry.product !== product) return;
      if (entry.type === "add") adds++;
      else if (entry.type === "remove") removes++;
    });
    const flips = Math.min(adds, removes);
    const level = state.comboLevel[product] || 0;
    const ctx = { name: PRODUCTS[product] ? PRODUCTS[product].name : product };
    if (flips >= 5 && level < 5) {
      state.comboLevel[product] = 5;
      say(LINES.combo5, ctx, { always: true });
      return true;
    }
    if (flips >= 3 && level < 3) {
      state.comboLevel[product] = 3;
      say(LINES.combo3, ctx, { always: true });
      return true;
    }
    return false;
  }

  // State-based observations: fire once when a condition becomes true, and
  // re-arm when it stops being true. Keeps them special instead of spammy.
  function checkStatePatterns(state, basket) {
    const counts = countBy(basket);
    const distinct = Object.keys(counts);
    const total = basket.length;
    const flags = state.flags;

    function edge(key, condition, pool, ctx) {
      if (condition && !flags[key]) {
        flags[key] = true;
        say(pool, ctx, { always: true });
        return true;
      }
      if (!condition && flags[key]) {
        flags[key] = false;
      }
      return false;
    }

    // Milestones (fire once as you cross each threshold).
    if (edge("milestone30", total >= 30, LINES.milestone30, {})) return true;
    if (edge("milestone20", total >= 20 && total < 30, LINES.milestone20, {})) return true;
    if (edge("milestone10", total >= 10 && total < 20, LINES.milestone10, {})) return true;

    // One of every fruit.
    const everyFruit = Object.keys(PRODUCTS).filter((k) => k !== "slot");
    const hasEach = everyFruit.length > 0 && everyFruit.every((k) => counts[k] > 0);
    if (edge("oneOfEach", hasEach, LINES.oneOfEach, {})) return true;

    // A single-fruit "lifestyle" (three or more of one fruit, nothing else).
    const monoKey = distinct.length === 1 ? distinct[0] : null;
    const monoName = monoKey && PRODUCTS[monoKey] ? PRODUCTS[monoKey].name : null;
    if (
      edge(
        "mono:" + (monoKey || ""),
        monoKey && counts[monoKey] >= 3,
        LINES.monoLifestyle,
        { name: monoName, names: monoName ? plural(monoName) : "" }
      )
    ) {
      return true;
    }
    // Clear stale mono flags for fruits that no longer dominate.
    Object.keys(flags).forEach((key) => {
      if (key.indexOf("mono:") === 0 && key !== "mono:" + (monoKey || "")) {
        flags[key] = false;
      }
    });
    return false;
  }

  // --- idle timer ---------------------------------------------------------
  let idleTimer = null;
  function resetIdle() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(onIdle, IDLE_DELAY_MS);
  }
  function onIdle() {
    const basket = getBasket();
    if (basket.length > 0) {
      const key = basket[basket.length - 1];
      const name = PRODUCTS[key] ? PRODUCTS[key].name : "fruit";
      // Idle is a quiet moment — always worth a word, but keep it gentle.
      say(LINES.idleWithItems, { name: name }, { always: true });
    } else {
      say(LINES.idle, {}, { always: true });
    }
    resetIdle();
  }

  // --- event handlers -----------------------------------------------------
  function onAdd(product) {
    const basket = getBasket();
    const state = loadState();
    recordAction(state, "add", product);

    // Combo and state patterns take priority (they're the "big moments").
    const comboFired = checkCombo(state, product);
    const patternFired = comboFired ? false : checkStatePatterns(state, basket);

    if (!comboFired && !patternFired) {
      const item = PRODUCTS[product];
      const name = item ? item.name : "fruit";
      const count = countBy(basket)[product] || 0;
      const ctx = { name: name, names: plural(name), n: count };
      if (count >= 12) {
        say(LINES.qtyAbsurd, ctx, { always: true });
      } else if (count >= 8) {
        say(LINES.qtyLots, ctx, { always: true });
      } else if (count === 5) {
        say(LINES.qtyFive, ctx, { always: true });
      } else if (count >= 2) {
        say(LINES.qtyFew, ctx);
      } else if (count === 1) {
        say(product === "lemon" ? LINES.qtyOneLemon : LINES.qtyOne, ctx);
      } else {
        say(LINES.addGeneric, ctx);
      }
    }
    saveState(state);
    resetIdle();
  }

  function onRemove(product) {
    const basket = getBasket();
    const state = loadState();
    recordAction(state, "remove", product);
    const comboFired = checkCombo(state, product);
    const patternFired = comboFired ? false : checkStatePatterns(state, basket);
    if (!comboFired && !patternFired) {
      say(LINES.remove, {});
    }
    saveState(state);
    resetIdle();
  }

  function onClear() {
    const state = loadState();
    state.history = [];
    state.comboLevel = {};
    state.flags = {};
    saveState(state);
    say(LINES.clear, {}, { always: true });
    resetIdle();
  }

  function onCheckout() {
    const basket = getBasket();
    const counts = countBy(basket);
    const total = basket.length;
    if (total === 0) {
      say(LINES.checkoutEmpty, {}, { always: true });
      return;
    }
    const distinct = Object.keys(counts);
    const topKey = distinct.reduce((a, b) => (counts[b] > counts[a] ? b : a), distinct[0]);
    const topName = PRODUCTS[topKey] ? PRODUCTS[topKey].name : "fruit";
    if (total === 1) {
      const key = basket[0];
      say(key === "lemon" ? LINES.checkoutSingleLemon : LINES.checkoutSingle, {
        name: PRODUCTS[key] ? PRODUCTS[key].name : "fruit",
      }, { always: true });
    } else if (counts[topKey] >= 20) {
      say(LINES.checkoutBulk, { name: topName, names: plural(topName), n: counts[topKey] }, { always: true });
    } else if (total >= 12) {
      say(LINES.checkoutBig, {}, { always: true });
    } else {
      say(LINES.checkoutNormal, {}, { always: true });
    }
  }

  function init() {
    resetIdle();
    // On the checkout page, react to whatever they're about to buy.
    if (/checkout\.html$/.test(location.pathname)) {
      setTimeout(onCheckout, 400);
    }
  }
  if (document.readyState !== "loading") {
    init();
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }

  return { onAdd: onAdd, onRemove: onRemove, onClear: onClear };
})();

// Patch basket functions to update the indicator and give the basket its voice.
const origAddToBasket = window.addToBasket;
window.addToBasket = function (product) {
  origAddToBasket(product);
  renderBasketIndicator();
  BasketVoice.onAdd(product);
};
const origClearBasket = window.clearBasket;
window.clearBasket = function () {
  origClearBasket();
  renderBasketIndicator();
  BasketVoice.onClear();
};
const origRemoveFromBasket = window.removeFromBasket;
window.removeFromBasket = function (index) {
  const removed = origRemoveFromBasket(index);
  renderBasketIndicator();
  if (removed) BasketVoice.onRemove(removed);
  return removed;
};
