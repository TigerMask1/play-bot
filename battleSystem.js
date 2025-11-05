const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { saveData } = require('./dataManager.js');
const { calculateBaseHP, calculateDamage, calculateEnergyCost, calculateCriticalHit, getMoveDisplay } = require('./battleUtils.js');
const { getCharacterAbility } = require('./characterAbilities.js');
const { MOVE_EFFECTS, applyEffect, processEffects, hasEffect, getEffectsDisplay, clearAllEffects } = require('./moveEffects.js');
const { getUserBattleItems, useItem } = require('./itemsSystem.js');
const eventSystem = require('./eventSystem.js');

const activeBattles = new Map();
const battleInvites = new Map();

const STARTING_ENERGY = 50;
const ENERGY_PER_TURN = 10;
const MAX_ENERGY = 100;

async function initiateBattle(message, data, challengerId, opponentId) {
  if (battleInvites.has(challengerId)) {
    await message.reply('❌ You already have a pending battle invite!');
    return;
  }
  
  if (battleInvites.has(opponentId)) {
    await message.reply('❌ That user already has a pending battle invite!');
    return;
  }
  
  if (activeBattles.has(challengerId)) {
    await message.reply('❌ You are already in a battle!');
    return;
  }
  
  if (activeBattles.has(opponentId)) {
    await message.reply('❌ That user is already in a battle!');
    return;
  }
  
  if (!data.users[opponentId]) {
    await message.reply('❌ That user hasn\'t started yet!');
    return;
  }
  
  if (data.users[challengerId].characters.length === 0) {
    await message.reply('❌ You don\'t have any characters! Use `!start` and `!select` to get started.');
    return;
  }
  
  if (data.users[opponentId].characters.length === 0) {
    await message.reply('❌ That user doesn\'t have any characters yet!');
    return;
  }
  
  const inviteId = `${challengerId}-${opponentId}-${Date.now()}`;
  
  const invite = {
    id: inviteId,
    challenger: challengerId,
    opponent: opponentId,
    channel: message.channel,
    timeout: null
  };
  
  battleInvites.set(challengerId, invite);
  battleInvites.set(opponentId, invite);
  
  const acceptButton = new ButtonBuilder()
    .setCustomId(`battle_accept_${inviteId}`)
    .setLabel('Accept')
    .setStyle(ButtonStyle.Success);
  
  const declineButton = new ButtonBuilder()
    .setCustomId(`battle_decline_${inviteId}`)
    .setLabel('Decline')
    .setStyle(ButtonStyle.Danger);
  
  const row = new ActionRowBuilder().addComponents(acceptButton, declineButton);
  
  const inviteEmbed = new EmbedBuilder()
    .setColor('#FF6B35')
    .setTitle('⚔️ BATTLE CHALLENGE!')
    .setDescription(`<@${challengerId}> challenges <@${opponentId}> to a battle!\n\n<@${opponentId}>, click Accept or Decline.\n\nInvite expires in 60 seconds.`);
  
  const inviteMessage = await message.channel.send({ embeds: [inviteEmbed], components: [row] });
  
  invite.message = inviteMessage;
  invite.timeout = setTimeout(() => {
    if (battleInvites.has(challengerId)) {
      expireBattleInvite(invite);
    }
  }, 60000);
  
  const filter = (interaction) => {
    return interaction.customId.startsWith('battle_') && 
           (interaction.user.id === challengerId || interaction.user.id === opponentId);
  };
  
  const collector = inviteMessage.createMessageComponentCollector({ filter, time: 60000 });
  
  collector.on('collect', async (interaction) => {
    if (interaction.customId === `battle_decline_${inviteId}`) {
      if (interaction.user.id !== opponentId) {
        await interaction.reply({ content: '❌ Only the challenged player can decline!', ephemeral: true });
        return;
      }
      
      await interaction.update({ 
        embeds: [new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('⚔️ Battle Declined')
          .setDescription(`<@${opponentId}> declined the battle challenge.`)],
        components: []
      });
      
      clearTimeout(invite.timeout);
      battleInvites.delete(challengerId);
      battleInvites.delete(opponentId);
      collector.stop();
    } else if (interaction.customId === `battle_accept_${inviteId}`) {
      if (interaction.user.id !== opponentId) {
        await interaction.reply({ content: '❌ Only the challenged player can accept!', ephemeral: true });
        return;
      }
      
      await interaction.update({ 
        embeds: [new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('⚔️ Battle Accepted!')
          .setDescription(`<@${opponentId}> accepted the challenge!\n\nBoth players, select your character!`)],
        components: []
      });
      
      clearTimeout(invite.timeout);
      battleInvites.delete(challengerId);
      battleInvites.delete(opponentId);
      collector.stop();
      
      await startCharacterSelection(message.channel, data, challengerId, opponentId);
    }
  });
}

async function expireBattleInvite(invite) {
  battleInvites.delete(invite.challenger);
  battleInvites.delete(invite.opponent);
  
  const expireEmbed = new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('⏱️ Battle Invite Expired')
    .setDescription('The battle invite has expired.');
  
  await invite.message.edit({ embeds: [expireEmbed], components: [] });
}

