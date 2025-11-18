// Equipment System - Inventory management, leveling, and equipping
const { 
  EQUIPMENT_ITEMS, 
  calculateItemLevel, 
  getProgressToNextLevel, 
  getEquipmentItem,
  getItemsByTier,
  getTierEmoji
} = require('./equipmentConfig.js');
const { createLevelProgressBar } = require('./progressBar.js');

// Initialize item collection for a user
function initializeItemCollection(user) {
  if (!user.itemCollection) {
    user.itemCollection = {};
  }
  return user.itemCollection;
}

// Initialize equipment for a character
function initializeCharacterEquipment(character) {
  if (!character.equipment) {
    character.equipment = {
      silver: null,
      gold: null,
      legendary: null
    };
  }
  
  // Ensure character has a unique ID
  if (!character.id) {
    character.id = `${character.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  return character.equipment;
}

// Grant an item to a user (called when found in crate)
function grantItem(user, itemId) {
  const item = getEquipmentItem(itemId);
  if (!item) {
    return {
      success: false,
      message: `Invalid item ID: ${itemId}`
    };
  }
  
  initializeItemCollection(user);
  
  // Initialize item if not owned
  if (!user.itemCollection[itemId]) {
    user.itemCollection[itemId] = {
      tier: item.tier,
      copies: 0,
      level: 1,
      firstObtained: Date.now()
    };
  }
  
  // Add copy
  user.itemCollection[itemId].copies += 1;
  const newCopies = user.itemCollection[itemId].copies;
  
  // Calculate new level
  const oldLevel = user.itemCollection[itemId].level;
  const newLevel = calculateItemLevel(item.tier, newCopies);
  user.itemCollection[itemId].level = newLevel;
  
  const leveledUp = newLevel > oldLevel;
  
  return {
    success: true,
    itemId,
    item,
    copies: newCopies,
    level: newLevel,
    leveledUp,
    oldLevel
  };
}

// Equip an item to a character
function equipItem(user, characterName, itemId) {
  const item = getEquipmentItem(itemId);
  if (!item) {
    return {
      success: false,
      message: `❌ Invalid item!`
    };
  }
  
  // Check if user owns the item
  initializeItemCollection(user);
  if (!user.itemCollection[itemId] || user.itemCollection[itemId].copies === 0) {
    return {
      success: false,
      message: `❌ You don't own **${item.emoji} ${item.name}**!`
    };
  }
  
  // Find character
  const character = user.characters.find(c => c.name.toLowerCase() === characterName.toLowerCase());
  if (!character) {
    return {
      success: false,
      message: `❌ Character **${characterName}** not found!`
    };
  }
  
  // Initialize equipment
  initializeCharacterEquipment(character);
  
  // Get tier slot
  const slot = item.tier;
  
  // Check if already equipped
  if (character.equipment[slot] === itemId) {
    return {
      success: false,
      message: `❌ **${item.emoji} ${item.name}** is already equipped to ${character.emoji} ${character.name}!`
    };
  }
  
  // Get previously equipped item
  const previousItem = character.equipment[slot] ? getEquipmentItem(character.equipment[slot]) : null;
  
  // Equip the item
  character.equipment[slot] = itemId;
  
  const level = user.itemCollection[itemId].level;
  
  return {
    success: true,
    message: `✅ Equipped **${item.emoji} ${item.name}** (Lv.${level}) to ${character.emoji} **${character.name}**!${previousItem ? `\n⚠️ Replaced ${previousItem.emoji} ${previousItem.name}` : ''}`,
    item,
    character,
    previousItem,
    level
  };
}

// Unequip an item from a character
function unequipItem(user, characterName, tier) {
  // Find character
  const character = user.characters.find(c => c.name.toLowerCase() === characterName.toLowerCase());
  if (!character) {
    return {
      success: false,
      message: `❌ Character **${characterName}** not found!`
    };
  }
  
  // Initialize equipment
  initializeCharacterEquipment(character);
  
  // Validate tier
  if (!['silver', 'gold', 'legendary'].includes(tier.toLowerCase())) {
    return {
      success: false,
      message: `❌ Invalid tier! Use: silver, gold, or legendary`
    };
  }
  
  const slot = tier.toLowerCase();
  
  // Check if something is equipped
  if (!character.equipment[slot]) {
    return {
      success: false,
      message: `❌ No ${getTierEmoji(slot)} **${slot}** item equipped on ${character.emoji} ${character.name}!`
    };
  }
  
  const itemId = character.equipment[slot];
  const item = getEquipmentItem(itemId);
  
  // Unequip
  character.equipment[slot] = null;
  
  return {
    success: true,
    message: `✅ Unequipped **${item.emoji} ${item.name}** from ${character.emoji} **${character.name}**!`,
    item,
    character
  };
}

