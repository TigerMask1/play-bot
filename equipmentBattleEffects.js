// Equipment Battle Effects - Handles all item effects during battles
const { getEquipmentItem } = require('./equipmentConfig.js');
const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

// Prepare equipment state for battle (CHARACTER-SPECIFIC SYSTEM - SINGLE SLOT)
function prepareBattleEquipment(battle, playerSlot, user, character) {
  // ON-DEMAND MIGRATION: Ensure equipment is migrated before battle
  const { migrateUserEquipment, initializeCharacterEquipment } = require('./equipmentSystem.js');
  migrateUserEquipment(user);
  initializeCharacterEquipment(character);
  
  if (!character.equipment || !character.equipment.collection) {
    return null;
  }
  
  const state = {
    // Med-Drop tracking
    medDropUsed: false,
    medDropHealAmount: 0,
    
    // Vanish-Ring tracking  
    vanishRingActive: true,
    
    // Leech-Suck tracking
    leechSuckAvailable: false,
    leechSuckUsed: false,
    
    // Mist-Dodge tracking
    mistDodgeAvailable: false,
    mistDodgeActive: false,
    mistDodgeUsed: false,
    
    // Fire-Fang tracking
    fireFangAvailable: false,
    fireFangArmed: false,
    fireFangUsed: false,
    
    // Reflective-Mirror tracking
    reflectiveMirrorAvailable: false,
    reflectiveMirrorArmed: false,
    reflectiveMirrorUsed: false,
    
    // Self-Defibrillator tracking
    defibrillatorAvailable: false,
    defibrillatorUsed: false,
    
    // Energy-Smash tracking
    energySmashAvailable: false,
    energySmashArmed: false,
    energySmashUsed: false
  };
  
  // Load single equipped item from CHARACTER-SPECIFIC storage
  const itemId = character.equipment.equipped;
  let equippedItem = null;
  
  if (itemId && character.equipment.collection[itemId]) {
    const item = getEquipmentItem(itemId);
    if (item && character.equipment.collection[itemId].copies > 0) {
      const level = character.equipment.collection[itemId].level;
      equippedItem = {
        ...item,
        level
      };
      
      // Set availability flags for active items
      if (itemId === 'leech_suck') state.leechSuckAvailable = true;
      if (itemId === 'mist_dodge') state.mistDodgeAvailable = true;
      if (itemId === 'fire_fang') state.fireFangAvailable = true;
      if (itemId === 'reflective_mirror') state.reflectiveMirrorAvailable = true;
      if (itemId === 'self_defibrillator') state.defibrillatorAvailable = true;
      if (itemId === 'energy_smash') state.energySmashAvailable = true;
    }
  }
  
  return {
    item: equippedItem,
    state
  };
}

// Create equipment action buttons for battle (single item system)
function createEquipmentButtons(equipmentData, playerSlot, battleId) {
  if (!equipmentData || !equipmentData.item) return [];
  
  const { item, state } = equipmentData;
  const buttons = [];
  
  // Leech-Suck button
  if (item.id === 'leech_suck' && state.leechSuckAvailable && !state.leechSuckUsed) {
    buttons.push(new ButtonBuilder()
      .setCustomId(`equip_leech_${playerSlot}_${battleId}`)
      .setLabel(`${item.emoji} Leech-Suck`)
      .setStyle(ButtonStyle.Danger));
  }
  
  // Mist-Dodge button
  if (item.id === 'mist_dodge' && state.mistDodgeAvailable && !state.mistDodgeUsed) {
    buttons.push(new ButtonBuilder()
      .setCustomId(`equip_mist_${playerSlot}_${battleId}`)
      .setLabel(`${item.emoji} ${state.mistDodgeActive ? '✅ ' : ''}Mist-Dodge`)
      .setStyle(state.mistDodgeActive ? ButtonStyle.Success : ButtonStyle.Primary));
  }
  
  // Fire-Fang button
  if (item.id === 'fire_fang' && state.fireFangAvailable && !state.fireFangUsed) {
    buttons.push(new ButtonBuilder()
      .setCustomId(`equip_fire_${playerSlot}_${battleId}`)
      .setLabel(`${item.emoji} ${state.fireFangArmed ? '⚡ ' : ''}Fire-Fang`)
      .setStyle(state.fireFangArmed ? ButtonStyle.Success : ButtonStyle.Primary));
  }
  
  // Reflective-Mirror button (hidden activation)
  if (item.id === 'reflective_mirror' && state.reflectiveMirrorAvailable && !state.reflectiveMirrorUsed) {
    buttons.push(new ButtonBuilder()
      .setCustomId(`equip_mirror_${playerSlot}_${battleId}`)
      .setLabel(`${item.emoji} Mirror`)
      .setStyle(ButtonStyle.Secondary));
  }
  
  // Energy-Smash button (only show if not armed and not used)
  if (item.id === 'energy_smash' && state.energySmashAvailable && !state.energySmashUsed && !state.energySmashArmed) {
    buttons.push(new ButtonBuilder()
      .setCustomId(`equip_smash_${playerSlot}_${battleId}`)
      .setLabel(`${item.emoji} E-Smash`)
      .setStyle(ButtonStyle.Primary));
  }
  
  return buttons;
}