async function startCharacterSelection(channel, data, player1Id, player2Id) {
  const battle = {
    id: `battle-${player1Id}-${player2Id}-${Date.now()}`,
    player1: player1Id,
    player2: player2Id,
    player1Character: null,
    player2Character: null,
    player1HP: 0,
    player2HP: 0,
    player1MaxHP: 0,
    player2MaxHP: 0,
    player1Energy: STARTING_ENERGY,
    player2Energy: STARTING_ENERGY,
    player1Shield: 0,
    player2Shield: 0,
    player1Buffs: {},
    player2Buffs: {},
    player1Ability: null,
    player2Ability: null,
    player1AbilityState: {},
    player2AbilityState: {},
    currentTurn: null,
    channel: channel,
    timeout: null,
    started: false,
    effects: { player1: [], player2: [] },
    turnCount: 0
  };
  
  activeBattles.set(player1Id, battle);
  activeBattles.set(player2Id, battle);
  
  const player1Chars = data.users[player1Id].characters;
  const player2Chars = data.users[player2Id].characters;
  
  const p1SelectEmbed = new EmbedBuilder()
    .setColor('#3498DB')
    .setTitle('🎮 Select Your Character')
    .setDescription(`<@${player1Id}>, choose your character by typing its name:\n\n${player1Chars.map(c => `${c.emoji} **${c.name}** (Lvl ${c.level}, ST: ${c.st}%)`).join('\n')}`);
  
  const p2SelectEmbed = new EmbedBuilder()
    .setColor('#E74C3C')
    .setTitle('🎮 Select Your Character')
    .setDescription(`<@${player2Id}>, choose your character by typing its name:\n\n${player2Chars.map(c => `${c.emoji} **${c.name}** (Lvl ${c.level}, ST: ${c.st}%)`).join('\n')}`);
  
  await channel.send({ embeds: [p1SelectEmbed] });
  await channel.send({ embeds: [p2SelectEmbed] });
  
  const filter = (m) => {
    return (m.author.id === player1Id || m.author.id === player2Id) && !m.content.startsWith('!');
  };
  
  const collector = channel.createMessageCollector({ filter, time: 120000 });
  
  collector.on('collect', async (m) => {
    const userId = m.author.id;
    const charName = m.content.toLowerCase().trim();
    
    const userChars = data.users[userId].characters;
    const selectedChar = userChars.find(c => c.name.toLowerCase() === charName);
    
    if (!selectedChar) {
      await m.reply('❌ You don\'t own that character! Try again.');
      return;
    }
    
    if (!selectedChar.moves || !selectedChar.baseHp) {
      await m.reply('❌ This character doesn\'t have moves assigned yet! Please contact an admin.');
      return;
    }
    
    const ability = getCharacterAbility(selectedChar.name);
    
    if (userId === player1Id && !battle.player1Character) {
      battle.player1Character = selectedChar;
      battle.player1HP = selectedChar.baseHp;
      battle.player1MaxHP = selectedChar.baseHp;
      battle.player1Ability = ability;
      
      if (ability && ability.effect.startingEnergyBonus) {
        battle.player1Energy += ability.effect.startingEnergyBonus;
      }
      if (ability && ability.effect.startWithMaxEnergy) {
        battle.player1Energy = MAX_ENERGY;
      }
      if (ability && ability.effect.startingShield) {
        battle.player1Shield = Math.round(selectedChar.baseHp * ability.effect.startingShield);
      }
      
      await m.reply(`✅ You selected **${selectedChar.name} ${selectedChar.emoji}**!${ability ? `\n${ability.emoji} **${ability.name}**: ${ability.description}` : ''}`);
    } else if (userId === player2Id && !battle.player2Character) {
      battle.player2Character = selectedChar;
      battle.player2HP = selectedChar.baseHp;
      battle.player2MaxHP = selectedChar.baseHp;
      battle.player2Ability = ability;
      
      if (ability && ability.effect.startingEnergyBonus) {
        battle.player2Energy += ability.effect.startingEnergyBonus;
      }
      if (ability && ability.effect.startWithMaxEnergy) {
        battle.player2Energy = MAX_ENERGY;
      }
      if (ability && ability.effect.startingShield) {
        battle.player2Shield = Math.round(selectedChar.baseHp * ability.effect.startingShield);
      }
      
      await m.reply(`✅ You selected **${selectedChar.name} ${selectedChar.emoji}**!${ability ? `\n${ability.emoji} **${ability.name}**: ${ability.description}` : ''}`);
    }
    
    if (battle.player1Character && battle.player2Character) {
      collector.stop();
      await startBattle(battle, channel, data);
    }
  });
  
  collector.on('end', (collected, reason) => {
    if (reason === 'time' && (!battle.player1Character || !battle.player2Character)) {
      channel.send('⏱️ Character selection timed out! Battle cancelled.');
      activeBattles.delete(player1Id);
      activeBattles.delete(player2Id);
    }
  });
}

