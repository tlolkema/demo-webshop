const PRODUCTS = {
  apple: { name: "Apple", emoji: "🍏" },
  banana: { name: "Banana", emoji: "🍌" },
  lemon: { name: "Lemon", emoji: "🍋" },
  tree: { name: "Banana Tree", emoji: "🌴" },
  trophy: { name: "Victory Trophy", emoji: "🏆" },
};

// Game opponents for each level
const OPPONENTS = {
  1: { name: "Weak Grape", emoji: "🍇", health: 30, attack: 5 },
  2: { name: "Cherry Fighter", emoji: "🍒", health: 50, attack: 8 },
  3: { name: "Orange Warrior", emoji: "🍊", health: 70, attack: 12 },
  4: { name: "Watermelon Tank", emoji: "🍉", health: 100, attack: 15 },
  5: { name: "Banana Tree Boss", emoji: "🌴", health: 150, attack: 20 },
};

// Game state management
function getGameState() {
  try {
    const state = localStorage.getItem("gameState");
    if (!state) {
      return {
        level: 1,
        playerHealth: 100,
        maxPlayerHealth: 100,
        playerAttack: 15,
        currentOpponentHealth: null,
        hasCompletedGame: false,
      };
    }
    return JSON.parse(state);
  } catch (error) {
    console.warn("Error parsing game state:", error);
    return {
      level: 1,
      playerHealth: 100,
      maxPlayerHealth: 100,
      playerAttack: 15,
      currentOpponentHealth: null,
      hasCompletedGame: false,
    };
  }
}

function saveGameState(state) {
  localStorage.setItem("gameState", JSON.stringify(state));
}

function resetGame() {
  const state = {
    level: 1,
    playerHealth: 100,
    maxPlayerHealth: 100,
    playerAttack: 15,
    currentOpponentHealth: null,
    hasCompletedGame: false,
  };
  saveGameState(state);
  return state;
}

// Battle system
function startBattle(productType) {
  const gameState = getGameState();
  
  if (gameState.hasCompletedGame) {
    // If game is complete, just add to basket
    addToBasket(productType);
    return;
  }
  
  // Initialize opponent health if not set
  const opponent = OPPONENTS[gameState.level];
  if (gameState.currentOpponentHealth === null) {
    gameState.currentOpponentHealth = opponent.health;
    saveGameState(gameState);
  }
  
  // Show battle modal
  showBattleModal(productType);
}

function playerAttack() {
  const gameState = getGameState();
  const opponent = OPPONENTS[gameState.level];
  
  // Player attacks
  const damage = gameState.playerAttack + Math.floor(Math.random() * 10) - 5; // Random variance
  gameState.currentOpponentHealth -= Math.max(1, damage);
  
  // Check if opponent is defeated
  if (gameState.currentOpponentHealth <= 0) {
    gameState.level++;
    gameState.currentOpponentHealth = null;
    
    // Heal player a bit and increase stats
    gameState.playerHealth = Math.min(gameState.maxPlayerHealth, gameState.playerHealth + 30);
    gameState.playerAttack += 3;
    
    // Check if game is complete
    if (gameState.level > 5) {
      gameState.hasCompletedGame = true;
      gameState.level = 5; // Cap at 5
      
      // Add trophy to basket
      const basket = getBasket();
      basket.push("trophy");
      localStorage.setItem("basket", JSON.stringify(basket));
      
      saveGameState(gameState);
      showVictoryMessage();
      return;
    }
    
    saveGameState(gameState);
    showLevelUpMessage();
    return;
  }
  
  // Opponent counter-attacks
  const opponentDamage = opponent.attack + Math.floor(Math.random() * 6) - 3;
  gameState.playerHealth -= Math.max(1, opponentDamage);
  
  // Check if player is defeated
  if (gameState.playerHealth <= 0) {
    gameState.playerHealth = gameState.maxPlayerHealth;
    gameState.currentOpponentHealth = opponent.health;
    saveGameState(gameState);
    showDefeatMessage();
    return;
  }
  
  saveGameState(gameState);
  updateBattleUI();
}

