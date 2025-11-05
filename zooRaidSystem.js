const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { saveDataImmediate } = require('./dataManager.js');
const { calculateBaseHP, assignMovesToCharacter, calculateEnergyCost, calculateDamage } = require('./battleUtils.js');
const { getCharacterAbility } = require('./characterAbilities.js');
const { MOVE_EFFECTS, applyEffect, processEffects, hasEffect, getEffectsDisplay } = require('./moveEffects.js');
const { getCollection } = require('./mongoManager.js');

const RAID_CHANNEL_ID = '1435599092679049319';
const SERVER_ID = '1430516117851340893';
const RAID_INTERVAL = 60 * 60 * 1000;
const RAID_DURATION = 60 * 60 * 1000;
const INACTIVITY_TIMEOUT = 10 * 60 * 1000;
const STARTING_ENERGY = 50;
const ENERGY_PER_TURN = 10;
const MAX_ENERGY = 100;

const RAID_BOSS_CHARACTERS = ['Frank', 'Duke', 'Bruce', 'Wanda', 'Zac', 'Jade', 'Tony', 'Ursula', 'Pepper', 'Finn'];

let activeRaid = null;
let raidScheduler = null;
let client = null;
let data = null;

function createHPBar(current, max, length = 20) {
  const percent = Math.max(0, Math.min(100, (current / max) * 100));
  const filled = Math.round((percent / 100) * length);
  const empty = length - filled;
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${percent.toFixed(1)}%`;
}

async function getRaidCollection() {
  return await getCollection('raids');
}

async function getNextRaidNumber() {
  try {
    const collection = await getRaidCollection();
    const latestRaid = await collection.find({}).sort({ raidNumber: -1 }).limit(1).toArray();
    return latestRaid.length > 0 ? latestRaid[0].raidNumber + 1 : 1;
  } catch (error) {
    console.error('Error getting next raid number:', error);
    return 1;
  }
}

function createRaidBoss(CHARACTERS) {
  const bossName = RAID_BOSS_CHARACTERS[Math.floor(Math.random() * RAID_BOSS_CHARACTERS.length)];
  const charData = CHARACTERS.find(c => c.name === bossName);
  
  const level = Math.floor(Math.random() * 5) + 10;
  const st = Math.floor(Math.random() * 10) + 90;
  
  const moves = assignMovesToCharacter(charData.name, st);
  const baseHp = calculateBaseHP(st) * 15;
  const ability = getCharacterAbility(charData.name);
  
  return {
    ...charData,
    level,
    st,
    moves,
    baseHp,
    ability,
    isBoss: true
  };
}

async function startNewRaid(forceStart = false) {
  if (!client || !data) {
    console.log('⚠️ Client or data not initialized for raids');
    return;
  }

  const guild = client.guilds.cache.get(SERVER_ID);
  if (!guild) {
    console.log('⚠️ Raid server not found');
    return;
  }

  const channel = guild.channels.cache.get(RAID_CHANNEL_ID);
  if (!channel) {
    console.log('⚠️ Raid channel not found');
    return;
  }

  if (activeRaid && !forceStart) {
    console.log('⚠️ Raid already in progress');
    return;
  }

  const CHARACTERS = require('./characters.js');
  const boss = createRaidBoss(CHARACTERS);
  const raidNumber = await getNextRaidNumber();

  activeRaid = {
    raidNumber,
    boss,
    bossHP: boss.baseHp,
    bossMaxHP: boss.baseHp,
    bossEnergy: STARTING_ENERGY,
    bossShield: 0,
    participants: new Map(),
    deadParticipants: new Set(),
    damageDealt: new Map(),
    startTime: Date.now(),
    endTime: Date.now() + RAID_DURATION,
    channel,
    bossAbility: boss.ability,
    bossAbilityState: {},
    effects: { boss: [] },
    currentTurnPlayer: null,
    turnQueue: [],
    lastActivityTime: new Map(),
    isActive: true
  };

  if (boss.ability && boss.ability.effect.startingEnergyBonus) {
    activeRaid.bossEnergy += boss.ability.effect.startingEnergyBonus;
  }
  if (boss.ability && boss.ability.effect.startingShield) {
    activeRaid.bossShield = Math.round(boss.baseHp * boss.ability.effect.startingShield);
  }

  await saveRaidToDatabase(activeRaid, 'active');

  const startEmbed = new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle(`🦁 ZOO RAID #${raidNumber} - BOSS ALERT!`)
    .setDescription(`A wild **${boss.emoji} ${boss.name}** has appeared!\n\n**Level ${boss.level}** | **ST: ${boss.st}%**\n${createHPBar(activeRaid.bossHP, activeRaid.bossMaxHP, 30)}\n**${activeRaid.bossHP.toLocaleString()}/${activeRaid.bossMaxHP.toLocaleString()} HP**\n\n${boss.ability ? `**Boss Ability:** ${boss.ability.emoji} ${boss.ability.name}\n${boss.ability.description}\n\n` : ''}Use \`!joinraid\` to enter the battle!\n\n⏰ Raid ends in **60 minutes** or when the boss is defeated!`)
    .setFooter({ text: 'Work together to defeat the boss and earn rewards!' })
    .setTimestamp();

  await channel.send({ embeds: [startEmbed] });

  setTimeout(() => {
    endRaid('timeout');
  }, RAID_DURATION);

  console.log(`✅ Raid #${raidNumber} started with boss ${boss.name}`);
}

