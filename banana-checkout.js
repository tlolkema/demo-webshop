// Banana checkout gate (ticket #77)
// A cartoon banana lounges across the checkout button and refuses to move
// until the user says something nice. Pure client-side comedic negotiation.
(function () {
  "use strict";

  // Words the banana finds genuinely flattering.
  const FLATTERING = [
    "beautiful", "gorgeous", "king", "queen", "smooth", "a-peel-ing",
    "appealing", "handsome", "stunning", "magnificent", "perfect", "amazing",
    "radiant", "glorious", "majestic", "sexy", "elegant", "charming",
    "brilliant", "wonderful", "fabulous", "incredible", "divine", "stylish",
    "legend", "icon", "dreamy", "adorable", "flawless", "delicious",
  ];

  // Weak, low-effort praise. Passable but the banana wants more.
  const WEAK = [
    "nice", "good", "ok", "okay", "fine", "cool", "alright", "decent",
    "sure", "great", "neat", "yeah",
  ];

  // Things that offend the banana.
  const INSULTS = [
    "no", "ugly", "gross", "stupid", "hate", "boring", "dumb", "lame",
    "rotten", "mushy", "bad", "worst", "yuck", "ew", "meh", "slippery",
    "smelly", "gross", "trash", "garbage", "nope", "banana bad",
  ];

  // How many rejections before the banana caves out of pure exhaustion.
  const BREAKING_POINT = 6;

  const said = new Set(); // compliments already used (normalized)
  let rejections = 0; // total failed attempts, drives the breaking point
  let unlocked = false;

  function normalize(s) {
    return s.trim().toLowerCase();
  }

  function containsAny(text, list) {
    return list.some((w) => text.includes(w));
  }

  // Crude keyboard-mash detector: no spaces, has letters, but no vowels,
  // or the same character hammered several times in a row.
  function isMash(text) {
    if (/(.)\1{3,}/.test(text)) return true; // "aaaa", "!!!!"
    const letters = text.replace(/[^a-z]/g, "");
    if (letters.length >= 4 && !/[aeiou]/.test(letters)) return true;
    return false;
  }

  // Decide the banana's reaction to a compliment.
  // Returns { pass: bool, mood: string, text: string }
  function judge(raw) {
    const text = normalize(raw);

    if (text.length === 0) {
      return {
        pass: false,
        mood: "offended",
        text: "🍌 Silence? You expect me to move for *nothing*?",
      };
    }

    // Exhausted surrender — persistence pays off, even with weak effort.
    if (rejections >= BREAKING_POINT) {
      return {
        pass: true,
        mood: "caved",
        text: "🍌 FINE. FINE. Just go. I'm exhausted.",
      };
    }

    if (isMash(text)) {
      return {
        pass: false,
        mood: "offended",
        text: "🍌 Keyboard mashing? Wow. In THIS economy?",
      };
    }

    if (containsAny(text, INSULTS)) {
      return {
        pass: false,
        mood: "offended",
        text: "🍌 Wow. In THIS economy? Try again, and be kind.",
      };
    }

    // Repeated compliment — the banana has a memory.
    if (said.has(text)) {
      return {
        pass: false,
        mood: "unimpressed",
        text: "🍌 You already said that. I'm a banana, not a fool.",
      };
    }

    const flattering = containsAny(text, FLATTERING);

    // Rare hard-to-get moment (~1 in 20), never on a caved banana.
    if (Math.random() < 0.05) {
      return {
        pass: false,
        mood: "coy",
        text: "🍌 Hmm. Ask me again.",
      };
    }

    if (flattering) {
      return {
        pass: true,
        mood: "delighted",
        text: "🍌 Oh, you mean that? ...You may pass.",
      };
    }

    if (containsAny(text, WEAK)) {
      return {
        pass: false,
        mood: "unimpressed",
        text: "🍌 ...That's it? That's all I get? Step it up.",
      };
    }

    // Any other genuine effort — baseline success.
    return {
      pass: true,
      mood: "satisfied",
      text: "🍌 finally, some recognition.",
    };
  }

  function sparkle(guard) {
    for (let i = 0; i < 8; i++) {
      const s = document.createElement("span");
      s.className = "banana-sparkle";
      s.textContent = "✨";
      s.style.setProperty("--angle", (i / 8) * 360 + "deg");
      guard.appendChild(s);
      setTimeout(() => s.remove(), 800);
    }
  }

  function init() {
    const form = document.getElementById("checkoutForm");
    if (!form) return;
    const submitBtn = form.querySelector('button[type="submit"]');
    if (!submitBtn) return;

    // Block checkout until the banana is satisfied.
    submitBtn.disabled = true;

    const gate = document.createElement("div");
    gate.className = "banana-gate";
    gate.innerHTML =
      '<div class="banana-guard" id="bananaGuard" aria-hidden="true">🍌</div>' +
      '<p class="banana-speech" id="bananaSpeech" role="status" aria-live="polite">' +
      "The banana requires a compliment to proceed.</p>" +
      '<div class="banana-input-row">' +
      '<input type="text" id="bananaInput" autocomplete="off" ' +
      'aria-label="Compliment the banana" placeholder="Say something nice..." />' +
      '<button type="button" id="bananaSubmit" class="cart-action-btn">Say it</button>' +
      "</div>";

    // Drape the banana across the checkout button.
    submitBtn.parentNode.insertBefore(gate, submitBtn);

    const guard = gate.querySelector("#bananaGuard");
    const speech = gate.querySelector("#bananaSpeech");
    const input = gate.querySelector("#bananaInput");
    const sayBtn = gate.querySelector("#bananaSubmit");

    function react() {
      if (unlocked) return;
      const raw = input.value;
      const result = judge(raw);

      speech.textContent = result.text;
      guard.className = "banana-guard mood-" + result.mood;

      if (result.pass) {
        unlocked = true;
        submitBtn.disabled = false;
        if (result.mood === "delighted") sparkle(guard);
        // Banana slides aside, gate fades out, checkout revealed.
        gate.classList.add("banana-passed");
        input.disabled = true;
        sayBtn.disabled = true;
        setTimeout(() => submitBtn.focus(), 400);
      } else {
        if (normalize(raw).length > 0 && !isMash(normalize(raw))) {
          said.add(normalize(raw));
        }
        rejections++;
        // A little offended shake.
        guard.classList.remove("banana-shake");
        void guard.offsetWidth; // restart animation
        guard.classList.add("banana-shake");
        input.select();
      }
    }

    sayBtn.addEventListener("click", react);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        react();
      }
    });
  }

  if (document.readyState !== "loading") {
    init();
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }
})();