// Get all items owned by a user
function getUserItems(user) {
  initializeItemCollection(user);
  
  const items = [];
  
  for (const [itemId, data] of Object.entries(user.itemCollection)) {
    const item = getEquipmentItem(itemId);
    if (item && data.copies > 0) {
      items.push({
        ...item,
        copies: data.copies,
        level: data.level,
        firstObtained: data.firstObtained
      });
    }
  }
  
  // Sort by tier (legendary > gold > silver) then by level
  const tierOrder = { legendary: 3, gold: 2, silver: 1 };
  items.sort((a, b) => {
    if (tierOrder[a.tier] !== tierOrder[b.tier]) {
      return tierOrder[b.tier] - tierOrder[a.tier];
    }
    return b.level - a.level;
  });
  
  return items;
}

// Get equipped items for a character
function getCharacterEquipment(user, character) {
  initializeItemCollection(user);
  initializeCharacterEquipment(character);
  
  const equipped = {
    silver: null,
    gold: null,
    legendary: null
  };
  
  for (const [slot, itemId] of Object.entries(character.equipment)) {
    if (itemId && user.itemCollection[itemId]) {
      const item = getEquipmentItem(itemId);
      if (item) {
        equipped[slot] = {
          ...item,
          level: user.itemCollection[itemId].level,
          copies: user.itemCollection[itemId].copies
        };
      }
    }
  }
  
  return equipped;
}

// Format item display
function formatItemDisplay(item, userData = null) {
  let display = `${item.emoji} **${item.name}** ${getTierEmoji(item.tier)}`;
  
  if (userData) {
    const level = userData.level || item.level || 1;
    const copies = userData.copies || item.copies || 1;
    display += ` **Lv.${level}**`;
    
    const progress = getProgressToNextLevel(item.tier, copies);
    if (!progress.maxLevel) {
      const progressBar = createLevelProgressBar(progress.current, progress.needed);
      display += `\n${progressBar} (${copies} copies)`;
    } else {
      display += ` ⭐ MAX`;
    }
    
    display += `\n${item.detailedDescription(level)}`;
  } else {
    display += `\n${item.description}`;
  }
  
  return display;
}

// Format equipment overview for a character
function formatCharacterEquipment(user, character) {
  const equipment = getCharacterEquipment(user, character);
  
  let display = `**${character.emoji} ${character.name}'s Equipment**\n\n`;
  
  const slots = ['legendary', 'gold', 'silver'];
  let hasAny = false;
  
  for (const slot of slots) {
    const item = equipment[slot];
    display += `${getTierEmoji(slot)} **${slot.charAt(0).toUpperCase() + slot.slice(1)}**: `;
    
    if (item) {
      display += `${item.emoji} ${item.name} (Lv.${item.level})\n`;
      hasAny = true;
    } else {
      display += `*Empty*\n`;
    }
  }
  
  if (!hasAny) {
    display += `\n💡 Use \`!equip ${character.name} <item_name>\` to equip items!`;
  }
  
  return display;
}

// Format all items inventory
function formatItemsInventory(user) {
  const items = getUserItems(user);
  
  if (items.length === 0) {
    return `📦 **Your Item Collection**\n\nYou don't have any items yet!\nOpen crates to find equipment items.`;
  }
  
  let display = `📦 **Your Item Collection** (${items.length} unique items)\n\n`;
  
  const byTier = {
    legendary: [],
    gold: [],
    silver: []
  };
  
  for (const item of items) {
    byTier[item.tier].push(item);
  }
  
  for (const tier of ['legendary', 'gold', 'silver']) {
    if (byTier[tier].length > 0) {
      display += `${getTierEmoji(tier)} **${tier.toUpperCase()} ITEMS**\n`;
      for (const item of byTier[tier]) {
        const progress = getProgressToNextLevel(tier, item.copies);
        const progressBar = createLevelProgressBar(progress.current, progress.needed);
        
        display += `${item.emoji} **${item.name}** - Lv.${item.level}`;
        if (!progress.maxLevel) {
          display += ` (${item.copies} copies)\n  ${progressBar}\n`;
        } else {
          display += ` ⭐ MAX\n`;
        }
        display += `  ${item.detailedDescription(item.level)}\n\n`;
      }
    }
  }
  
  display += `\n💡 Use \`!equip <character> <item>\` to equip items to your characters!`;
  
  return display;
}

module.exports = {
  initializeItemCollection,
  initializeCharacterEquipment,
  grantItem,
  equipItem,
  unequipItem,
  getUserItems,
  getCharacterEquipment,
  formatItemDisplay,
  formatCharacterEquipment,
  formatItemsInventory
};