async function startBattle(battle, channel, data) {
  battle.started = true;
  battle.currentTurn = Math.random() < 0.5 ? battle.player1 : battle.player2;
  
  const ability1 = battle.player1Ability;
  const ability2 = battle.player2Ability;
  
  if (ability1 && ability1.effect.randomStartBuff) {
    const buffTypes = ['attack', 'defense', 'critical'];
    const randomBuff = buffTypes[Math.floor(Math.random() * buffTypes.length)];
    battle.player1Buffs[randomBuff] = { value: 1.2, duration: 4 };
  }
  
  if (ability2 && ability2.effect.randomStartBuff) {
    const buffTypes = ['attack', 'defense', 'critical'];
    const randomBuff = buffTypes[Math.floor(Math.random() * buffTypes.length)];
    battle.player2Buffs[randomBuff] = { value: 1.2, duration: 4 };
  }
  
  const battleStartEmbed = new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle('⚔️ BATTLE BEGINS!')
    .setDescription(`**${battle.player1Character.emoji} ${battle.player1Character.name}** vs **${battle.player2Character.emoji} ${battle.player2Character.name}**\n\n<@${battle.currentTurn}> goes first!`)
    .addFields(
      { 
        name: `${battle.player1Character.emoji} ${battle.player1Character.name}`, 
        value: `HP: ${battle.player1HP}/${battle.player1MaxHP}${battle.player1Shield > 0 ? ` 🛡️${battle.player1Shield}` : ''}\n⚡ Energy: ${battle.player1Energy}/${MAX_ENERGY}${battle.player1Ability ? `\n${battle.player1Ability.emoji} ${battle.player1Ability.name}` : ''}`, 
        inline: true 
      },
      { 
        name: `${battle.player2Character.emoji} ${battle.player2Character.name}`, 
        value: `HP: ${battle.player2HP}/${battle.player2MaxHP}${battle.player2Shield > 0 ? ` 🛡️${battle.player2Shield}` : ''}\n⚡ Energy: ${battle.player2Energy}/${MAX_ENERGY}${battle.player2Ability ? `\n${battle.player2Ability.emoji} ${battle.player2Ability.name}` : ''}`, 
        inline: true 
      }
    );
  
  await channel.send({ embeds: [battleStartEmbed] });
  
  battle.timeout = setTimeout(() => {
    if (activeBattles.has(battle.player1)) {
      endBattle(battle, channel, data, 'timeout');
    }
  }, 600000);
  
  await promptTurn(battle, channel, data);
}

function createEnergyBar(current, max) {
  const barLength = 10;
  const filledBars = Math.round((current / max) * barLength);
  const emptyBars = barLength - filledBars;
  return '█'.repeat(filledBars) + '░'.repeat(emptyBars) + ` ${current}/${max}`;
}

function createHPBar(current, max) {
  const barLength = 10;
  const filledBars = Math.round((current / max) * barLength);
  const emptyBars = barLength - filledBars;
  const percentage = Math.round((current / max) * 100);
  return '█'.repeat(filledBars) + '░'.repeat(emptyBars) + ` ${current}/${max} (${percentage}%)`;
}