async function joinRaid(message, userId, characterName) {
  if (!message.guild || message.guild.id !== SERVER_ID) {
    await message.reply('❌ Raids are not available in this server!');
    return;
  }

  if (!activeRaid || !activeRaid.isActive) {
    await message.reply('❌ There is no active raid right now!');
    return;
  }

  if (activeRaid.participants.has(userId)) {
    await message.reply('❌ You have already joined this raid!');
    return;
  }

  if (activeRaid.deadParticipants.has(userId)) {
    await message.reply('❌ You died in this raid and cannot rejoin!');
    return;
  }

  if (!data.users[userId]) {
    await message.reply('❌ You need to use `!start` first!');
    return;
  }

  if (data.users[userId].characters.length === 0) {
    await message.reply('❌ You don\'t have any characters! Use `!start` and `!select` to get started.');
    return;
  }

  if (!characterName) {
    const charList = data.users[userId].characters.map(c => `${c.emoji} **${c.name}** (Lvl ${c.level}, ST: ${c.st}%)`).join('\n');
    const selectEmbed = new EmbedBuilder()
      .setColor('#3498DB')
      .setTitle(`🎮 Join Raid #${activeRaid.raidNumber}`)
      .setDescription(`Select a character by using: \`!joinraid <character name>\`\n\n**Your Characters:**\n${charList}`);
    await message.reply({ embeds: [selectEmbed] });
    return;
  }

  const selectedChar = data.users[userId].characters.find(c => c.name.toLowerCase() === characterName.toLowerCase().trim());
  
  if (!selectedChar) {
    await message.reply('❌ You don\'t own that character! Try again with `!joinraid <character name>`');
    return;
  }

  if (!selectedChar.moves || !selectedChar.baseHp) {
    await message.reply('❌ This character doesn\'t have moves assigned yet!');
    return;
  }

  const playerAbility = getCharacterAbility(selectedChar.name);
  
  const participant = {
    userId,
    username: data.users[userId].username,
    character: selectedChar,
    hp: selectedChar.baseHp,
    maxHP: selectedChar.baseHp,
    energy: STARTING_ENERGY,
    shield: 0,
    ability: playerAbility,
    abilityState: {},
    effects: [],
    totalDamage: 0,
    joinedAt: Date.now()
  };

  if (playerAbility && playerAbility.effect.startingEnergyBonus) {
    participant.energy += playerAbility.effect.startingEnergyBonus;
  }
  if (playerAbility && playerAbility.effect.startingShield) {
    participant.shield = Math.round(selectedChar.baseHp * playerAbility.effect.startingShield);
  }

  activeRaid.participants.set(userId, participant);
  activeRaid.damageDealt.set(userId, 0);
  activeRaid.lastActivityTime.set(userId, Date.now());
  activeRaid.turnQueue.push(userId);

  await saveRaidToDatabase(activeRaid, 'active');

  const joinEmbed = new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle('✅ Joined Raid!')
    .setDescription(`${selectedChar.emoji} **${selectedChar.name}** has joined the battle against **${activeRaid.boss.emoji} ${activeRaid.boss.name}**!\n\n**Participants:** ${activeRaid.participants.size}\n\n${playerAbility ? `Your Ability: ${playerAbility.emoji} **${playerAbility.name}**\n${playerAbility.description}` : ''}`);

  await message.reply({ embeds: [joinEmbed] });

  if (activeRaid.participants.size === 1) {
    setTimeout(() => processTurns(), 3000);
  }
}

