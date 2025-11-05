// Battle Items System
// Items can be bought from the shop and used in battle for strategic advantages

const ITEMS = {
  // Healing Items
  'health_potion': {
    id: 'health_potion',
    name: 'Health Potion',
    emoji: '🧪',
    description: 'Restores 50 HP',
    effect: { type: 'heal', value: 50 },
    cost: { coins: 100, gems: 0 },
    usableInBattle: true,
    category: 'healing'
  },
  'super_health_potion': {
    id: 'super_health_potion',
    name: 'Super Health Potion',
    emoji: '💊',
    description: 'Restores 100 HP',
    effect: { type: 'heal', value: 100 },
    cost: { coins: 250, gems: 0 },
    usableInBattle: true,
    category: 'healing'
  },
  'max_health_potion': {
    id: 'max_health_potion',
    name: 'Max Health Potion',
    emoji: '🍷',
    description: 'Fully restores HP',
    effect: { type: 'heal', value: 999 },
    cost: { coins: 0, gems: 5 },
    usableInBattle: true,
    category: 'healing'
  },

  // Energy Items
  'energy_drink': {
    id: 'energy_drink',
    name: 'Energy Drink',
    emoji: '🥤',
    description: 'Restores 25 energy',
    effect: { type: 'energy', value: 25 },
    cost: { coins: 150, gems: 0 },
    usableInBattle: true,
    category: 'energy'
  },
  'mega_energy_drink': {
    id: 'mega_energy_drink',
    name: 'Mega Energy Drink',
    emoji: '⚡',
    description: 'Restores 50 energy',
    effect: { type: 'energy', value: 50 },
    cost: { coins: 0, gems: 3 },
    usableInBattle: true,
    category: 'energy'
  },

  // Stat Boost Items (temporary buffs for battle)
  'attack_boost': {
    id: 'attack_boost',
    name: 'Attack Boost',
    emoji: '⚔️',
    description: 'Increases attack damage by 25% for 3 turns',
    effect: { type: 'buff', stat: 'attack', value: 1.25, duration: 3 },
    cost: { coins: 200, gems: 0 },
    usableInBattle: true,
    category: 'buff'
  },
  'defense_boost': {
    id: 'defense_boost',
    name: 'Defense Boost',
    emoji: '🛡️',
    description: 'Reduces incoming damage by 25% for 3 turns',
    effect: { type: 'buff', stat: 'defense', value: 0.75, duration: 3 },
    cost: { coins: 200, gems: 0 },
    usableInBattle: true,
    category: 'buff'
  },
  'critical_boost': {
    id: 'critical_boost',
    name: 'Critical Boost',
    emoji: '💫',
    description: 'Increases critical hit chance by 25% for 3 turns',
    effect: { type: 'buff', stat: 'critical', value: 25, duration: 3 },
    cost: { coins: 0, gems: 4 },
    usableInBattle: true,
    category: 'buff'
  },

  // Special Effect Items
  'cleanse': {
    id: 'cleanse',
    name: 'Cleanse',
    emoji: '✨',
    description: 'Removes all negative status effects',
    effect: { type: 'cleanse' },
    cost: { coins: 150, gems: 0 },
    usableInBattle: true,
    category: 'special'
  },
  'revive': {
    id: 'revive',
    name: 'Revive',
    emoji: '💚',
    description: 'Revives character with 50% HP (can only be used once per battle)',
    effect: { type: 'revive', value: 0.5 },
    cost: { coins: 0, gems: 10 },
    usableInBattle: true,
    category: 'special'
  }
};

// Get all items by category
function getItemsByCategory(category) {
  return Object.values(ITEMS).filter(item => item.category === category);
}

// Get item by ID
function getItem(itemId) {
  return ITEMS[itemId] || null;
}

// Get all shop items
function getAllShopItems() {
  return Object.values(ITEMS);
}

// Check if user can afford item
function canAffordItem(user, itemId) {
  const item = getItem(itemId);
  if (!item) return false;
  
  const hasCoins = user.coins >= item.cost.coins;
  const hasGems = user.gems >= item.cost.gems;
  
  return hasCoins && hasGems;
}

// Purchase item
function purchaseItem(user, itemId) {
  const item = getItem(itemId);
  if (!item) return { success: false, message: 'Item not found!' };
  
  if (!canAffordItem(user, itemId)) {
    return { 
      success: false, 
      message: `You don't have enough! Need: ${item.cost.coins} coins ${item.cost.gems > 0 ? `and ${item.cost.gems} gems` : ''}`
    };
  }
  
  // Deduct cost
  user.coins -= item.cost.coins;
  user.gems -= item.cost.gems;
  
  // Initialize inventory if needed
  if (!user.inventory) {
    user.inventory = {};
  }
  
  // Add item to inventory
  if (!user.inventory[itemId]) {
    user.inventory[itemId] = 0;
  }
  user.inventory[itemId]++;
  
  return { 
    success: true, 
    message: `Purchased ${item.emoji} **${item.name}**! You now have ${user.inventory[itemId]}.`
  };
}

// Use item (returns effect to apply)
function useItem(user, itemId) {
  if (!user.inventory || !user.inventory[itemId] || user.inventory[itemId] <= 0) {
    return { success: false, message: 'You don\'t have that item!' };
  }
  
  const item = getItem(itemId);
  if (!item) {
    return { success: false, message: 'Item not found!' };
  }
  
  // Deduct item from inventory
  user.inventory[itemId]--;
  
  return { 
    success: true, 
    item: item,
    effect: item.effect,
    message: `Used ${item.emoji} **${item.name}**!`
  };
}

// Get user's battle items
function getUserBattleItems(user) {
  if (!user.inventory) return [];
  
  const battleItems = [];
  for (const [itemId, count] of Object.entries(user.inventory)) {
    if (count > 0) {
      const item = getItem(itemId);
      if (item && item.usableInBattle) {
        battleItems.push({
          ...item,
          count: count
        });
      }
    }
  }
  
  return battleItems;
}

module.exports = {
  ITEMS,
  getItem,
  getAllShopItems,
  getItemsByCategory,
  canAffordItem,
  purchaseItem,
  useItem,
  getUserBattleItems
};
