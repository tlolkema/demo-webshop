// Pearcy 🍐 — the friendly AI shopping assistant for Fruit Shop.
//
// A self-contained, dependency-free widget that injects a dismissable mascot
// and a chat panel onto every storefront page. Responses are produced by a
// client-side mock engine, but everything the UI touches goes through the
// swappable `Pearcy.sendMessage` interface so a real LLM backend can be
// dropped in later without changing the UI.

(function () {
  "use strict";

  // Guard against double-injection if the script is included more than once.
  if (window.__pearcyLoaded) return;
  window.__pearcyLoaded = true;

  var STORAGE = {
    history: "pearcy:history", // conversation history for session memory
    tipsOff: "pearcy:tips-off", // user opted out of proactive tips
    hidden: "pearcy:hidden", // user dismissed the avatar
    offline: "pearcy:offline", // force the offline fallback (used by tests)
  };

  var HISTORY_LIMIT = 50; // cap stored turns so localStorage stays small
  var TIP_DELAY_MS = 9000; // wait before the first proactive tip
  var THINK_MIN_MS = 500; // simulated backend latency (min)
  var THINK_MAX_MS = 1100; // simulated backend latency (max)

  // Product knowledge Pearcy draws on. Descriptions mirror the product pages.
  var CATALOG = {
    apple: {
      name: "Apple",
      emoji: "🍏",
      page: "product-apple.html",
      desc: "Keeps the doctor away (unless you throw it at them).",
      pitch: "crisp, classic and always a-peeling",
    },
    banana: {
      name: "Banana",
      emoji: "🍌",
      page: "product-banana.html",
      desc: "Nature's energy bar. Also, monkeys approve!",
      pitch: "the top banana for a quick energy boost",
    },
    lemon: {
      name: "Lemon",
      emoji: "🍋",
      page: "product-lemon.html",
      desc: "When life gives you lemons, make a website.",
      pitch: "zesty, zingy and ready to brighten your day",
    },
  };

  var TIPS = [
    "Looking for a gift? I've got some ap-peel-ing ideas 🍐",
    "Psst — not sure what to pick? Ask me for a pear-sonalized recommendation!",
    "Need a hand? I'm always ripe for a chat 🍐",
    "New here? I can help you find your way around the shop.",
  ];

  // ---------------------------------------------------------------------------
  // Storage helpers
  // ---------------------------------------------------------------------------

  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      var parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    } catch (e) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* storage may be unavailable (private mode) — degrade gracefully */
    }
  }

  function getHistory() {
    var h = readJSON(STORAGE.history, []);
    return Array.isArray(h) ? h : [];
  }

  function pushHistory(role, text) {
    var h = getHistory();
    h.push({ role: role, text: text });
    if (h.length > HISTORY_LIMIT) h = h.slice(h.length - HISTORY_LIMIT);
    writeJSON(STORAGE.history, h);
  }

  function flag(key) {
    try {
      return localStorage.getItem(key) === "1";
    } catch (e) {
      return false;
    }
  }

  function setFlag(key, on) {
    try {
      if (on) localStorage.setItem(key, "1");
      else localStorage.removeItem(key);
    } catch (e) {
      /* ignore */
    }
  }

  // ---------------------------------------------------------------------------
  // Mock response engine
  //
  // Rule-based intent matching over the catalog and cart. Returns a punny,
  // helpful reply as an HTML string (links allowed). It receives the recent
  // history so it can behave as if it "remembers" the session.
  // ---------------------------------------------------------------------------

  function currentBasket() {
    // shop.js exposes getBasket(); fall back to reading storage directly.
    if (typeof window.getBasket === "function") {
      try {
        return window.getBasket();
      } catch (e) {
        /* fall through */
      }
    }
    var b = readJSON("basket", []);
    return Array.isArray(b) ? b : [];
  }

  function link(key) {
    var p = CATALOG[key];
    return '<a href="' + p.page + '">' + p.emoji + " " + p.name + "</a>";
  }

  function listAllProducts() {
    return Object.keys(CATALOG)
      .map(link)
      .join(", ");
  }

  function detectProduct(text) {
    for (var key in CATALOG) {
      if (Object.prototype.hasOwnProperty.call(CATALOG, key)) {
        if (text.indexOf(key) !== -1 || text.indexOf(CATALOG[key].name.toLowerCase()) !== -1) {
          return key;
        }
      }
    }
    return null;
  }

  function has(text) {
    for (var i = 1; i < arguments.length; i++) {
      if (text.indexOf(arguments[i]) !== -1) return true;
    }
    return false;
  }

  // Produce a reply for a user message. Pure function of (message, history).
  function mockReply(message, history) {
    var text = String(message || "").toLowerCase().trim();

    if (!text) {
      return "Don't be shy — ask me anything about our fruit! 🍐";
    }

    // Greetings
    if (has(text, "hello", "hi ", "hey", "yo ", "howdy") || text === "hi" || text === "hey") {
      var returning = history && history.length > 2;
      return (
        (returning ? "Welcome back! " : "Well hello there! ") +
        "I'm Pearcy, your fruit-shop sidekick. I can recommend products, answer questions, and help you find your way around. What are you in the mood for? 🍐"
      );
    }

    // Capabilities / help
    if (has(text, "what can you", "help", "how do you", "who are you", "what do you do")) {
      return (
        "Happy to help! I can:<br>" +
        "• Suggest a pear-fect pick 🍐<br>" +
        "• Tell you about a fruit (try \"tell me about the lemon\")<br>" +
        "• Show you your basket or the way to checkout<br>" +
        "Just type away!"
      );
    }

    // Recommendations / gifts
    if (has(text, "recommend", "suggest", "gift", "best", "which", "what should", "idea", "popular")) {
      return (
        "Ooh, an ap-peel-ing question! My pear-sonal picks: " +
        link("apple") + " is " + CATALOG.apple.pitch + ", " +
        link("banana") + " is " + CATALOG.banana.pitch + ", and " +
        link("lemon") + " is " + CATALOG.lemon.pitch + ". " +
        "Feeling adventurous? Grab one of each — variety is the spice of life! 🍐"
      );
    }

    // Basket / cart status
    if (has(text, "basket", "cart", "my order", "what did i")) {
      var basket = currentBasket();
      if (basket.length === 0) {
        return (
          "Your basket's looking a little bare — let's fix that! Browse the " +
          listAllProducts() + ", or ask me for a recommendation. 🍐"
        );
      }
      var names = basket
        .map(function (k) {
          return CATALOG[k] ? CATALOG[k].emoji + " " + CATALOG[k].name : k;
        })
        .join(", ");
      return (
        "You've got " + basket.length + " item" + (basket.length === 1 ? "" : "s") +
        " in your basket: " + names + ". " +
        'Ready to seal the deal? Head to your <a href="basket.html">basket</a> ' +
        "when you're ripe and ready! 🍐"
      );
    }

    // Checkout / buying
    if (has(text, "checkout", "buy", "pay", "purchase", "order now", "place order")) {
      return (
        'To wrap things up, pop over to your <a href="basket.html">basket</a> and hit ' +
        "<em>Checkout</em> — I'll cheer you on from here. (I can't complete the payment " +
        "for you just yet, but you're in good hands.) 🍐"
      );
    }

    // Price questions (this is a demo shop with no prices)
    if (has(text, "price", "cost", "how much", "cheap", "expensive", "$", "€")) {
      return (
        "Great news — everything here is pun-believably priced for this demo, so " +
        "feel free to fill your basket guilt-free! 🍐"
      );
    }

    // Navigation
    if (has(text, "where", "find", "navigate", "go to", "home", "menu", "page")) {
      return (
        'You can head to the <a href="index.html">product list</a>, dive into a ' +
        "product (" + listAllProducts() + "), or check your " +
        '<a href="basket.html">basket</a>. Where would you like to go? 🍐'
      );
    }

    // Thanks
    if (has(text, "thank", "thanks", "cheers", "ta ")) {
      return "Anytime — that's what I'm ripe for! 🍐";
    }

    // Specific product mentioned
    var product = detectProduct(text);
    if (product) {
      var p = CATALOG[product];
      return (
        p.emoji + " <strong>" + p.name + "</strong> — " + p.desc + "<br>" +
        "It's " + p.pitch + ". Want to take a closer look? " + link(product) + " 🍐"
      );
    }

    // Fallback — still friendly and useful
    return (
      "Hmm, that one's a tough nut to crack (and I'm more of a fruit guy 🍐). " +
      "I can tell you about our " + listAllProducts() + ", suggest a pick, or help " +
      "you find your basket. What sounds good?"
    );
  }

  // ---------------------------------------------------------------------------
  // Swappable transport. Default is the mock; replace `Pearcy.sendMessage` to
  // wire in a real backend. Rejects when offline so the UI shows a fallback.
  // ---------------------------------------------------------------------------

  function randomThinkTime() {
    // Deterministic-ish jitter without Math.random dependency concerns.
    return THINK_MIN_MS + Math.floor((THINK_MAX_MS - THINK_MIN_MS) * 0.6);
  }

  function defaultSendMessage(message, history) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        if (flag(STORAGE.offline)) {
          reject(new Error("Pearcy backend unavailable"));
          return;
        }
        try {
          resolve(mockReply(message, history));
        } catch (e) {
          reject(e);
        }
      }, randomThinkTime());
    });
  }

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------

  var el = {}; // cached element references
  var isOpen = false;
  var tipTimer = null;

  function h(tag, attrs, html) {
    var node = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, k)) {
          node.setAttribute(k, attrs[k]);
        }
      }
    }
    if (html != null) node.innerHTML = html;
    return node;
  }

  function buildUI() {
    var root = h("div", { id: "pearcy-root" });

    // Proactive tip bubble
    var tip = h("div", {
      class: "pearcy-tip",
      role: "status",
      "aria-live": "polite",
      hidden: "",
    });
    var tipText = h("p", { class: "pearcy-tip__text" });
    var tipActions = h("div", { class: "pearcy-tip__actions" });
    var tipDismiss = h("button", { type: "button", class: "pearcy-tip__btn" }, "Got it");
    var tipOff = h(
      "button",
      { type: "button", class: "pearcy-tip__btn pearcy-tip__btn--off" },
      "Don't show again"
    );
    tipActions.appendChild(tipDismiss);
    tipActions.appendChild(tipOff);
    tip.appendChild(tipText);
    tip.appendChild(tipActions);

    // Avatar button (opens the panel) with a small dismiss control
    var avatar = h("button", {
      id: "pearcy-avatar",
      class: "pearcy-avatar pearcy-avatar--idle",
      type: "button",
      "aria-label": "Chat with Pearcy, the shopping assistant",
      "aria-haspopup": "dialog",
      "aria-expanded": "false",
      "aria-controls": "pearcy-panel",
    });
    avatar.appendChild(h("span", { class: "pearcy-avatar__face", "aria-hidden": "true" }, "🍐"));

    var dismiss = h(
      "button",
      {
        id: "pearcy-dismiss",
        class: "pearcy-avatar__dismiss",
        type: "button",
        "aria-label": "Hide Pearcy",
      },
      "×"
    );

    // Restore pill (shown after the avatar is dismissed)
    var restore = h(
      "button",
      {
        id: "pearcy-restore",
        class: "pearcy-restore",
        type: "button",
        "aria-label": "Show Pearcy the shopping assistant",
        hidden: "",
      },
      "🍐 Chat"
    );

    // Chat panel
    var panel = h("section", {
      id: "pearcy-panel",
      class: "pearcy-panel",
      role: "dialog",
      "aria-label": "Chat with Pearcy",
      hidden: "",
    });

    var header = h("div", { class: "pearcy-panel__header" });
    var titleWrap = h("div", { class: "pearcy-panel__titles" });
    titleWrap.appendChild(h("span", { class: "pearcy-panel__title" }, "🍐 Pearcy"));
    titleWrap.appendChild(
      h("span", { class: "pearcy-panel__tagline" }, "Always ripe for a chat")
    );
    var closeBtn = h(
      "button",
      { class: "pearcy-panel__close", type: "button", "aria-label": "Close chat" },
      "×"
    );
    header.appendChild(titleWrap);
    header.appendChild(closeBtn);

    var messages = h("div", {
      id: "pearcy-messages",
      class: "pearcy-panel__messages",
      role: "log",
      "aria-live": "polite",
      "aria-label": "Conversation with Pearcy",
    });

    var typing = h("div", {
      id: "pearcy-typing",
      class: "pearcy-typing",
      "aria-live": "polite",
      "aria-label": "Pearcy is typing",
      hidden: "",
    });
    typing.appendChild(h("span", { class: "pearcy-typing__dot" }));
    typing.appendChild(h("span", { class: "pearcy-typing__dot" }));
    typing.appendChild(h("span", { class: "pearcy-typing__dot" }));

    var form = h("form", { id: "pearcy-form", class: "pearcy-panel__form" });
    var label = h(
      "label",
      { for: "pearcy-input", class: "pearcy-visually-hidden" },
      "Type your message to Pearcy"
    );
    var input = h("input", {
      id: "pearcy-input",
      class: "pearcy-panel__input",
      type: "text",
      autocomplete: "off",
      placeholder: "Ask Pearcy anything…",
      "aria-label": "Type your message to Pearcy",
    });
    var send = h(
      "button",
      { type: "submit", class: "pearcy-panel__send", "aria-label": "Send message" },
      "Send"
    );
    form.appendChild(label);
    form.appendChild(input);
    form.appendChild(send);

    panel.appendChild(header);
    panel.appendChild(messages);
    panel.appendChild(typing);
    panel.appendChild(form);

    // Avatar + dismiss live in a positioning wrapper so the dismiss control is
    // a sibling of the avatar (never a button nested inside a button).
    var avatarWrap = h("div", { class: "pearcy-avatar-wrap" });
    avatarWrap.appendChild(avatar);
    avatarWrap.appendChild(dismiss);

    root.appendChild(tip);
    root.appendChild(panel);
    root.appendChild(avatarWrap);
    root.appendChild(restore);
    document.body.appendChild(root);

    el = {
      root: root,
      tip: tip,
      tipText: tipText,
      tipDismiss: tipDismiss,
      tipOff: tipOff,
      avatar: avatar,
      avatarWrap: avatarWrap,
      dismiss: dismiss,
      restore: restore,
      panel: panel,
      close: closeBtn,
      messages: messages,
      typing: typing,
      form: form,
      input: input,
    };
  }

  // --- message rendering -----------------------------------------------------

  function appendMessage(role, text, asHTML) {
    var wrap = h("div", {
      class: "pearcy-msg pearcy-msg--" + role,
    });
    var bubble = h("div", { class: "pearcy-msg__bubble" });
    if (role === "pearcy") {
      bubble.setAttribute("aria-label", "Pearcy says");
    } else {
      bubble.setAttribute("aria-label", "You said");
    }
    if (asHTML) {
      bubble.innerHTML = text; // trusted templates only (never user input)
    } else {
      bubble.textContent = text; // user input — always escaped
    }
    wrap.appendChild(bubble);
    el.messages.appendChild(wrap);
    el.messages.scrollTop = el.messages.scrollHeight;
    return wrap;
  }

  function renderHistory() {
    var history = getHistory();
    el.messages.innerHTML = "";
    if (history.length === 0) {
      appendMessage(
        "pearcy",
        "Hi, I'm Pearcy! 🍐 Need a hand? I'm always ripe for a chat. Ask me for a " +
          "recommendation, a product question, or help finding your way around.",
        true
      );
      return;
    }
    history.forEach(function (turn) {
      // Pearcy turns were stored as HTML; user turns as plain text.
      appendMessage(turn.role, turn.text, turn.role === "pearcy");
    });
  }

  // --- animated states -------------------------------------------------------

  function setAvatarState(state) {
    el.avatar.classList.remove(
      "pearcy-avatar--idle",
      "pearcy-avatar--thinking",
      "pearcy-avatar--celebrating"
    );
    el.avatar.classList.add("pearcy-avatar--" + state);
  }

  var celebrateTimer = null;
  function celebrate() {
    if (!el.avatar) return;
    setAvatarState("celebrating");
    clearTimeout(celebrateTimer);
    celebrateTimer = setTimeout(function () {
      if (!el.avatar.classList.contains("pearcy-avatar--thinking")) {
        setAvatarState("idle");
      }
    }, 1600);
  }

  // --- open / close ----------------------------------------------------------

  function openPanel() {
    if (isOpen) return;
    isOpen = true;
    hideTip();
    el.panel.hidden = false;
    el.avatar.setAttribute("aria-expanded", "true");
    el.root.classList.add("pearcy-root--open");
    renderHistory();
    // Focus the input so keyboard users land in the right place.
    setTimeout(function () {
      el.input.focus();
    }, 0);
  }

  function closePanel(returnFocus) {
    if (!isOpen) return;
    isOpen = false;
    el.panel.hidden = true;
    el.avatar.setAttribute("aria-expanded", "false");
    el.root.classList.remove("pearcy-root--open");
    if (returnFocus !== false) el.avatar.focus();
  }

  function togglePanel() {
    if (isOpen) closePanel();
    else openPanel();
  }

  // --- sending ---------------------------------------------------------------

  var pending = false;

  function showTyping(on) {
    el.typing.hidden = !on;
    if (on) {
      setAvatarState("thinking");
      el.messages.scrollTop = el.messages.scrollHeight;
    }
  }

  function handleSubmit(e) {
    if (e) e.preventDefault();
    if (pending) return;
    var value = el.input.value.trim();
    if (!value) return;

    appendMessage("user", value, false);
    pushHistory("user", value);
    el.input.value = "";

    pending = true;
    el.input.setAttribute("disabled", "");
    showTyping(true);

    var history = getHistory();
    var transport = window.Pearcy.sendMessage || defaultSendMessage;

    Promise.resolve()
      .then(function () {
        return transport(value, history);
      })
      .then(function (reply) {
        showTyping(false);
        appendMessage("pearcy", reply, true);
        pushHistory("pearcy", reply);
        setAvatarState("idle");
      })
      .catch(function () {
        // Graceful fallback when the backend is unavailable.
        showTyping(false);
        var fallback =
          "Oh no — my fruit-brain is offline right now and I couldn't reach the " +
          "orchard. 🍐 Please try again in a moment!";
        appendMessage("pearcy", fallback, true);
        setAvatarState("idle");
      })
      .then(function () {
        pending = false;
        el.input.removeAttribute("disabled");
        if (isOpen) el.input.focus();
      });
  }

  // --- proactive tips --------------------------------------------------------

  function tipIndex() {
    // Rotate tips based on how many turns the user has had, so it varies.
    return getHistory().length % TIPS.length;
  }

  function showTip() {
    if (isOpen || flag(STORAGE.tipsOff) || flag(STORAGE.hidden)) return;
    el.tipText.textContent = TIPS[tipIndex()];
    el.tip.hidden = false;
    el.root.classList.add("pearcy-root--tip");
  }

  function hideTip() {
    el.tip.hidden = true;
    el.root.classList.remove("pearcy-root--tip");
  }

  function scheduleTip() {
    clearTimeout(tipTimer);
    if (flag(STORAGE.tipsOff) || flag(STORAGE.hidden)) return;
    // Delay is overridable (e.g. for tests) via window.PEARCY_TIP_DELAY_MS.
    var delay = typeof window.PEARCY_TIP_DELAY_MS === "number" ? window.PEARCY_TIP_DELAY_MS : TIP_DELAY_MS;
    tipTimer = setTimeout(showTip, delay);
  }

  // --- dismiss / restore -----------------------------------------------------

  function hideAvatar() {
    setFlag(STORAGE.hidden, true);
    closePanel(false);
    hideTip();
    clearTimeout(tipTimer);
    el.avatarWrap.hidden = true;
    el.restore.hidden = false;
    el.restore.focus();
  }

  function restoreAvatar() {
    setFlag(STORAGE.hidden, false);
    el.avatarWrap.hidden = false;
    el.restore.hidden = true;
    el.avatar.focus();
    scheduleTip();
  }

  // --- wiring ----------------------------------------------------------------

  function bindEvents() {
    el.avatar.addEventListener("click", function () {
      togglePanel();
    });
    el.dismiss.addEventListener("click", function (e) {
      e.stopPropagation(); // don't also toggle the panel
      hideAvatar();
    });
    el.restore.addEventListener("click", restoreAvatar);
    el.close.addEventListener("click", function () {
      closePanel();
    });
    el.form.addEventListener("submit", handleSubmit);

    el.tipDismiss.addEventListener("click", hideTip);
    el.tipOff.addEventListener("click", function () {
      setFlag(STORAGE.tipsOff, true);
      hideTip();
    });

    // Escape closes the panel and returns focus to the avatar.
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen) {
        closePanel();
      }
    });

    // Celebrate when something is added to the basket. shop.js exposes a
    // (patched) global addToBasket; wrap it so Pearcy reacts without coupling.
    if (typeof window.addToBasket === "function") {
      var prevAdd = window.addToBasket;
      window.addToBasket = function () {
        var result = prevAdd.apply(this, arguments);
        celebrate();
        return result;
      };
    }
  }

  // Public interface (swappable transport lives here).
  window.Pearcy = {
    sendMessage: null, // set to a function(message, history) => Promise<string>
    open: openPanel,
    close: closePanel,
    celebrate: celebrate,
    _mockReply: mockReply, // exposed for testing
  };
  // Use the mock unless a caller overrides it.
  window.Pearcy.sendMessage = defaultSendMessage;

  function init() {
    buildUI();
    bindEvents();
    if (flag(STORAGE.hidden)) {
      el.avatarWrap.hidden = true;
      el.restore.hidden = false;
    } else {
      scheduleTip();
    }
  }

  if (document.readyState !== "loading") {
    init();
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }
})();