async function processTurns() {
  if (!activeRaid || !activeRaid.isActive || activeRaid.participants.size === 0) {
    return;
  }

  checkInactivity();

  if (activeRaid.turnQueue.length === 0) {
    activeRaid.turnQueue = Array.from(activeRaid.participants.keys());
  }

  const currentUserId = activeRaid.turnQueue.shift();
  const participant = activeRaid.participants.get(currentUserId);

  if (!participant || participant.hp <= 0) {
    setTimeout(() => processTurns(), 1000);
    return;
  }

  activeRaid.currentTurnPlayer = currentUserId;
  
  participant.energy = Math.min(participant.energy + ENERGY_PER_TURN, MAX_ENERGY);
  
  if (participant.ability && participant.ability.effect.energyRegenPerTurn) {
    participant.energy = Math.min(participant.energy + participant.ability.effect.energyRegenPerTurn, MAX_ENERGY);
  }
  
  if (participant.ability && participant.ability.effect.healPerTurn) {
    const healAmount = Math.round(participant.maxHP * participant.ability.effect.healPerTurn);
    participant.hp = Math.min(participant.hp + healAmount, participant.maxHP);
    await activeRaid.channel.send(`${participant.ability.emoji} **${participant.ability.name}**: ${participant.character.emoji} ${participant.character.name} healed ${healAmount} HP!`);
  }

  await promptPlayerTurn(participant);
}

async function promptPlayerTurn(participant) {
  const moves = participant.character.moves;
  const allMoves = [moves.special, ...moves.tierMoves];
  
  const hpBar = createHPBar(participant.hp, participant.maxHP);
  const bossHPBar = createHPBar(activeRaid.bossHP, activeRaid.bossMaxHP, 30);
  
  const turnEmbed = new EmbedBuilder()
    .setColor('#3498DB')
    .setTitle(`⚔️ ${participant.character.emoji} ${participant.character.name}'s Turn!`)
    .setDescription(`**Your Stats:**\n${hpBar} **${participant.hp}/${participant.maxHP} HP**\n⚡ ${participant.energy}/${MAX_ENERGY} Energy${participant.shield > 0 ? `\n🛡️ Shield: ${participant.shield}` : ''}\n\n**VS**\n\n**${activeRaid.boss.emoji} ${activeRaid.boss.name} (BOSS)**\n${bossHPBar}\n**${activeRaid.bossHP.toLocaleString()}/${activeRaid.bossMaxHP.toLocaleString()} HP**\n⚡ ${activeRaid.bossEnergy}/${MAX_ENERGY} Energy${activeRaid.bossShield > 0 ? `\n🛡️ Shield: ${activeRaid.bossShield}` : ''}\n\n**Participants:** ${activeRaid.participants.size} | **Time Left:** ${Math.round((activeRaid.endTime - Date.now()) / 60000)} min`)
    .setFooter({ text: 'Select your move! (10 min timeout)' });

  const moveButtons = [];
  for (let i = 0; i < allMoves.length && i < 5; i++) {
    const move = allMoves[i];
    const isSpecial = i === 0;
    let energyCost = calculateEnergyCost(move, isSpecial);
    
    if (participant.ability && participant.ability.effect.energyCostReduction) {
      energyCost = Math.round(energyCost * (1 - participant.ability.effect.energyCostReduction));
    }
    
    const damage = calculateDamage(move, participant.character.level, participant.character.st, isSpecial);
    const label = damage > 0 ? `${move.name} (${damage} DMG, ${energyCost}⚡)` : 
                  damage < 0 ? `${move.name} (Heal ${Math.abs(damage)}, ${energyCost}⚡)` : 
                  `${move.name} (${energyCost}⚡)`;
    
    moveButtons.push(
      new ButtonBuilder()
        .setCustomId(`raid_move_${i}_${participant.userId}`)
        .setLabel(label.substring(0, 80))
        .setStyle(participant.energy >= energyCost ? ButtonStyle.Primary : ButtonStyle.Secondary)
        .setDisabled(participant.energy < energyCost)
    );
  }
  
  const passButton = new ButtonBuilder()
    .setCustomId(`raid_pass_${participant.userId}`)
    .setLabel('Pass Turn')
    .setStyle(ButtonStyle.Secondary);
  
  const rows = [];
  for (let i = 0; i < moveButtons.length; i += 3) {
    rows.push(new ActionRowBuilder().addComponents(moveButtons.slice(i, i + 3)));
  }
  rows.push(new ActionRowBuilder().addComponents(passButton));
  
  try {
    const turnMessage = await activeRaid.channel.send({ 
      content: `<@${participant.userId}>`,
      embeds: [turnEmbed], 
      components: rows 
    });
    
    const filter = (interaction) => {
      return interaction.user.id === participant.userId && 
             (interaction.customId.startsWith('raid_move_') || interaction.customId.startsWith('raid_pass_'));
    };
    
    const collector = turnMessage.createMessageComponentCollector({ filter, time: INACTIVITY_TIMEOUT });
    
    collector.on('collect', async (interaction) => {
      activeRaid.lastActivityTime.set(participant.userId, Date.now());
      
      if (interaction.customId.startsWith('raid_pass_')) {
        await interaction.update({ content: `${participant.character.emoji} **${participant.character.name}** passed their turn!`, embeds: [], components: [] });
        
        setTimeout(() => executeBossTurn(), 2000);
      } else {
        const moveIndex = parseInt(interaction.customId.split('_')[2]);
        await executePlayerMove(participant, moveIndex, interaction);
      }
      
      collector.stop();
    });
    
    collector.on('end', (collected, reason) => {
      if (reason === 'time' && activeRaid && activeRaid.isActive) {
        activeRaid.channel.send(`⏰ ${participant.character.emoji} **${participant.character.name}** took too long and was marked as inactive!`);
        handleInactivePlayer(participant.userId);
      }
    });
  } catch (error) {
    console.error('Error prompting player turn:', error);
    setTimeout(() => processTurns(), 2000);
  }
}