// Handle equipment button interactions
// Returns { success: boolean, message: string } instead of handling the interaction directly
function handleEquipmentButton(battle, buttonId) {
  const playerSlot = buttonId.includes('_p1') || buttonId.includes('_player1') ? 'player1' : 'player2';
  const equipmentData = battle[`${playerSlot}Equipment`];
  
  if (!equipmentData || !equipmentData.item || !equipmentData.state) {
    return { success: false, message: '❌ No equipment data!' };
  }
  
  const { item, state } = equipmentData;
  
  // Leech-Suck activation
  if (buttonId.includes('leech')) {
    if (state.leechSuckUsed) {
      return { success: false, message: '❌ Leech-Suck already used!', ephemeral: false };
    }
    
    if (!item || item.id !== 'leech_suck') {
      return { success: false, message: '❌ Invalid equipment!', ephemeral: false };
    }
    
    const opponentSlot = playerSlot === 'player1' ? 'player2' : 'player1';
    const opponentHP = battle[`${opponentSlot}HP`];
    const opponentMaxHP = battle[`${opponentSlot}MaxHP`];
    
    const level = item.level;
    const maxDrain = Math.min(15 + (level - 1) * 3, 30);
    const drainPercent = 5 + Math.random() * (maxDrain - 5);
    const drainAmount = Math.floor(opponentHP * (drainPercent / 100));
    
    battle[`${opponentSlot}HP`] = Math.max(1, opponentHP - drainAmount);
    battle[`${playerSlot}HP`] = Math.min(battle[`${playerSlot}HP`] + drainAmount, battle[`${playerSlot}MaxHP`]);
    
    state.leechSuckUsed = true;
    
    return { 
      success: true, 
      message: `🧛 **Leech-Suck activated!** Drained ${drainAmount} HP (${drainPercent.toFixed(1)}%) from opponent!`,
      ephemeral: false
    };
  }
  
  // Mist-Dodge activation
  if (buttonId.includes('mist')) {
    if (state.mistDodgeUsed) {
      return { success: false, message: '❌ Mist-Dodge already used!', ephemeral: false };
    }
    
    state.mistDodgeActive = true;
    state.mistDodgeUsed = true;
    
    return { 
      success: true, 
      message: `🌫️ **Mist-Dodge activated!** Your next incoming attack has a chance to miss!`,
      ephemeral: false
    };
  }
  
  // Fire-Fang activation
  if (buttonId.includes('fire')) {
    if (state.fireFangUsed) {
      return { success: false, message: '❌ Fire-Fang already used!', ephemeral: false };
    }
    
    state.fireFangArmed = !state.fireFangArmed;
    
    return { 
      success: true, 
      message: state.fireFangArmed 
        ? `🔥 **Fire-Fang armed!** Use your special ability, then opponent's next move will reflect damage!`
        : `🔥 Fire-Fang disarmed.`,
      ephemeral: false
    };
  }
  
  // Reflective-Mirror activation (hidden)
  if (buttonId.includes('mirror')) {
    if (state.reflectiveMirrorUsed) {
      return { success: false, message: '❌ Reflective-Mirror already used!', ephemeral: true };
    }
    
    state.reflectiveMirrorArmed = true;
    state.reflectiveMirrorUsed = true;
    
    return { 
      success: true, 
      message: `🪞 **Reflective-Mirror armed!** Your next incoming attack will be reflected! (This message is hidden from your opponent)`,
      ephemeral: true
    };
  }
  
  // Energy-Smash activation
  if (buttonId.includes('smash')) {
    if (state.energySmashUsed) {
      return { success: false, message: '❌ Energy-Smash already used!', ephemeral: false };
    }
    
    if (state.energySmashArmed) {
      return { success: false, message: '❌ Energy-Smash is already armed! Use a move to trigger the refund.', ephemeral: false };
    }
    
    // Arm the item (one-time use)
    state.energySmashArmed = true;
    
    return { 
      success: true, 
      message: `⚡ **Energy-Smash armed!** Your next move will refund 70%-90% of its energy cost!`,
      ephemeral: false
    };
  }
  
  return { success: false, message: '❌ Unknown equipment action!' };
}