async function promptTurn(battle, channel, data) {
  battle.turnCount++;
  
  const currentPlayer = battle.currentTurn;
  const isPlayer1 = currentPlayer === battle.player1;
  const currentChar = isPlayer1 ? battle.player1Character : battle.player2Character;
  const opponentChar = isPlayer1 ? battle.player2Character : battle.player1Character;
  
  let currentEnergy = isPlayer1 ? battle.player1Energy : battle.player2Energy;
  const currentAbility = isPlayer1 ? battle.player1Ability : battle.player2Ability;
  const currentAbilityState = isPlayer1 ? battle.player1AbilityState : battle.player2AbilityState;
  
  if (currentAbility && currentAbility.effect.healPerTurn) {
    const healAmount = Math.round((isPlayer1 ? battle.player1MaxHP : battle.player2MaxHP) * currentAbility.effect.healPerTurn);
    if (isPlayer1) {
      battle.player1HP = Math.min(battle.player1HP + healAmount, battle.player1MaxHP);
    } else {
      battle.player2HP = Math.min(battle.player2HP + healAmount, battle.player2MaxHP);
    }
    await channel.send(`${currentAbility.emoji} **${currentAbility.name}**: ${currentChar.emoji} ${currentChar.name} healed ${healAmount} HP!`);
  }
  
  if (currentAbility && currentAbility.effect.hpRegenPerTurn) {
    const healAmount = currentAbility.effect.hpRegenPerTurn;
    if (isPlayer1) {
      battle.player1HP = Math.min(battle.player1HP + healAmount, battle.player1MaxHP);
    } else {
      battle.player2HP = Math.min(battle.player2HP + healAmount, battle.player2MaxHP);
    }
    await channel.send(`${currentAbility.emoji} **${currentAbility.name}**: ${currentChar.emoji} ${currentChar.name} regenerated ${healAmount} HP!`);
  }
  
  if (currentAbility && currentAbility.effect.energyRegenPerTurn) {
    currentEnergy = Math.min(currentEnergy + currentAbility.effect.energyRegenPerTurn, MAX_ENERGY);
    if (isPlayer1) {
      battle.player1Energy = currentEnergy;
    } else {
      battle.player2Energy = currentEnergy;
    }
  }
  
  currentEnergy = Math.min(currentEnergy + ENERGY_PER_TURN, MAX_ENERGY);
  if (isPlayer1) {
    battle.player1Energy = currentEnergy;
  } else {
    battle.player2Energy = currentEnergy;
  }
  
  if (currentAbility && currentAbility.effect.energyRegenBonus) {
    const bonusEnergy = Math.round(ENERGY_PER_TURN * currentAbility.effect.energyRegenBonus);
    currentEnergy = Math.min(currentEnergy + bonusEnergy, MAX_ENERGY);
    if (isPlayer1) {
      battle.player1Energy = currentEnergy;
    } else {
      battle.player2Energy = currentEnergy;
    }
  }
  
  const effectsResult = processEffects(battle, currentPlayer);
  
  if (effectsResult.damage > 0) {
    if (isPlayer1) {
      battle.player1HP = Math.max(0, battle.player1HP - effectsResult.damage);
    } else {
      battle.player2HP = Math.max(0, battle.player2HP - effectsResult.damage);
    }
  }
  
  if (effectsResult.heal > 0) {
    if (isPlayer1) {
      battle.player1HP = Math.min(battle.player1HP + effectsResult.heal, battle.player1MaxHP);
    } else {
      battle.player2HP = Math.min(battle.player2HP + effectsResult.heal, battle.player2MaxHP);
    }
  }
  
  if (effectsResult.messages.length > 0) {
    await channel.send(`${currentChar.emoji} **${currentChar.name}**:\n${effectsResult.messages.join('\n')}`);
  }
  
  if ((isPlayer1 ? battle.player1HP : battle.player2HP) <= 0) {
    const winner = isPlayer1 ? battle.player2 : battle.player1;
    await endBattle(battle, channel, data, 'knockout', winner);
    return;
  }
  
  if (effectsResult.skipTurn) {
    await channel.send(`${currentChar.emoji} **${currentChar.name}** is frozen/stunned and skips this turn!`);
    battle.currentTurn = isPlayer1 ? battle.player2 : battle.player1;
    setTimeout(() => {
      if (activeBattles.has(battle.player1)) {
        promptTurn(battle, channel, data);
      }
    }, 2000);
    return;
  }
  
  const moves = currentChar.moves;
  const allMoves = [moves.special, ...moves.tierMoves];
  
  const moveButtons = [];
  for (let i = 0; i < allMoves.length; i++) {
    const move = allMoves[i];
    const isSpecial = i === 0;
    let energyCost = calculateEnergyCost(move, isSpecial);
    
    if (currentAbility && currentAbility.effect.energyCostReduction) {
      energyCost = Math.round(energyCost * (1 - currentAbility.effect.energyCostReduction));
    }
    if (currentAbility && currentAbility.effect.normalMoveCostReduction && !isSpecial) {
      energyCost = Math.round(energyCost * (1 - currentAbility.effect.normalMoveCostReduction));
    }
    
    const display = getMoveDisplay(move, currentChar.level, currentChar.st, isSpecial, energyCost);
    const canAfford = currentEnergy >= energyCost;
    
    moveButtons.push(
      new ButtonBuilder()
        .setCustomId(`move_${i}_${battle.id}`)
        .setLabel(`${display}`)
        .setStyle(isSpecial ? ButtonStyle.Danger : ButtonStyle.Primary)
        .setDisabled(!canAfford)
    );
  }
  
  const fleeButton = new ButtonBuilder()
    .setCustomId(`flee_${battle.id}`)
    .setLabel('Flee')
    .setStyle(ButtonStyle.Secondary);
  
  const itemButton = new ButtonBuilder()
    .setCustomId(`items_${battle.id}`)
    .setLabel('Items')
    .setStyle(ButtonStyle.Success)
    .setEmoji('🎒');
  
  const rows = [
    new ActionRowBuilder().addComponents(moveButtons.slice(0, 3)),
    new ActionRowBuilder().addComponents(fleeButton, itemButton)
  ];
  
  const effectsDisplay1 = getEffectsDisplay(battle, battle.player1);
  const effectsDisplay2 = getEffectsDisplay(battle, battle.player2);
  
  const turnEmbed = new EmbedBuilder()
    .setColor('#FFA500')
    .setTitle(`⚡ <@${currentPlayer}>'s Turn! (Turn ${battle.turnCount})`)
    .setDescription(`**Your Character:** ${currentChar.emoji} ${currentChar.name}${currentAbility ? `\n${currentAbility.emoji} **${currentAbility.name}**` : ''}\n\n**Choose your action:**`)
    .addFields(
      { 
        name: `${battle.player1Character.emoji} ${battle.player1Character.name}`, 
        value: `HP: ${createHPBar(battle.player1HP, battle.player1MaxHP)}${battle.player1Shield > 0 ? `\n🛡️ Shield: ${battle.player1Shield}` : ''}\n⚡ ${createEnergyBar(battle.player1Energy, MAX_ENERGY)}${effectsDisplay1 ? `\n${effectsDisplay1}` : ''}`, 
        inline: false 
      },
      { 
        name: `${battle.player2Character.emoji} ${battle.player2Character.name}`, 
        value: `HP: ${createHPBar(battle.player2HP, battle.player2MaxHP)}${battle.player2Shield > 0 ? `\n🛡️ Shield: ${battle.player2Shield}` : ''}\n⚡ ${createEnergyBar(battle.player2Energy, MAX_ENERGY)}${effectsDisplay2 ? `\n${effectsDisplay2}` : ''}`, 
        inline: false 
      }
    );
  
  const turnMessage = await channel.send({ embeds: [turnEmbed], components: rows });
  
  const filter = (interaction) => {
    return interaction.user.id === currentPlayer && 
           (interaction.customId.endsWith(battle.id));
  };
  
  const collector = turnMessage.createMessageComponentCollector({ filter, max: 1, time: 60000 });
  
  collector.on('collect', async (interaction) => {
    if (interaction.customId === `flee_${battle.id}`) {
      const winner = isPlayer1 ? battle.player2 : battle.player1;
      await interaction.update({ content: `💨 ${currentChar.emoji} ${currentChar.name} fled from battle!`, embeds: [], components: [] });
      await endBattle(battle, channel, data, 'flee', winner);
      return;
    } else if (interaction.customId === `items_${battle.id}`) {
      await showItemMenu(interaction, battle, data, isPlayer1);
      return;
    } else if (interaction.customId.startsWith('move_')) {
      const moveIndex = parseInt(interaction.customId.split('_')[1]);
      await executeMove(interaction, battle, channel, data, moveIndex, isPlayer1);
    }
  });
  
  collector.on('end', (collected, reason) => {
    if (reason === 'time' && activeBattles.has(battle.player1)) {
      channel.send(`⏱️ <@${currentPlayer}> took too long! Battle ended.`);
      const winner = isPlayer1 ? battle.player2 : battle.player1;
      endBattle(battle, channel, data, 'timeout', winner);
    }
  });
}