async function executePlayerMove(participant, moveIndex, interaction) {
  const moves = participant.character.moves;
  const allMoves = [moves.special, ...moves.tierMoves];
  const move = allMoves[moveIndex];
  const isSpecial = moveIndex === 0;
  
  let energyCost = calculateEnergyCost(move, isSpecial);
  if (participant.ability && participant.ability.effect.energyCostReduction) {
    energyCost = Math.round(energyCost * (1 - participant.ability.effect.energyCostReduction));
  }
  
  participant.energy -= energyCost;
  
  let damage = calculateDamage(move, participant.character.level, participant.character.st, isSpecial);
  
  if (move.effect) {
    applyEffect(activeRaid, 'boss', move.effect, damage);
  }
  
  if (damage > 0) {
    if (activeRaid.bossShield > 0) {
      const shieldDamage = Math.min(damage, activeRaid.bossShield);
      activeRaid.bossShield -= shieldDamage;
      damage -= shieldDamage;
      
      if (shieldDamage > 0) {
        await interaction.update({ 
          content: `${participant.character.emoji} **${participant.character.name}** used **${move.name}**!\n🛡️ Shield absorbed ${shieldDamage} damage!${damage > 0 ? `\n💥 Dealt ${damage} damage to the boss!` : ''}`,
          embeds: [], 
          components: [] 
        });
      }
    }
    
    if (damage > 0) {
      activeRaid.bossHP = Math.max(0, activeRaid.bossHP - damage);
      participant.totalDamage += damage;
      activeRaid.damageDealt.set(participant.userId, (activeRaid.damageDealt.get(participant.userId) || 0) + damage);
      
      if (interaction.replied || interaction.deferred) {
        await activeRaid.channel.send(`${participant.character.emoji} **${participant.character.name}** used **${move.name}**!\n💥 Dealt ${damage} damage to the boss!`);
      } else {
        await interaction.update({ 
          content: `${participant.character.emoji} **${participant.character.name}** used **${move.name}**!\n💥 Dealt ${damage} damage to the boss!`,
          embeds: [], 
          components: [] 
        });
      }
    }
  } else if (damage < 0) {
    const healAmount = Math.abs(damage);
    participant.hp = Math.min(participant.hp + healAmount, participant.maxHP);
    
    await interaction.update({ 
      content: `${participant.character.emoji} **${participant.character.name}** used **${move.name}**!\n💚 Healed ${healAmount} HP!`,
      embeds: [], 
      components: [] 
    });
  }
  
  await saveRaidToDatabase(activeRaid, 'active');
  
  if (activeRaid.bossHP <= 0) {
    setTimeout(() => endRaid('victory'), 2000);
  } else {
    setTimeout(() => executeBossTurn(), 2000);
  }
}