// Hook: On damage dealt by player (for Med-Drop)
function onDamageDealt(battle, playerSlot, damageDealt) {
  const equipmentData = battle[`${playerSlot}Equipment`];
  if (!equipmentData || !equipmentData.item || !equipmentData.state) return 0;
  
  const { item, state } = equipmentData;
  
  // Med-Drop: heal percentage of damage dealt with random chance
  if (item.id === 'med_drop' && !state.medDropUsed && damageDealt > 0) {
    const currentHP = battle[`${playerSlot}HP`];
    const maxHP = battle[`${playerSlot}MaxHP`];
    
    // Only activate if not at full HP
    if (currentHP >= maxHP) {
      return 0;
    }
    
    const level = item.level;
    const procChance = Math.min(30 + (level - 1) * 5, 70); // 30-70% chance
    
    // Random chance to activate
    if (Math.random() * 100 < procChance) {
      const healPercent = 5 + (level - 1) * 1.5;
      const healAmount = Math.floor(damageDealt * (healPercent / 100));
      
      state.medDropUsed = true;
      state.medDropHealAmount = healAmount;
      
      battle[`${playerSlot}HP`] = Math.min(
        currentHP + healAmount,
        maxHP
      );
      
      return healAmount;
    }
  }
  
  return 0;
}

// Hook: On opponent's move (for Vanish-Ring)
function onOpponentMove(battle, opponentSlot, energyUsed) {
  const playerSlot = opponentSlot === 'player1' ? 'player2' : 'player1';
  const equipmentData = battle[`${playerSlot}Equipment`];
  
  if (!equipmentData || !equipmentData.item || !equipmentData.state) return 0;
  
  const { item, state } = equipmentData;
  
  // Vanish-Ring: chance to drain extra energy
  if (item.id === 'vanish_ring' && state.vanishRingActive) {
    const level = item.level;
    const procChance = 5 + (level - 1) * 2;
    
    if (Math.random() * 100 < procChance) {
      const energyDrain = 5;
      const currentEnergy = battle[`${opponentSlot}Energy`];
      battle[`${opponentSlot}Energy`] = Math.max(0, currentEnergy - energyDrain);
      return energyDrain;
    }
  }
  
  return 0;
}

// Hook: Check if Mist-Dodge should trigger
// Returns { dodged: boolean, message: string }
function checkMistDodge(battle, defenderSlot) {
  const equipmentData = battle[`${defenderSlot}Equipment`];
  if (!equipmentData || !equipmentData.item || !equipmentData.state) {
    return { dodged: false, message: '' };
  }
  
  const { item, state } = equipmentData;
  
  if (item.id === 'mist_dodge' && state.mistDodgeActive) {
    const level = item.level;
    const dodgeChance = Math.min(20 + (level - 1) * 5, 50);
    
    state.mistDodgeActive = false;
    
    if (Math.random() * 100 < dodgeChance) {
      return { dodged: true, message: `🌫️ **Mist-Dodge activated!** The attack missed! (${dodgeChance}% chance)` };
    } else {
      return { dodged: false, message: `🌫️ Mist-Dodge failed to activate... (${dodgeChance}% chance)` };
    }
  }
  
  return { dodged: false, message: '' };
}

// Hook: Calculate reflected damage (Fire-Fang & Reflective-Mirror)
// Returns { damage: number, causedKnockout: boolean }
function calculateReflectedDamage(battle, attackerSlot, defenderSlot, incomingDamage) {
  const defenderEquipment = battle[`${defenderSlot}Equipment`];
  if (!defenderEquipment || !defenderEquipment.item || !defenderEquipment.state) {
    return { damage: 0, causedKnockout: false };
  }
  
  const { item, state } = defenderEquipment;
  let reflectedDamage = 0;
  
  // Reflective-Mirror: 75% reflection
  if (item.id === 'reflective_mirror' && state.reflectiveMirrorArmed) {
    const level = item.level;
    const reflectPercent = Math.min(75 + (level - 1) * 5, 100);
    reflectedDamage = Math.floor(incomingDamage * (reflectPercent / 100));
    state.reflectiveMirrorArmed = false;
    
    const currentHP = battle[`${attackerSlot}HP`];
    const newHP = Math.max(0, currentHP - reflectedDamage);
    battle[`${attackerSlot}HP`] = newHP;
    
    return { 
      damage: reflectedDamage, 
      causedKnockout: newHP <= 0 
    };
  }
  
  // Fire-Fang: 20-35% reflection after special ability
  if (item.id === 'fire_fang' && state.fireFangArmed) {
    const level = item.level;
    const reflectPercent = Math.min(20 + (level - 1) * 5, 35);
    reflectedDamage = Math.floor(incomingDamage * (reflectPercent / 100));
    state.fireFangArmed = false;
    state.fireFangUsed = true;
    
    const currentHP = battle[`${attackerSlot}HP`];
    const newHP = Math.max(0, currentHP - reflectedDamage);
    battle[`${attackerSlot}HP`] = newHP;
    
    return { 
      damage: reflectedDamage, 
      causedKnockout: newHP <= 0 
    };
  }
  
  return { damage: 0, causedKnockout: false };
}