async function showItemMenu(interaction, battle, data, isPlayer1) {
  const userId = isPlayer1 ? battle.player1 : battle.player2;
  const user = data.users[userId];
  const items = getUserBattleItems(user);
  
  if (items.length === 0) {
    await interaction.reply({ content: '❌ You don\'t have any battle items! Visit the shop with `!shop`.', ephemeral: true });
    return;
  }
  
  const itemButtons = items.slice(0, 5).map(item => 
    new ButtonBuilder()
      .setCustomId(`use_item_${item.id}_${battle.id}`)
      .setLabel(`${item.emoji} ${item.name} (${item.count})`)
      .setStyle(ButtonStyle.Success)
  );
  
  const backButton = new ButtonBuilder()
    .setCustomId(`back_to_battle_${battle.id}`)
    .setLabel('Back')
    .setStyle(ButtonStyle.Secondary);
  
  const rows = [];
  if (itemButtons.length > 0) {
    rows.push(new ActionRowBuilder().addComponents(itemButtons.slice(0, Math.min(5, itemButtons.length))));
  }
  rows.push(new ActionRowBuilder().addComponents(backButton));
  
  const itemEmbed = new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle('🎒 Battle Items')
    .setDescription(items.map(i => `${i.emoji} **${i.name}** x${i.count}\n${i.description}`).join('\n\n'))
    .setFooter({ text: 'Select an item to use' });
  
  await interaction.update({ embeds: [itemEmbed], components: rows });
  
  const filter = (i) => i.user.id === userId && i.customId.endsWith(battle.id);
  const collector = interaction.message.createMessageComponentCollector({ filter, max: 1, time: 30000 });
  
  collector.on('collect', async (i) => {
    if (i.customId === `back_to_battle_${battle.id}`) {
      await i.update({ content: 'Returning to battle...', embeds: [], components: [] });
      await promptTurn(battle, battle.channel, data);
    } else if (i.customId.startsWith('use_item_')) {
      const itemId = i.customId.split('_')[2];
      await useItemInBattle(i, battle, data, itemId, isPlayer1);
    }
  });
}

async function useItemInBattle(interaction, battle, data, itemId, isPlayer1) {
  const userId = isPlayer1 ? battle.player1 : battle.player2;
  const user = data.users[userId];
  const char = isPlayer1 ? battle.player1Character : battle.player2Character;
  
  const result = useItem(user, itemId);
  
  if (!result.success) {
    await interaction.update({ content: `❌ ${result.message}`, embeds: [], components: [] });
    return;
  }
  
  const effect = result.effect;
  let message = `${result.item.emoji} ${char.emoji} **${char.name}** used **${result.item.name}**!\n\n`;
  
  if (effect.type === 'heal') {
    const currentHP = isPlayer1 ? battle.player1HP : battle.player2HP;
    const maxHP = isPlayer1 ? battle.player1MaxHP : battle.player2MaxHP;
    const healAmount = Math.min(effect.value, maxHP - currentHP);
    
    if (isPlayer1) {
      battle.player1HP = Math.min(battle.player1HP + healAmount, battle.player1MaxHP);
    } else {
      battle.player2HP = Math.min(battle.player2HP + healAmount, battle.player2MaxHP);
    }
    
    message += `💚 Restored ${healAmount} HP!`;
  } else if (effect.type === 'energy') {
    const currentEnergy = isPlayer1 ? battle.player1Energy : battle.player2Energy;
    const energyGain = Math.min(effect.value, MAX_ENERGY - currentEnergy);
    
    if (isPlayer1) {
      battle.player1Energy = Math.min(battle.player1Energy + energyGain, MAX_ENERGY);
    } else {
      battle.player2Energy = Math.min(battle.player2Energy + energyGain, MAX_ENERGY);
    }
    
    message += `⚡ Restored ${energyGain} energy!`;
  } else if (effect.type === 'buff') {
    const buffs = isPlayer1 ? battle.player1Buffs : battle.player2Buffs;
    buffs[effect.stat] = { value: effect.value, duration: effect.duration };
    if (isPlayer1) {
      battle.player1Buffs = buffs;
    } else {
      battle.player2Buffs = buffs;
    }
    message += `✨ ${effect.stat.toUpperCase()} boosted for ${effect.duration} turns!`;
  } else if (effect.type === 'cleanse') {
    clearAllEffects(battle, userId);
    message += `✨ All negative effects removed!`;
  }
  
  saveData(data);
  
  await interaction.update({ content: message, embeds: [], components: [] });
  
  setTimeout(() => {
    if (activeBattles.has(battle.player1)) {
      promptTurn(battle, battle.channel, data);
    }
  }, 2000);
}