async function executeBossTurn() {
  if (!activeRaid || !activeRaid.isActive || activeRaid.bossHP <= 0) {
    return;
  }

  activeRaid.bossEnergy = Math.min(activeRaid.bossEnergy + ENERGY_PER_TURN, MAX_ENERGY);
  
  if (activeRaid.bossAbility && activeRaid.bossAbility.effect.energyRegenPerTurn) {
    activeRaid.bossEnergy = Math.min(activeRaid.bossEnergy + activeRaid.bossAbility.effect.energyRegenPerTurn, MAX_ENERGY);
  }
  
  if (activeRaid.bossAbility && activeRaid.bossAbility.effect.healPerTurn) {
    const healAmount = Math.round(activeRaid.bossMaxHP * activeRaid.bossAbility.effect.healPerTurn);
    activeRaid.bossHP = Math.min(activeRaid.bossHP + healAmount, activeRaid.bossMaxHP);
    await activeRaid.channel.send(`${activeRaid.bossAbility.emoji} **${activeRaid.bossAbility.name}**: ${activeRaid.boss.emoji} ${activeRaid.boss.name} healed ${healAmount} HP!`);
  }

  const decision = makeBossDecision();
  
  if (decision.type === 'pass') {
    await activeRaid.channel.send(`${activeRaid.boss.emoji} **${activeRaid.boss.name}** passes their turn!`);
  } else {
    await executeBossAttack(decision);
  }
  
  setTimeout(() => processTurns(), 2000);
}

function makeBossDecision() {
  const moves = activeRaid.boss.moves;
  const allMoves = [moves.special, ...moves.tierMoves];
  const bossEnergy = activeRaid.bossEnergy;
  
  if (bossEnergy < 15 && Math.random() < 0.3) {
    return { type: 'pass' };
  }
  
  const availableMoves = [];
  for (let i = 0; i < allMoves.length; i++) {
    const move = allMoves[i];
    const isSpecial = i === 0;
    let energyCost = calculateEnergyCost(move, isSpecial);
    
    if (activeRaid.bossAbility && activeRaid.bossAbility.effect.energyCostReduction) {
      energyCost = Math.round(energyCost * (1 - activeRaid.bossAbility.effect.energyCostReduction));
    }
    
    if (bossEnergy >= energyCost) {
      const damage = calculateDamage(move, activeRaid.boss.level, activeRaid.boss.st, isSpecial);
      availableMoves.push({ index: i, move, energyCost, damage, isSpecial });
    }
  }
  
  if (availableMoves.length === 0) {
    return { type: 'pass' };
  }
  
  const selectedMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
  return { type: 'move', moveIndex: selectedMove.index };
}

