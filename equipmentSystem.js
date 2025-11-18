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

// Migrate user's old equipment collection to character-specific storage
// IDEMPOTENT: Safe to call multiple times
function migrateUserEquipment(user) {
  if (!user.itemCollection || Object.keys(user.itemCollection).length === 0) {
    return false; // Nothing to migrate
  }
  
  if (!user.characters || user.characters.length === 0) {
    return false; // No characters to migrate to (will retry when they get characters)
  }
  
  let migrated = false;
  
  // Distribute ALL existing equipment to ALL owned characters
  // This ensures no user loses their equipment during migration
  for (const character of user.characters) {
    initializeCharacterEquipment(character);
    
    // Copy all items from user.itemCollection to this character's collection
    for (const [itemId, itemData] of Object.entries(user.itemCollection)) {
      if (!character.equipment.collection[itemId]) {
        character.equipment.collection[itemId] = {
          tier: itemData.tier,
          copies: itemData.copies,
          level: itemData.level,
          firstObtained: itemData.firstObtained || Date.now()
        };
        migrated = true;
      }
    }
    
    // Migrate equipped items slots
    if (!character.equipment.slots) {
      character.equipment.slots = {
        silver: character.equipment.silver || null,
        gold: character.equipment.gold || null,
        legendary: character.equipment.legendary || null
      };
      
      // Clean up old slot references
      delete character.equipment.silver;
      delete character.equipment.gold;
      delete character.equipment.legendary;
      migrated = true;
    }
  }
  
  // KEEP user.itemCollection as backup - don't delete it yet
  // Mark as migrated so we know migration happened
  if (migrated) {
    user.equipmentMigrated = true;
  }
  
  return migrated;
}

// Initialize equipment for a character (CHARACTER-SPECIFIC SYSTEM)
function initializeCharacterEquipment(character) {
  if (!character.equipment) {
    character.equipment = {
      collection: {}, // Character-specific equipment inventory
      equipped: null  // Single equipped item (itemId)
    };
  }
  
  // Ensure old structure compatibility - migrate from multi-slot to single-slot
  if (!character.equipment.collection) {
    character.equipment.collection = {};
  }
  
  // Migrate from old multi-slot system to new single-slot system
  if (character.equipment.slots && typeof character.equipment.equipped === 'undefined') {
    // Pick the first non-null item from old slots (priority: legendary > gold > silver)
    const oldSlots = character.equipment.slots;
    character.equipment.equipped = oldSlots.legendary || oldSlots.gold || oldSlots.silver || null;
    delete character.equipment.slots;
  } else if (!character.equipment.hasOwnProperty('equipped')) {
    // Migrate very old structure with direct slot properties
    const oldEquipment = { ...character.equipment };
    character.equipment.equipped = oldEquipment.legendary || oldEquipment.gold || oldEquipment.silver || null;
    
    // Clean up old slot references
    delete character.equipment.silver;
    delete character.equipment.gold;
    delete character.equipment.legendary;
    delete character.equipment.slots;
  }
  
  // Ensure character has a unique ID
  if (!character.id) {
    character.id = `${character.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  return character.equipment;
}

// Grant an item to a CHARACTER (called when found in crate or admin grant)
function grantItem(character, itemId) {
  const item = getEquipmentItem(itemId);
  if (!item) {
    return {
      success: false,
      message: `Invalid item ID: ${itemId}`
    };
  }
  
  initializeCharacterEquipment(character);
  
  // Initialize item if not owned by this character
  if (!character.equipment.collection[itemId]) {
    character.equipment.collection[itemId] = {
      tier: item.tier,
      copies: 0,
      level: 1,
      firstObtained: Date.now()
    };
  }
  
  // Add copy to this character
  character.equipment.collection[itemId].copies += 1;
  const newCopies = character.equipment.collection[itemId].copies;
  
  // Calculate new level
  const oldLevel = character.equipment.collection[itemId].level;
  const newLevel = calculateItemLevel(item.tier, newCopies);
  character.equipment.collection[itemId].level = newLevel;
  
  const leveledUp = newLevel > oldLevel;
  
  return {
    success: true,
    itemId,
    item,
    copies: newCopies,
    level: newLevel,
    leveledUp,
    oldLevel,
    character
  };
}

// Equip an item to a character (from their CHARACTER-SPECIFIC collection)
function equipItem(user, characterName, itemId) {
  const item = getEquipmentItem(itemId);
  if (!item) {
    return {
      success: false,
      message: `❌ Invalid item!`
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
  
  // Check if THIS CHARACTER owns the item
  if (!character.equipment.collection[itemId] || character.equipment.collection[itemId].copies === 0) {
    return {
      success: false,
      message: `❌ ${character.emoji} **${character.name}** doesn't own **${item.emoji} ${item.name}**!\nEquipment is character-specific and cannot be shared.`
    };
  }
  
  // Check if already equipped
  if (character.equipment.equipped === itemId) {
    return {
      success: false,
      message: `❌ **${item.emoji} ${item.name}** is already equipped to ${character.emoji} ${character.name}!`
    };
  }
  
  // Get previously equipped item
  const previousItem = character.equipment.equipped ? getEquipmentItem(character.equipment.equipped) : null;
  
  // Equip the item (only one item can be equipped at a time)
  character.equipment.equipped = itemId;
  
  const level = character.equipment.collection[itemId].level;
  
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
function unequipItem(user, characterName) {
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
  
  // Check if something is equipped
  if (!character.equipment.equipped) {
    return {
      success: false,
      message: `❌ No item equipped on ${character.emoji} ${character.name}!`
    };
  }
  
  const itemId = character.equipment.equipped;
  const item = getEquipmentItem(itemId);
  
  // Unequip
  character.equipment.equipped = null;
  
  return {
    success: true,
    message: `✅ Unequipped **${item.emoji} ${item.name}** from ${character.emoji} **${character.name}**!`,
    item,
    character
  };
}