async function executeMove(interaction, battle, channel, data, moveIndex, isPlayer1) {
  const currentChar = isPlayer1 ? battle.player1Character : battle.player2Character;
  const opponentChar = isPlayer1 ? battle.player2Character : battle.player1Character;
  const currentAbility = isPlayer1 ? battle.player1Ability : battle.player2Ability;
  const currentAbilityState = isPlayer1 ? battle.player1AbilityState : battle.player2AbilityState;
  
  const moves = currentChar.moves;
  const allMoves = [moves.special, ...moves.tierMoves];
  const selectedMove = allMoves[moveIndex];
  const isSpecial = moveIndex === 0;
  
  let energyCost = calculateEnergyCost(selectedMove, isSpecial);
  
  if (currentAbility && currentAbility.effect.energyCostReduction) {
    energyCost = Math.round(energyCost * (1 - currentAbility.effect.energyCostReduction));
  }
  if (currentAbility && currentAbility.effect.normalMoveCostReduction && !isSpecial) {
    energyCost = Math.round(energyCost * (1 - currentAbility.effect.normalMoveCostReduction));
  }
  
  const currentEnergy = isPlayer1 ? battle.player1Energy : battle.player2Energy;
  
  if (currentEnergy < energyCost) {
    await interaction.update({ content: '❌ Not enough energy!', embeds: [], components: [] });
    await promptTurn(battle, channel, data);
    return;
  }
  
  if (isPlayer1) {
    battle.player1Energy -= energyCost;
  } else {
    battle.player2Energy -= energyCost;
  }
  
  if (currentAbility && currentAbility.effect.specialEnergyRefund && isSpecial) {
    const refund = Math.round(energyCost * currentAbility.effect.specialEnergyRefund);
    if (isPlayer1) {
      battle.player1Energy = Math.min(battle.player1Energy + refund, MAX_ENERGY);
    } else {
      battle.player2Energy = Math.min(battle.player2Energy + refund, MAX_ENERGY);
    }
  }
  
  let baseDamage = calculateDamage(selectedMove, currentChar.level, currentChar.st, isSpecial);
  
  if (baseDamage > 0) {
    let critChance = 0.15;
    
    if (currentAbility && currentAbility.effect.criticalChanceBonus) {
      critChance += currentAbility.effect.criticalChanceBonus;
    }
    
    const buffs = isPlayer1 ? battle.player1Buffs : battle.player2Buffs;
    if (buffs.critical) {
      critChance += buffs.critical.value / 100;
    }
    
    const opponentAbility = isPlayer1 ? battle.player2Ability : battle.player1Ability;
    if (opponentAbility && opponentAbility.effect.opponentCritReduction) {
      critChance = Math.max(0, critChance - opponentAbility.effect.opponentCritReduction);
    }
    
    const critResult = calculateCriticalHit(baseDamage, critChance);
    baseDamage = critResult.damage;
    const isCritical = critResult.isCritical;
    
    if (isCritical && currentAbility && currentAbility.effect.criticalDamageBonus) {
      baseDamage = Math.round(baseDamage * (1 + currentAbility.effect.criticalDamageBonus));
    }
    
    if (isCritical && currentAbility && currentAbility.effect.criticalEnergyGain) {
      if (isPlayer1) {
        battle.player1Energy = Math.min(battle.player1Energy + currentAbility.effect.criticalEnergyGain, MAX_ENERGY);
      } else {
        battle.player2Energy = Math.min(battle.player2Energy + currentAbility.effect.criticalEnergyGain, MAX_ENERGY);
      }
    }
    
    if (currentAbility && currentAbility.effect.firstAttackBonus && !currentAbilityState.firstAttackUsed) {
      baseDamage = Math.round(baseDamage * (1 + currentAbility.effect.firstAttackBonus));
      currentAbilityState.firstAttackUsed = true;
    }
    
    if (currentAbility && currentAbility.effect.specialDamageBonus && isSpecial) {
      baseDamage = Math.round(baseDamage * (1 + currentAbility.effect.specialDamageBonus));
    }
    
    if (currentAbility && currentAbility.effect.flatDamageBonus) {
      baseDamage += currentAbility.effect.flatDamageBonus;
    }
    
    if (buffs.attack) {
      baseDamage = Math.round(baseDamage * buffs.attack.value);
    }
    
    const opponentBuffs = isPlayer1 ? battle.player2Buffs : battle.player1Buffs;
    if (opponentBuffs.defense) {
      baseDamage = Math.round(baseDamage * opponentBuffs.defense.value);
    }
    
    if (opponentAbility && opponentAbility.effect.damageReduction) {
      baseDamage = Math.round(baseDamage * (1 - opponentAbility.effect.damageReduction));
    }
    
    const opponentHP = isPlayer1 ? battle.player2HP : battle.player1HP;
    const opponentMaxHP = isPlayer1 ? battle.player2MaxHP : battle.player1MaxHP;
    let opponentShield = isPlayer1 ? battle.player2Shield : battle.player1Shield;
    
    if (opponentAbility && opponentAbility.effect.firstHitReduction && !((isPlayer1 ? battle.player2AbilityState : battle.player1AbilityState).firstHitTaken)) {
      baseDamage = Math.round(baseDamage * (1 - opponentAbility.effect.firstHitReduction));
      if (isPlayer1) {
        battle.player2AbilityState.firstHitTaken = true;
      } else {
        battle.player1AbilityState.firstHitTaken = true;
      }
    }
    
    if (opponentAbility && opponentAbility.effect.damageBlock && opponentShield === 0) {
      const blockRemaining = opponentAbility.effect.damageBlock - ((isPlayer1 ? battle.player2AbilityState : battle.player1AbilityState).damageBlocked || 0);
      if (blockRemaining > 0) {
        const blocked = Math.min(baseDamage, blockRemaining);
        baseDamage = Math.max(0, baseDamage - blocked);
        if (isPlayer1) {
          battle.player2AbilityState.damageBlocked = (battle.player2AbilityState.damageBlocked || 0) + blocked;
        } else {
          battle.player1AbilityState.damageBlocked = (battle.player1AbilityState.damageBlocked || 0) + blocked;
        }
      }
    }
    
    let finalDamage = baseDamage;
    if (opponentShield > 0) {
      const shieldDamage = Math.min(opponentShield, finalDamage);
      opponentShield -= shieldDamage;
      finalDamage -= shieldDamage;
      
      if (isPlayer1) {
        battle.player2Shield = opponentShield;
      } else {
        battle.player1Shield = opponentShield;
      }
    }
    
    if (isPlayer1) {
      battle.player2HP = Math.max(0, battle.player2HP - finalDamage);
    } else {
      battle.player1HP = Math.max(0, battle.player1HP - finalDamage);
    }
    
    if (currentAbility && currentAbility.effect.lifesteal) {
      const lifeStealAmount = Math.round(finalDamage * currentAbility.effect.lifesteal);
      if (isPlayer1) {
        battle.player1HP = Math.min(battle.player1HP + lifeStealAmount, battle.player1MaxHP);
      } else {
        battle.player2HP = Math.min(battle.player2HP + lifeStealAmount, battle.player2MaxHP);
      }
    }
    
    if (currentAbility && currentAbility.effect.energySteal) {
      const energyStolen = currentAbility.effect.energySteal;
      if (isPlayer1) {
        battle.player1Energy = Math.min(battle.player1Energy + energyStolen, MAX_ENERGY);
        battle.player2Energy = Math.max(0, battle.player2Energy - energyStolen);
      } else {
        battle.player2Energy = Math.min(battle.player2Energy + energyStolen, MAX_ENERGY);
        battle.player1Energy = Math.max(0, battle.player1Energy - energyStolen);
      }
    }
    
    if (currentAbility && currentAbility.effect.damageToEnergy) {
      const energyGained = Math.floor(finalDamage / 10);
      if (isPlayer1) {
        battle.player1Energy = Math.min(battle.player1Energy + energyGained, MAX_ENERGY);
      } else {
        battle.player2Energy = Math.min(battle.player2Energy + energyGained, MAX_ENERGY);
      }
    }
    
    if (currentAbility && currentAbility.effect.burnChance && Math.random() < currentAbility.effect.burnChance) {
      applyEffect(battle, isPlayer1 ? battle.player2 : battle.player1, MOVE_EFFECTS.BURN, 3);
    }
    
    if (currentAbility && currentAbility.effect.paralyzeChance && Math.random() < currentAbility.effect.paralyzeChance) {
      applyEffect(battle, isPlayer1 ? battle.player2 : battle.player1, MOVE_EFFECTS.PARALYZE, 1);
    }
    
    if (currentAbility && currentAbility.effect.freezeChance && Math.random() < currentAbility.effect.freezeChance) {
      applyEffect(battle, isPlayer1 ? battle.player2 : battle.player1, MOVE_EFFECTS.FREEZE, 1);
    }
    
    const attackEmbed = new EmbedBuilder()
      .setColor(isCritical ? '#FF0000' : '#FFA500')
      .setTitle(isCritical ? '💥 CRITICAL HIT!' : '⚔️ Attack!')
      .setDescription(`${currentChar.emoji} **${currentChar.name}** used **${selectedMove.name}**!\n\nDealt ${finalDamage} damage to ${opponentChar.emoji} **${opponentChar.name}**!${isCritical ? ' ⭐' : ''}`)
      .setFooter({ text: `Energy used: ${energyCost}⚡` });
    
    await interaction.update({ embeds: [attackEmbed], components: [] });
  } else if (baseDamage < 0) {
    const healAmount = Math.abs(baseDamage);
    const currentHP = isPlayer1 ? battle.player1HP : battle.player2HP;
    const maxHP = isPlayer1 ? battle.player1MaxHP : battle.player2MaxHP;
    const actualHeal = Math.min(healAmount, maxHP - currentHP);
    
    if (currentAbility && currentAbility.effect.healingBonus) {
      const bonusHeal = Math.round(actualHeal * currentAbility.effect.healingBonus);
      if (isPlayer1) {
        battle.player1HP = Math.min(battle.player1HP + actualHeal + bonusHeal, battle.player1MaxHP);
      } else {
        battle.player2HP = Math.min(battle.player2HP + actualHeal + bonusHeal, battle.player2MaxHP);
      }
    } else {
      if (isPlayer1) {
        battle.player1HP = Math.min(battle.player1HP + actualHeal, battle.player1MaxHP);
      } else {
        battle.player2HP = Math.min(battle.player2HP + actualHeal, battle.player2MaxHP);
      }
    }
    
    if (currentAbility && currentAbility.effect.healToEnergy) {
      if (isPlayer1) {
        battle.player1Energy = Math.min(battle.player1Energy + currentAbility.effect.healToEnergy, MAX_ENERGY);
      } else {
        battle.player2Energy = Math.min(battle.player2Energy + currentAbility.effect.healToEnergy, MAX_ENERGY);
      }
    }
    
    if (currentAbility && currentAbility.effect.healRestoresEnergy) {
      if (isPlayer1) {
        battle.player1Energy = Math.min(battle.player1Energy + currentAbility.effect.healRestoresEnergy, MAX_ENERGY);
      } else {
        battle.player2Energy = Math.min(battle.player2Energy + currentAbility.effect.healRestoresEnergy, MAX_ENERGY);
      }
    }
    
    const healEmbed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('💚 Heal!')
      .setDescription(`${currentChar.emoji} **${currentChar.name}** used **${selectedMove.name}**!\n\nRestored ${actualHeal} HP!`)
      .setFooter({ text: `Energy used: ${energyCost}⚡` });
    
    await interaction.update({ embeds: [healEmbed], components: [] });
  } else {
    const buffEmbed = new EmbedBuilder()
      .setColor('#FFFF00')
      .setTitle('✨ Support Move!')
      .setDescription(`${currentChar.emoji} **${currentChar.name}** used **${selectedMove.name}**!`)
      .setFooter({ text: `Energy used: ${energyCost}⚡` });
    
    await interaction.update({ embeds: [buffEmbed], components: [] });
  }
  
  if ((isPlayer1 ? battle.player2HP : battle.player1HP) <= 0) {
    const winner = isPlayer1 ? battle.player1 : battle.player2;
    await endBattle(battle, channel, data, 'knockout', winner);
    return;
  }
  
  battle.currentTurn = isPlayer1 ? battle.player2 : battle.player1;
  
  setTimeout(() => {
    if (activeBattles.has(battle.player1)) {
      promptTurn(battle, channel, data);
    }
  }, 3000);
}