async function executeBossAttack(decision) {
  const moves = activeRaid.boss.moves;
  const allMoves = [moves.special, ...moves.tierMoves];
  const move = allMoves[decision.moveIndex];
  const isSpecial = decision.moveIndex === 0;
  
  let energyCost = calculateEnergyCost(move, isSpecial);
  if (activeRaid.bossAbility && activeRaid.bossAbility.effect.energyCostReduction) {
    energyCost = Math.round(energyCost * (1 - activeRaid.bossAbility.effect.energyCostReduction));
  }
  
  activeRaid.bossEnergy -= energyCost;
  
  const aliveParticipants = Array.from(activeRaid.participants.values()).filter(p => p.hp > 0);
  if (aliveParticipants.length === 0) {
    await endRaid('defeat');
    return;
  }
  
  const target = aliveParticipants[Math.floor(Math.random() * aliveParticipants.length)];
  
  let damage = calculateDamage(move, activeRaid.boss.level, activeRaid.boss.st, isSpecial);
  
  if (damage > 0) {
    if (target.shield > 0) {
      const shieldDamage = Math.min(damage, target.shield);
      target.shield -= shieldDamage;
      damage -= shieldDamage;
    }
    
    if (damage > 0) {
      target.hp = Math.max(0, target.hp - damage);
      
      await activeRaid.channel.send(`${activeRaid.boss.emoji} **${activeRaid.boss.name}** used **${move.name}** on ${target.character.emoji} **${target.character.name}**!\n💥 Dealt ${damage} damage!${target.hp <= 0 ? '\n💀 **They have been defeated!**' : ''}`);
      
      if (target.hp <= 0) {
        activeRaid.deadParticipants.add(target.userId);
      }
    }
  }
  
  await saveRaidToDatabase(activeRaid, 'active');
}

function checkInactivity() {
  if (!activeRaid || !activeRaid.isActive) return;
  
  const now = Date.now();
  const inactivePlayers = [];
  
  for (const [userId, lastActivity] of activeRaid.lastActivityTime.entries()) {
    if (now - lastActivity > INACTIVITY_TIMEOUT) {
      inactivePlayers.push(userId);
    }
  }
  
  for (const userId of inactivePlayers) {
    handleInactivePlayer(userId);
  }
}

function handleInactivePlayer(userId) {
  const participant = activeRaid.participants.get(userId);
  if (participant) {
    participant.hp = 0;
    activeRaid.deadParticipants.add(userId);
  }
}

async function endRaid(reason) {
  if (!activeRaid || !activeRaid.isActive) return;
  
  activeRaid.isActive = false;
  
  const sortedDamage = Array.from(activeRaid.damageDealt.entries())
    .filter(([userId, dmg]) => dmg > 0)
    .sort((a, b) => b[1] - a[1]);
  
  if (reason === 'victory') {
    const victoryEmbed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle(`🎉 RAID #${activeRaid.raidNumber} COMPLETE!`)
      .setDescription(`**${activeRaid.boss.emoji} ${activeRaid.boss.name}** has been defeated!\n\n**Total Participants:** ${activeRaid.participants.size}\n**Time Taken:** ${Math.round((Date.now() - activeRaid.startTime) / 60000)} minutes`);
    
    if (sortedDamage.length > 0) {
      const top3 = sortedDamage.slice(0, 3).map(([userId, dmg], index) => {
        const participant = activeRaid.participants.get(userId);
        const medals = ['🥇', '🥈', '🥉'];
        return `${medals[index]} <@${userId}> - ${participant.character.emoji} ${participant.character.name} - **${dmg.toLocaleString()}** damage`;
      }).join('\n');
      
      victoryEmbed.addFields({ name: '🏆 Top Damage Dealers', value: top3 });
    }
    
    await activeRaid.channel.send({ embeds: [victoryEmbed] });
    
    await distributeRewards(sortedDamage, 'victory');
  } else if (reason === 'defeat') {
    const defeatEmbed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle(`💀 RAID #${activeRaid.raidNumber} FAILED!`)
      .setDescription(`All participants have been defeated!\n\n**${activeRaid.boss.emoji} ${activeRaid.boss.name}** survives with **${activeRaid.bossHP.toLocaleString()} HP**!`);
    
    await activeRaid.channel.send({ embeds: [defeatEmbed] });
    
    await distributeRewards(sortedDamage, 'defeat');
  } else if (reason === 'timeout') {
    const timeoutEmbed = new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle(`⏰ RAID #${activeRaid.raidNumber} TIME'S UP!`)
      .setDescription(`The raid has ended!\n\n**${activeRaid.boss.emoji} ${activeRaid.boss.name}** survives with **${activeRaid.bossHP.toLocaleString()} HP**!`);
    
    await activeRaid.channel.send({ embeds: [timeoutEmbed] });
    
    await distributeRewards(sortedDamage, 'timeout');
  }
  
  await saveRaidToDatabase(activeRaid, 'completed');
  activeRaid = null;
}