function showBattleModal(productType) {
  const gameState = getGameState();
  const opponent = OPPONENTS[gameState.level];
  
  const modal = document.createElement("div");
  modal.className = "battle-modal";
  modal.id = "battleModal";
  
  modal.innerHTML = `
    <div class="battle-content">
      <h2>⚔️ Battle - Level ${gameState.level}/5 ⚔️</h2>
      <div class="battle-arena">
        <div class="player-section">
          <div class="fighter-emoji">🥊</div>
          <div class="fighter-name">You</div>
          <div class="health-bar-container">
            <div class="health-bar" id="playerHealthBar" style="width: ${(gameState.playerHealth / gameState.maxPlayerHealth) * 100}%"></div>
          </div>
          <div class="health-text">${gameState.playerHealth}/${gameState.maxPlayerHealth} HP</div>
          <div class="attack-text">⚡ ${gameState.playerAttack} ATK</div>
        </div>
        
        <div class="vs-text">VS</div>
        
        <div class="opponent-section">
          <div class="fighter-emoji">${opponent.emoji}</div>
          <div class="fighter-name">${opponent.name}</div>
          <div class="health-bar-container">
            <div class="health-bar enemy-health" id="opponentHealthBar" style="width: ${(gameState.currentOpponentHealth / opponent.health) * 100}%"></div>
          </div>
          <div class="health-text">${gameState.currentOpponentHealth}/${opponent.health} HP</div>
          <div class="attack-text">⚡ ${opponent.attack} ATK</div>
        </div>
      </div>
      
      <div class="battle-log" id="battleLog"></div>
      
      <div class="battle-buttons">
        <button onclick="playerAttack()" class="attack-btn">⚔️ Attack!</button>
        <button onclick="closeBattleModal()" class="flee-btn">🏃 Flee</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

function updateBattleUI() {
  const gameState = getGameState();
  const opponent = OPPONENTS[gameState.level];
  
  const playerHealthBar = document.getElementById("playerHealthBar");
  const opponentHealthBar = document.getElementById("opponentHealthBar");
  
  if (playerHealthBar) {
    playerHealthBar.style.width = `${(gameState.playerHealth / gameState.maxPlayerHealth) * 100}%`;
    playerHealthBar.parentElement.nextElementSibling.textContent = `${gameState.playerHealth}/${gameState.maxPlayerHealth} HP`;
  }
  
  if (opponentHealthBar) {
    opponentHealthBar.style.width = `${(gameState.currentOpponentHealth / opponent.health) * 100}%`;
    opponentHealthBar.parentElement.nextElementSibling.textContent = `${gameState.currentOpponentHealth}/${opponent.health} HP`;
  }
}

function showLevelUpMessage() {
  const gameState = getGameState();
  const modal = document.getElementById("battleModal");
  
  if (modal) {
    const nextOpponent = OPPONENTS[gameState.level];
    modal.innerHTML = `
      <div class="battle-content victory-screen">
        <h2>🎉 Victory! 🎉</h2>
        <p class="victory-text">You defeated the opponent and reached Level ${gameState.level}!</p>
        <p class="stats-text">💪 Your attack increased to ${gameState.playerAttack}!</p>
        <p class="stats-text">❤️ You recovered 30 HP!</p>
        ${gameState.level <= 5 ? `<p class="next-opponent">Next opponent: ${nextOpponent.emoji} ${nextOpponent.name}</p>` : ''}
        <button onclick="closeBattleModal()" class="continue-btn">Continue Shopping</button>
      </div>
    `;
  }
}

function showVictoryMessage() {
  const modal = document.getElementById("battleModal");
  
  if (modal) {
    modal.innerHTML = `
      <div class="battle-content victory-screen final-victory">
        <h2>🏆 CONGRATULATIONS! 🏆</h2>
        <p class="victory-text big">You've defeated all opponents!</p>
        <p class="victory-text">You reached Level 5 and earned a trophy!</p>
        <p class="victory-text">You can now add items to your basket!</p>
        <div class="trophy-display">🏆</div>
        <button onclick="closeBattleModal()" class="continue-btn">Start Shopping!</button>
      </div>
    `;
  }
}

function showDefeatMessage() {
  const modal = document.getElementById("battleModal");
  
  if (modal) {
    modal.innerHTML = `
      <div class="battle-content defeat-screen">
        <h2>💥 Defeated! 💥</h2>
        <p class="defeat-text">You were knocked out! Your health has been restored.</p>
        <p class="defeat-text">Try again and victory will be yours!</p>
        <button onclick="closeBattleModal()" class="continue-btn">Try Again</button>
      </div>
    `;
  }
}

function closeBattleModal() {
  const modal = document.getElementById("battleModal");
  if (modal) {
    modal.remove();
  }
  renderBasketIndicator();
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
  const gameState = getGameState();
  
  // Can only add to basket after completing the game (reaching level 5)
  if (!gameState.hasCompletedGame) {
    alert("You must complete all 5 levels before you can shop! Battle the fruits to progress.");
    return;
  }
  
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
