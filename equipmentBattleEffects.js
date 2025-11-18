// Equipment Battle Effects - Handles all item effects during battles
const { getEquipmentItem } = require('./equipmentConfig.js');
const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

// Prepare equipment state for battle (CHARACTER-SPECIFIC SYSTEM)
function prepareBattleEquipment(battle, playerSlot, user, character) {
  // ON-DEMAND MIGRATION: Ensure equipment is migrated before battle
  const { migrateUserEquipment } = require('./equipmentSystem.js');
  migrateUserEquipment(user);
  
  if (!character.equipment || !character.equipment.slots || !character.equipment.collection) {
    return null;
  }
  
  const equipped = {
    silver: null,
    gold: null,
    legendary: null
  };
  
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
  
  // Load equipped items and their levels from CHARACTER-SPECIFIC storage
  for (const [slot, itemId] of Object.entries(character.equipment.slots)) {
    if (itemId && character.equipment.collection[itemId]) {
      const item = getEquipmentItem(itemId);
      if (item) {
        const level = character.equipment.collection[itemId].level;
        equipped[slot] = {
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
  }
  
  return {
    items: equipped,
    state
  };
}

// Create equipment action buttons for battle
function createEquipmentButtons(equipmentData, playerSlot) {
  if (!equipmentData) return [];
  
  const { items, state } = equipmentData;
  const buttons = [];
  
  // Leech-Suck button
  if (items.gold?.id === 'leech_suck' && state.leechSuckAvailable && !state.leechSuckUsed) {
    buttons.push(new ButtonBuilder()
      .setCustomId(`equip_leech_${playerSlot}`)
      .setLabel(`${items.gold.emoji} Leech-Suck`)
      .setStyle(ButtonStyle.Danger));
  }
  
  // Mist-Dodge button
  if (items.gold?.id === 'mist_dodge' && state.mistDodgeAvailable && !state.mistDodgeUsed) {
    buttons.push(new ButtonBuilder()
      .setCustomId(`equip_mist_${playerSlot}`)
      .setLabel(`${items.gold.emoji} ${state.mistDodgeActive ? '✅ ' : ''}Mist-Dodge`)
      .setStyle(state.mistDodgeActive ? ButtonStyle.Success : ButtonStyle.Primary));
  }
  
  // Fire-Fang button
  if (items.gold?.id === 'fire_fang' && state.fireFangAvailable && !state.fireFangUsed) {
    buttons.push(new ButtonBuilder()
      .setCustomId(`equip_fire_${playerSlot}`)
      .setLabel(`${items.gold.emoji} ${state.fireFangArmed ? '⚡ ' : ''}Fire-Fang`)
      .setStyle(state.fireFangArmed ? ButtonStyle.Success : ButtonStyle.Primary));
  }
  
  // Reflective-Mirror button (hidden activation)
  if (items.legendary?.id === 'reflective_mirror' && state.reflectiveMirrorAvailable && !state.reflectiveMirrorUsed) {
    buttons.push(new ButtonBuilder()
      .setCustomId(`equip_mirror_${playerSlot}`)
      .setLabel(`${items.legendary.emoji} Mirror`)
      .setStyle(ButtonStyle.Secondary));
  }
  
  // Energy-Smash button
  if (items.legendary?.id === 'energy_smash' && state.energySmashAvailable && !state.energySmashUsed) {
    buttons.push(new ButtonBuilder()
      .setCustomId(`equip_smash_${playerSlot}`)
      .setLabel(`${items.legendary.emoji} ${state.energySmashArmed ? '⚡ ' : ''}E-Smash`)
      .setStyle(state.energySmashArmed ? ButtonStyle.Success : ButtonStyle.Primary));
  }
  
  return buttons;
}

// Handle equipment button interactions
async function handleEquipmentButton(battle, interaction, buttonId) {
  const playerSlot = buttonId.includes('_p1') || buttonId.includes('_player1') ? 'player1' : 'player2';
  const equipmentData = battle[`${playerSlot}Equipment`];
  
  if (!equipmentData || !equipmentData.items || !equipmentData.state) {
    await interaction.reply({ content: '❌ No equipment data!', flags: 64 });
    return false;
  }
  
  const { items, state } = equipmentData;
  
  // Leech-Suck activation
  if (buttonId.includes('leech')) {
    if (state.leechSuckUsed) {
      await interaction.reply({ content: '❌ Leech-Suck already used!', flags: 64 });
      return false;
    }
    
    if (!items.gold || items.gold.id !== 'leech_suck') {
      await interaction.reply({ content: '❌ Invalid equipment!', flags: 64 });
      return false;
    }
    
    const opponentSlot = playerSlot === 'player1' ? 'player2' : 'player1';
    const opponentHP = battle[`${opponentSlot}HP`];
    const opponentMaxHP = battle[`${opponentSlot}MaxHP`];
    
    const level = items.gold.level;
    const maxDrain = Math.min(15 + (level - 1) * 3, 30);
    const drainPercent = 5 + Math.random() * (maxDrain - 5);
    const drainAmount = Math.floor(opponentHP * (drainPercent / 100));
    
    battle[`${opponentSlot}HP`] = Math.max(1, opponentHP - drainAmount);
    battle[`${playerSlot}HP`] = Math.min(battle[`${playerSlot}HP`] + drainAmount, battle[`${playerSlot}MaxHP`]);
    
    state.leechSuckUsed = true;
    
    await interaction.reply({ 
      content: `🧛 **Leech-Suck activated!** Drained ${drainAmount} HP (${drainPercent.toFixed(1)}%) from opponent!`, 
      flags: 64 
    });
    return true;
  }
  
  // Mist-Dodge activation
  if (buttonId.includes('mist')) {
    if (state.mistDodgeUsed) {
      await interaction.reply({ content: '❌ Mist-Dodge already used!', flags: 64 });
      return false;
    }
    
    state.mistDodgeActive = true;
    state.mistDodgeUsed = true;
    
    await interaction.reply({ 
      content: `🌫️ **Mist-Dodge activated!** Next opponent attack may miss!`, 
      flags: 64 
    });
    return true;
  }
  
  // Fire-Fang activation
  if (buttonId.includes('fire')) {
    if (state.fireFangUsed) {
      await interaction.reply({ content: '❌ Fire-Fang already used!', flags: 64 });
      return false;
    }
    
    state.fireFangArmed = !state.fireFangArmed;
    
    await interaction.reply({ 
      content: state.fireFangArmed 
        ? `🔥 **Fire-Fang armed!** Use your special ability, then opponent's next move will reflect damage!`
        : `🔥 Fire-Fang disarmed.`, 
      flags: 64 
    });
    return true;
  }
  
  // Reflective-Mirror activation (hidden)
  if (buttonId.includes('mirror')) {
    if (state.reflectiveMirrorUsed) {
      await interaction.reply({ content: '❌ Reflective-Mirror already used!', flags: 64 });
      return false;
    }
    
    state.reflectiveMirrorArmed = true;
    state.reflectiveMirrorUsed = true;
    
    await interaction.reply({ 
      content: `🪞 **Reflective-Mirror set!** (Hidden activation - opponent won't see this)`, 
      flags: 64 
    });
    return true;
  }
  
  // Energy-Smash activation
  if (buttonId.includes('smash')) {
    if (state.energySmashUsed) {
      await interaction.reply({ content: '❌ Energy-Smash already used!', flags: 64 });
      return false;
    }
    
    state.energySmashArmed = !state.energySmashArmed;
    
    await interaction.reply({ 
      content: state.energySmashArmed 
        ? `⚡ **Energy-Smash armed!** Your next move will refund energy!`
        : `⚡ Energy-Smash disarmed.`, 
      flags: 64 
    });
    return true;
  }
  
  return false;
}

// Hook: On damage dealt by player (for Med-Drop)
function onDamageDealt(battle, playerSlot, damageDealt) {
  const equipmentData = battle[`${playerSlot}Equipment`];
  if (!equipmentData || !equipmentData.items || !equipmentData.state) return 0;
  
  const { items, state } = equipmentData;
  
  // Med-Drop: heal percentage of damage dealt
  if (items.silver?.id === 'med_drop' && !state.medDropUsed && damageDealt > 0) {
    const level = items.silver.level;
    const healPercent = 5 + (level - 1) * 1.5;
    const healAmount = Math.floor(damageDealt * (healPercent / 100));
    
    state.medDropUsed = true;
    state.medDropHealAmount = healAmount;
    
    battle[`${playerSlot}HP`] = Math.min(
      battle[`${playerSlot}HP`] + healAmount,
      battle[`${playerSlot}MaxHP`]
    );
    
    return healAmount;
  }
  
  return 0;
}

// Hook: On opponent's move (for Vanish-Ring)
function onOpponentMove(battle, opponentSlot, energyUsed) {
  const playerSlot = opponentSlot === 'player1' ? 'player2' : 'player1';
  const equipmentData = battle[`${playerSlot}Equipment`];
  
  if (!equipmentData || !equipmentData.items || !equipmentData.state) return 0;
  
  const { items, state } = equipmentData;
  
  // Vanish-Ring: chance to drain extra energy
  if (items.silver?.id === 'vanish_ring' && state.vanishRingActive) {
    const level = items.silver.level;
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
function checkMistDodge(battle, defenderSlot) {
  const equipmentData = battle[`${defenderSlot}Equipment`];
  if (!equipmentData || !equipmentData.items || !equipmentData.state) return false;
  
  const { items, state } = equipmentData;
  
  if (items.gold?.id === 'mist_dodge' && state.mistDodgeActive) {
    const level = items.gold.level;
    const dodgeChance = Math.min(20 + (level - 1) * 5, 50);
    
    state.mistDodgeActive = false;
    
    if (Math.random() * 100 < dodgeChance) {
      return true;
    }
  }
  
  return false;
}

// Hook: Calculate reflected damage (Fire-Fang & Reflective-Mirror)
function calculateReflectedDamage(battle, attackerSlot, defenderSlot, incomingDamage) {
  const defenderEquipment = battle[`${defenderSlot}Equipment`];
  if (!defenderEquipment || !defenderEquipment.items || !defenderEquipment.state) return 0;
  
  const { items, state } = defenderEquipment;
  let reflectedDamage = 0;
  
  // Reflective-Mirror: 75% reflection
  if (items.legendary?.id === 'reflective_mirror' && state.reflectiveMirrorArmed) {
    const level = items.legendary.level;
    const reflectPercent = Math.min(75 + (level - 1) * 5, 100);
    reflectedDamage = Math.floor(incomingDamage * (reflectPercent / 100));
    state.reflectiveMirrorArmed = false;
    
    const currentHP = battle[`${attackerSlot}HP`];
    battle[`${attackerSlot}HP`] = Math.max(0, currentHP - reflectedDamage);
    return reflectedDamage;
  }
  
  // Fire-Fang: 20-35% reflection after special ability
  if (items.gold?.id === 'fire_fang' && state.fireFangArmed) {
    const level = items.gold.level;
    const reflectPercent = Math.min(20 + (level - 1) * 5, 35);
    reflectedDamage = Math.floor(incomingDamage * (reflectPercent / 100));
    state.fireFangArmed = false;
    state.fireFangUsed = true;
    
    const currentHP = battle[`${attackerSlot}HP`];
    battle[`${attackerSlot}HP`] = Math.max(0, currentHP - reflectedDamage);
    return reflectedDamage;
  }
  
  return 0;
}

// Hook: Check for Self-Defibrillator revival
function checkDefibrillatorRevive(battle, playerSlot) {
  const equipmentData = battle[`${playerSlot}Equipment`];
  if (!equipmentData || !equipmentData.items || !equipmentData.state) return false;
  
  const { items, state } = equipmentData;
  
  if (items.legendary?.id === 'self_defibrillator' && !state.defibrillatorUsed && battle[`${playerSlot}HP`] <= 0) {
    const level = items.legendary.level;
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
  if (!equipmentData || !equipmentData.items || !equipmentData.state) return 0;
  
  const { items, state } = equipmentData;
  
  if (items.legendary?.id === 'energy_smash' && state.energySmashArmed) {
    const level = items.legendary.level;
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

// Get equipment status display
function getEquipmentStatusDisplay(equipmentData) {
  if (!equipmentData) return '';
  
  const { items, state } = equipmentData;
  const status = [];
  
  if (items.silver) {
    let statusText = `${items.silver.emoji} ${items.silver.name} Lv.${items.silver.level}`;
    if (items.silver.id === 'med_drop') {
      statusText += state.medDropUsed ? ' ❌' : ' ✅';
    }
    status.push(statusText);
  }
  
  if (items.gold) {
    let statusText = `${items.gold.emoji} ${items.gold.name} Lv.${items.gold.level}`;
    if (items.gold.id === 'leech_suck') {
      statusText += state.leechSuckUsed ? ' ❌' : ' ✅';
    } else if (items.gold.id === 'mist_dodge') {
      statusText += state.mistDodgeUsed ? ' ❌' : (state.mistDodgeActive ? ' ⚡' : ' ✅');
    } else if (items.gold.id === 'fire_fang') {
      statusText += state.fireFangUsed ? ' ❌' : (state.fireFangArmed ? ' ⚡' : ' ✅');
    }
    status.push(statusText);
  }
  
  if (items.legendary) {
    let statusText = `${items.legendary.emoji} ${items.legendary.name} Lv.${items.legendary.level}`;
    if (items.legendary.id === 'reflective_mirror') {
      statusText += state.reflectiveMirrorUsed ? ' ❌' : ' ✅';
    } else if (items.legendary.id === 'self_defibrillator') {
      statusText += state.defibrillatorUsed ? ' ❌' : ' ✅';
    } else if (items.legendary.id === 'energy_smash') {
      statusText += state.energySmashUsed ? ' ❌' : (state.energySmashArmed ? ' ⚡' : ' ✅');
    }
    status.push(statusText);
  }
  
  return status.length > 0 ? '\n**Equipment:** ' + status.join(' | ') : '';
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