async function distributeRewards(sortedDamage, outcome) {
  if (sortedDamage.length === 0) return;
  
  const rewardMessages = [];
  
  for (let i = 0; i < sortedDamage.length; i++) {
    const [userId, damage] = sortedDamage[i];
    const participant = activeRaid.participants.get(userId);
    
    if (!data.users[userId]) continue;
    
    let coins = 0;
    let gems = 0;
    let crates = '';
    let tokens = 0;
    
    if (outcome === 'victory') {
      coins = Math.floor(damage / 10) + 100;
      gems = Math.floor(damage / 50) + 20;
      
      if (i === 0) {
        data.users[userId].emeraldCrates = (data.users[userId].emeraldCrates || 0) + 1;
        crates = '🟢 **1 Emerald Crate**';
      } else if (i === 1) {
        data.users[userId].goldCrates = (data.users[userId].goldCrates || 0) + 2;
        crates = '🟡 **2 Gold Crates**';
      } else if (i === 2) {
        data.users[userId].goldCrates = (data.users[userId].goldCrates || 0) + 1;
        crates = '🟡 **1 Gold Crate**';
      }
      
      if (participant.character.name === activeRaid.boss.name) {
        tokens = Math.floor(Math.random() * 3) + 2;
        data.users[userId].pendingTokens = (data.users[userId].pendingTokens || 0) + tokens;
      }
    } else {
      coins = Math.floor(damage / 20) + 25;
      gems = Math.floor(damage / 100) + 5;
    }
    
    data.users[userId].coins = (data.users[userId].coins || 0) + coins;
    data.users[userId].gems = (data.users[userId].gems || 0) + gems;
    
    let rewardText = `<@${userId}> - ${participant.character.emoji} ${participant.character.name}\n💰 **${coins}** coins | 💎 **${gems}** gems`;
    if (crates) rewardText += `\n${crates}`;
    if (tokens > 0) rewardText += `\n🎫 **${tokens}** ${activeRaid.boss.name} tokens`;
    rewardText += `\n📊 Damage: **${damage.toLocaleString()}**`;
    
    rewardMessages.push(rewardText);
  }
  
  await saveDataImmediate(data);
  
  const rewardEmbed = new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle('💰 RAID REWARDS')
    .setDescription(rewardMessages.join('\n\n'));
  
  await activeRaid.channel.send({ embeds: [rewardEmbed] });
}

async function saveRaidToDatabase(raid, status) {
  try {
    const collection = await getRaidCollection();
    
    const raidData = {
      raidNumber: raid.raidNumber,
      bossName: raid.boss.name,
      bossLevel: raid.boss.level,
      bossST: raid.boss.st,
      bossMaxHP: raid.bossMaxHP,
      bossRemainingHP: raid.bossHP,
      participants: Array.from(raid.participants.entries()).map(([userId, p]) => ({
        userId,
        username: p.username,
        characterName: p.character.name,
        damageDealt: raid.damageDealt.get(userId) || 0,
        survived: p.hp > 0
      })),
      totalParticipants: raid.participants.size,
      damageLeaderboard: Array.from(raid.damageDealt.entries())
        .filter(([_, dmg]) => dmg > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([userId, dmg]) => ({ userId, damage: dmg })),
      status,
      startTime: raid.startTime,
      endTime: status === 'completed' ? Date.now() : raid.endTime,
      outcome: status === 'completed' ? (raid.bossHP <= 0 ? 'victory' : 'defeat') : 'ongoing'
    };
    
    await collection.updateOne(
      { raidNumber: raid.raidNumber },
      { $set: raidData },
      { upsert: true }
    );
  } catch (error) {
    console.error('Error saving raid to database:', error);
  }
}

async function getRaidStats(raidNumber) {
  try {
    const collection = await getRaidCollection();
    return await collection.findOne({ raidNumber });
  } catch (error) {
    console.error('Error getting raid stats:', error);
    return null;
  }
}

async function adminStartRaid(message) {
  if (!message.guild || message.guild.id !== SERVER_ID) {
    await message.reply('❌ Raids are only available in the designated server!');
    return;
  }

  if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
    await message.reply('❌ Only administrators can use this command!');
    return;
  }

  if (activeRaid && activeRaid.isActive) {
    await message.reply('❌ A raid is already in progress!');
    return;
  }

  await startNewRaid(true);
  await message.reply('✅ Raid started manually!');
}