async function endBattle(battle, channel, data, reason, winner = null) {
  clearTimeout(battle.timeout);
  activeBattles.delete(battle.player1);
  activeBattles.delete(battle.player2);
  
  if (reason === 'timeout') {
    const timeoutEmbed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('⏱️ Battle Timeout')
      .setDescription('The battle has ended due to inactivity.');
    
    await channel.send({ embeds: [timeoutEmbed] });
  } else if (reason === 'flee' || reason === 'knockout') {
    const loser = winner === battle.player1 ? battle.player2 : battle.player1;
    
    data.users[winner].trophies = Math.min(9999, (data.users[winner].trophies || 200) + 5);
    data.users[loser].trophies = Math.max(0, (data.users[loser].trophies || 200) - 7);
    
    if (!data.users[winner].questProgress) data.users[winner].questProgress = {};
    data.users[winner].questProgress.battlesWon = (data.users[winner].questProgress.battlesWon || 0) + 1;
    
    await eventSystem.recordProgress(winner, data.users[winner].username, 5, 'trophy_hunt');
    
    saveData(data);
    
    if (reason === 'flee') {
      const fleeEmbed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('🏆 Victory by Forfeit!')
        .setDescription(`<@${winner}> wins the battle!\n\n**Trophy Changes:**\n🏆 <@${winner}>: +5 (${data.users[winner].trophies})\n🏆 <@${loser}>: -7 (${data.users[loser].trophies})`);
      
      await channel.send({ embeds: [fleeEmbed] });
    } else {
      const winnerChar = winner === battle.player1 ? battle.player1Character : battle.player2Character;
      const loserChar = winner === battle.player1 ? battle.player2Character : battle.player1Character;
      
      const victoryEmbed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('🏆 VICTORY!')
        .setDescription(`${winnerChar.emoji} **${winnerChar.name}** defeated ${loserChar.emoji} **${loserChar.name}**!\n\n<@${winner}> wins the battle!\n\n**Trophy Changes:**\n🏆 <@${winner}>: +5 (${data.users[winner].trophies})\n🏆 <@${loser}>: -7 (${data.users[loser].trophies})`)
        .addFields(
          { name: `${battle.player1Character.emoji} ${battle.player1Character.name}`, value: `HP: ${battle.player1HP}/${battle.player1MaxHP}`, inline: true },
          { name: `${battle.player2Character.emoji} ${battle.player2Character.name}`, value: `HP: ${battle.player2HP}/${battle.player2MaxHP}`, inline: true }
        );
      
      await channel.send({ embeds: [victoryEmbed] });
    }
  }
}

module.exports = {
  initiateBattle
};