// Hook: Check for Self-Defibrillator revival
function checkDefibrillatorRevive(battle, playerSlot) {
  const equipmentData = battle[`${playerSlot}Equipment`];
  if (!equipmentData || !equipmentData.item || !equipmentData.state) return false;
  
  const { item, state } = equipmentData;
  
  if (item.id === 'self_defibrillator' && !state.defibrillatorUsed && battle[`${playerSlot}HP`] <= 0) {
    const level = item.level;
    const reviveEnergy = 5 + (level - 1) * 2;
    
    state.defibrillatorUsed = true;
    
    battle[`${playerSlot}HP`] = battle[`${playerSlot}MaxHP`];
    battle[`${playerSlot}Energy`] = reviveEnergy;
    
    return true;
  }
  
  return false;
}

// Hook: Apply Energy-Smash refund
function applyEnergySmashRefund(battle, playerSlot, energyUsed) {
  const equipmentData = battle[`${playerSlot}Equipment`];
  if (!equipmentData || !equipmentData.item || !equipmentData.state) return 0;
  
  const { item, state } = equipmentData;
  
  if (item.id === 'energy_smash' && state.energySmashArmed) {
    const level = item.level;
    const refundPercent = Math.min(70 + (level - 1) * 5, 90);
    const refundAmount = Math.floor(energyUsed * (refundPercent / 100));
    
    state.energySmashArmed = false;
    state.energySmashUsed = true;
    
    const currentEnergy = battle[`${playerSlot}Energy`];
    battle[`${playerSlot}Energy`] = Math.min(
      currentEnergy + refundAmount,
      100
    );
    
    return refundAmount;
  }
  
  return 0;
}

// Get equipment status display (single item system)
function getEquipmentStatusDisplay(equipmentData) {
  if (!equipmentData || !equipmentData.item) return '';
  
  const { item, state } = equipmentData;
  let statusText = `${item.emoji} ${item.name} Lv.${item.level}`;
  
  // Add status indicator
  if (item.id === 'med_drop') {
    statusText += state.medDropUsed ? ' ❌' : ' ✅';
  } else if (item.id === 'vanish_ring') {
    statusText += ' ✅';
  } else if (item.id === 'leech_suck') {
    statusText += state.leechSuckUsed ? ' ❌' : ' ✅';
  } else if (item.id === 'mist_dodge') {
    statusText += state.mistDodgeUsed ? ' ❌' : (state.mistDodgeActive ? ' ⚡' : ' ✅');
  } else if (item.id === 'fire_fang') {
    statusText += state.fireFangUsed ? ' ❌' : (state.fireFangArmed ? ' ⚡' : ' ✅');
  } else if (item.id === 'reflective_mirror') {
    statusText += state.reflectiveMirrorUsed ? ' ❌' : (state.reflectiveMirrorArmed ? ' ⚡' : ' ✅');
  } else if (item.id === 'self_defibrillator') {
    statusText += state.defibrillatorUsed ? ' ❌' : ' ✅';
  } else if (item.id === 'energy_smash') {
    statusText += state.energySmashUsed ? ' ❌' : (state.energySmashArmed ? ' ⚡' : ' ✅');
  }
  
  statusText += ` - ${item.detailedDescription(item.level)}`;
  
  return '\n**Equipment:** ' + statusText;
}

module.exports = {
  prepareBattleEquipment,
  createEquipmentButtons,
  handleEquipmentButton,
  onDamageDealt,
  onOpponentMove,
  checkMistDodge,
  calculateReflectedDamage,
  checkDefibrillatorRevive,
  applyEnergySmashRefund,
  getEquipmentStatusDisplay
};