async function adminEndRaid(message) {
  if (!message.guild || message.guild.id !== SERVER_ID) {
    await message.reply('❌ Raids are only available in the designated server!');
    return;
  }

  if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
    await message.reply('❌ Only administrators can use this command!');
    return;
  }

  if (!activeRaid || !activeRaid.isActive) {
    await message.reply('❌ No active raid to end!');
    return;
  }

  await endRaid('timeout');
  await message.reply('✅ Raid ended manually!');
}

async function showRaidInfo(message, raidNumber) {
  if (!raidNumber && activeRaid && activeRaid.isActive) {
    const bossHPBar = createHPBar(activeRaid.bossHP, activeRaid.bossMaxHP, 30);
    
    const topDamage = Array.from(activeRaid.damageDealt.entries())
      .filter(([_, dmg]) => dmg > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([userId, dmg], index) => {
        const participant = activeRaid.participants.get(userId);
        return `${index + 1}. ${participant.character.emoji} ${participant.character.name} - **${dmg.toLocaleString()}** dmg`;
      })
      .join('\n') || 'No damage dealt yet';
    
    const infoEmbed = new EmbedBuilder()
      .setColor('#FF6B35')
      .setTitle(`🦁 RAID #${activeRaid.raidNumber} - STATUS`)
      .setDescription(`**Boss:** ${activeRaid.boss.emoji} ${activeRaid.boss.name} (Lvl ${activeRaid.boss.level})\n${bossHPBar}\n**${activeRaid.bossHP.toLocaleString()}/${activeRaid.bossMaxHP.toLocaleString()} HP**\n\n⏰ Time Left: **${Math.max(0, Math.round((activeRaid.endTime - Date.now()) / 60000))} minutes**\n👥 Participants: **${activeRaid.participants.size}**\n💀 Defeated: **${activeRaid.deadParticipants.size}**`)
      .addFields({ name: '🏆 Top Damage Dealers', value: topDamage });
    
    await message.reply({ embeds: [infoEmbed] });
  } else if (raidNumber) {
    const raidData = await getRaidStats(parseInt(raidNumber));
    if (!raidData) {
      await message.reply('❌ Raid not found!');
      return;
    }
    
    const topDamage = raidData.damageLeaderboard.slice(0, 5)
      .map((entry, index) => `${index + 1}. <@${entry.userId}> - **${entry.damage.toLocaleString()}** dmg`)
      .join('\n') || 'No damage dealt';
    
    const historyEmbed = new EmbedBuilder()
      .setColor(raidData.outcome === 'victory' ? '#00FF00' : '#FF0000')
      .setTitle(`📜 RAID #${raidData.raidNumber} - HISTORY`)
      .setDescription(`**Boss:** ${raidData.bossName} (Lvl ${raidData.bossLevel})\n**Outcome:** ${raidData.outcome === 'victory' ? '✅ Victory' : '❌ Defeat'}\n**Boss HP Remaining:** ${raidData.bossRemainingHP.toLocaleString()}/${raidData.bossMaxHP.toLocaleString()}\n**Participants:** ${raidData.totalParticipants}`)
      .addFields({ name: '🏆 Top Damage Dealers', value: topDamage })
      .setTimestamp(raidData.endTime);
    
    await message.reply({ embeds: [historyEmbed] });
  } else {
    await message.reply('❌ No active raid! Use `!raidinfo <number>` to view past raids.');
  }
}

function initRaidSystem(discordClient, gameData) {
  client = discordClient;
  data = gameData;
  
  raidScheduler = setInterval(() => {
    startNewRaid();
  }, RAID_INTERVAL);
  
  startNewRaid();
  
  console.log('✅ Zoo Raid system initialized! Raids will spawn every hour.');
}

function stopRaidSystem() {
  if (raidScheduler) {
    clearInterval(raidScheduler);
    raidScheduler = null;
  }
  
  if (activeRaid && activeRaid.isActive) {
    endRaid('shutdown');
  }
  
  console.log('🛑 Zoo Raid system stopped');
}

module.exports = {
  initRaidSystem,
  stopRaidSystem,
  joinRaid,
  adminStartRaid,
  adminEndRaid,
  showRaidInfo,
  activeRaid
};