// Get all items owned by a CHARACTER
function getCharacterItems(character) {
  initializeCharacterEquipment(character);
  
  const items = [];
  
  for (const [itemId, data] of Object.entries(character.equipment.collection)) {
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

// Get equipped item for a character (single item system)
function getCharacterEquipment(user, character) {
  initializeCharacterEquipment(character);
  
  const itemId = character.equipment.equipped;
  
  if (!itemId) {
    return null;
  }
  
  const itemData = character.equipment.collection[itemId];
  
  // Only return if character actually owns copies
  if (!itemData || itemData.copies === 0) {
    character.equipment.equipped = null; // Clean up invalid reference
    return null;
  }
  
  const item = getEquipmentItem(itemId);
  if (!item) {
    character.equipment.equipped = null; // Clean up invalid reference
    return null;
  }
  
  return {
    ...item,
    level: itemData.level,
    copies: itemData.copies
  };
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
  
  if (equipment) {
    display += `${getTierEmoji(equipment.tier)} ${equipment.emoji} **${equipment.name}** (Lv.${equipment.level})\n`;
    display += `${equipment.detailedDescription(equipment.level)}\n`;
  } else {
    display += `*No equipment equipped*\n`;
    display += `\n💡 Use \`!equip ${character.name} <item_name>\` to equip an item!`;
  }
  
  return display;
}

// Format character-specific items inventory
function formatCharacterInventory(character) {
  const items = getCharacterItems(character);
  
  if (items.length === 0) {
    return `📦 **${character.emoji} ${character.name}'s Equipment**\n\nThis character doesn't have any equipment yet!\nOpen crates to find equipment for your characters.`;
  }
  
  let display = `📦 **${character.emoji} ${character.name}'s Equipment** (${items.length} unique items)\n\n`;
  
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
  
  display += `\n💡 Use \`!equip ${character.name} <item>\` to equip items!`;
  
  return display;
}

module.exports = {
  migrateUserEquipment,
  initializeCharacterEquipment,
  grantItem,
  equipItem,
  unequipItem,
  getCharacterItems,
  getCharacterEquipment,
  formatItemDisplay,
  formatCharacterEquipment,
  formatCharacterInventory
};
