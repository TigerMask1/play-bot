const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { saveDataImmediate } = require('./dataManager.js');

let activeClient = null;
let activeLootDrops = {}; // { serverId: { lootId, clan, totalLoot, claimedPlayers, expiresAt } }

const LOOT_RARITY = {
  COMMON: { weight: 40, types: ['coins'] },
  UNCOMMON: { weight: 30, types: ['gems', 'coins'] },
  RARE: { weight: 20, types: ['tokens', 'crates', 'keys'] },
  EPIC: { weight: 8, types: ['ust', 'crates'] },
  LEGENDARY: { weight: 2, types: ['ust'] }
};

const LOOT_AMOUNTS = {
  coins: { min: 500, max: 2000 },
  gems: { min: 100, max: 500 },
  tokens: { min: 5, max: 15 },
  crates: { min: 1, max: 3 },
  keys: { min: 2, max: 5 },
  ust: { min: 50, max: 200 }
};

const LOOT_DROP_INTERVAL = 3 * 60 * 60 * 1000; // 3 hours
const CLAIM_COOLDOWN = 60 * 60 * 1000; // 1 hour
const LOOT_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

function initializeClanLootSystem(client) {
  activeClient = client;
  console.log('✅ Clan Loot System initialized');
  scheduleNextLootDrop();
}

function scheduleNextLootDrop() {
  setTimeout(async () => {
    await performLootDrop();
    scheduleNextLootDrop();
  }, LOOT_DROP_INTERVAL);
  console.log('⏰ Next clan loot drop scheduled in 3 hours');
}

async function performLootDrop() {
  if (!activeClient) return;
  
  try {
    const { loadData } = require('./dataManager.js');
    const data = await loadData();
    
    if (!data.clans) return;
    
    // Find clans with players
    const activeClanServers = Object.entries(data.clans)
      .filter(([_, clan]) => Object.keys(clan.members || {}).length > 0)
      .map(([serverId, clan]) => ({ serverId, clan }));
    
    if (activeClanServers.length === 0) return;
    
    // Pick random clan
    const selectedClan = activeClanServers[Math.floor(Math.random() * activeClanServers.length)];
    const { serverId, clan } = selectedClan;
    
    // Calculate loot based on player count
    const playerCount = Object.keys(clan.members).length;
    const lootScale = 0.5 + (playerCount * 0.1); // Scale from 0.5 to 3.0 based on members
    
    const loot = generateLoot(lootScale);
    const lootId = `L${Date.now()}`;
    
    activeLootDrops[serverId] = {
      lootId,
      clan: clan.clanName || `Server Clan`,
      playerCount,
      totalLoot: loot,
      claimedPlayers: {},
      createdAt: Date.now(),
      expiresAt: Date.now() + LOOT_EXPIRY
    };
    
    // Send loot to server
    const guild = activeClient.guilds.cache.get(serverId);
    if (!guild) return;
    
    // Get events channel (custom config or fallback)
    let channelId = data.serverChannels?.[serverId]?.events;
    if (!channelId) {
      channelId = data.serverChannels?.[serverId]?.main || guild.systemChannelId;
    }
    
    const channel = await activeClient.channels.fetch(channelId).catch(() => null);
    if (!channel) return;
    
    const embed = createLootEmbed(loot, clan.clanName || `Server Clan`, playerCount);
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`claim_loot_${lootId}`)
        .setLabel('🎁 Claim Loot')
        .setStyle(ButtonStyle.Primary)
    );
    
    await channel.send({ embeds: [embed], components: [buttons] }).catch(err => {
      console.error(`Failed to send loot to server ${serverId}:`, err.message);
    });
    
    console.log(`✅ LOOT DROP: Server ${serverId} - ${clan.clanName || 'Unnamed Clan'} (${playerCount} players) received loot`);
    
  } catch (error) {
    console.error('❌ Error performing loot drop:', error);
  }
}

function generateLoot(scale) {
  const loot = {
    coins: 0,
    gems: 0,
    tokens: 0,
    crates: 0,
    keys: 0,
    ust: 0
  };
  
  // Generate 3-5 loot items
  const itemCount = Math.floor(Math.random() * 3) + 3;
  
  for (let i = 0; i < itemCount; i++) {
    const rarity = selectRarity();
    const types = LOOT_RARITY[rarity].types;
    const type = types[Math.floor(Math.random() * types.length)];
    
    const range = LOOT_AMOUNTS[type];
    const amount = Math.floor((range.min + Math.random() * (range.max - range.min)) * scale);
    loot[type] += amount;
  }
  
  return loot;
}

function selectRarity() {
  const rand = Math.random() * 100;
  let cumulative = 0;
  
  for (const [rarity, data] of Object.entries(LOOT_RARITY)) {
    cumulative += data.weight;
    if (rand <= cumulative) return rarity;
  }
  
  return 'COMMON';
}

function createLootEmbed(loot, clanName, playerCount) {
  let description = `🎁 **${clanName}** received clan loot!\n👥 ${playerCount} members can claim\n\n**Total Loot Pool:**\n`;
  
  if (loot.coins > 0) description += `💰 ${loot.coins.toLocaleString()} Coins\n`;
  if (loot.gems > 0) description += `💎 ${loot.gems.toLocaleString()} Gems\n`;
  if (loot.tokens > 0) description += `🎫 ${loot.tokens} Tokens\n`;
  if (loot.crates > 0) description += `📦 ${loot.crates} Crates\n`;
  if (loot.keys > 0) description += `🔑 ${loot.keys} Keys\n`;
  if (loot.ust > 0) description += `✨ ${loot.ust} UST\n`;
  
  description += `\n⏰ Expires in 24 hours\n1️⃣ Only 1 claim per player per hour`;
  
  return new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle('🎰 CLAN LOOT DROP!')
    .setDescription(description)
    .setFooter({ text: 'Click the button to claim your share!' });
}

async function claimLoot(userId, lootId, serverId) {
  const lootDrop = activeLootDrops[serverId];
  
  if (!lootDrop || lootDrop.lootId !== lootId) {
    return { success: false, message: '❌ This loot drop has expired!' };
  }
  
  if (Date.now() > lootDrop.expiresAt) {
    delete activeLootDrops[serverId];
    return { success: false, message: '❌ This loot drop has expired!' };
  }
  
  // Check cooldown
  if (lootDrop.claimedPlayers[userId]) {
    const timeSinceClaim = Date.now() - lootDrop.claimedPlayers[userId];
    if (timeSinceClaim < CLAIM_COOLDOWN) {
      const minutesLeft = Math.ceil((CLAIM_COOLDOWN - timeSinceClaim) / 60000);
      return { success: false, message: `⏰ Wait ${minutesLeft} minute(s) before claiming again!` };
    }
  }
  
  const { loadData } = require('./dataManager.js');
  const data = await loadData();
  
  // Ensure user exists
  if (!data.users[userId]) {
    data.users[userId] = {
      coins: 0,
      gems: 0,
      characters: [],
      selectedCharacter: null,
      pendingTokens: 0,
      started: false,
      trophies: 200,
      messageCount: 0,
      lastDailyClaim: null,
      mailbox: []
    };
  }
  
  // Calculate player share (equal distribution)
  const memberCount = lootDrop.playerCount;
  const share = {
    coins: Math.floor(lootDrop.totalLoot.coins / memberCount),
    gems: Math.floor(lootDrop.totalLoot.gems / memberCount),
    tokens: Math.floor(lootDrop.totalLoot.tokens / memberCount),
    crates: Math.floor(lootDrop.totalLoot.crates / memberCount),
    keys: Math.floor(lootDrop.totalLoot.keys / memberCount),
    ust: Math.floor(lootDrop.totalLoot.ust / memberCount)
  };
  
  // Award loot
  data.users[userId].coins = (data.users[userId].coins || 0) + share.coins;
  data.users[userId].gems = (data.users[userId].gems || 0) + share.gems;
  data.users[userId].pendingTokens = (data.users[userId].pendingTokens || 0) + share.tokens;
  data.users[userId].ust = (data.users[userId].ust || 0) + share.ust;
  
  // Handle crates and keys in mailbox
  if (share.crates > 0 || share.keys > 0) {
    if (!data.users[userId].mailbox) data.users[userId].mailbox = [];
    data.users[userId].mailbox.push({
      type: 'clan_loot',
      crates: share.crates,
      keys: share.keys,
      receivedAt: Date.now()
    });
  }
  
  // Update cooldown
  lootDrop.claimedPlayers[userId] = Date.now();
  
  // Decrease total loot
  lootDrop.totalLoot.coins -= share.coins;
  lootDrop.totalLoot.gems -= share.gems;
  lootDrop.totalLoot.tokens -= share.tokens;
  lootDrop.totalLoot.crates -= share.crates;
  lootDrop.totalLoot.keys -= share.keys;
  lootDrop.totalLoot.ust -= share.ust;
  
  // Save data
  await saveDataImmediate(data);
  
  let rewardText = '';
  if (share.coins > 0) rewardText += `💰 ${share.coins.toLocaleString()} Coins\n`;
  if (share.gems > 0) rewardText += `💎 ${share.gems} Gems\n`;
  if (share.tokens > 0) rewardText += `🎫 ${share.tokens} Tokens\n`;
  if (share.crates > 0) rewardText += `📦 ${share.crates} Crates → Mailbox\n`;
  if (share.keys > 0) rewardText += `🔑 ${share.keys} Keys → Mailbox\n`;
  if (share.ust > 0) rewardText += `✨ ${share.ust} UST\n`;
  
  return {
    success: true,
    message: `✅ **Clan Loot Claimed!**\n\n${rewardText}\nCome back in 1 hour for more! ⏰`,
    rewards: share
  };
}

async function viewLootStatus(serverId) {
  const lootDrop = activeLootDrops[serverId];
  
  if (!lootDrop) {
    return { success: false, message: '❌ No active loot drop in this server!' };
  }
  
  let remaining = '';
  if (lootDrop.totalLoot.coins > 0) remaining += `💰 ${lootDrop.totalLoot.coins.toLocaleString()} Coins\n`;
  if (lootDrop.totalLoot.gems > 0) remaining += `💎 ${lootDrop.totalLoot.gems} Gems\n`;
  if (lootDrop.totalLoot.tokens > 0) remaining += `🎫 ${lootDrop.totalLoot.tokens} Tokens\n`;
  if (lootDrop.totalLoot.crates > 0) remaining += `📦 ${lootDrop.totalLoot.crates} Crates\n`;
  if (lootDrop.totalLoot.keys > 0) remaining += `🔑 ${lootDrop.totalLoot.keys} Keys\n`;
  if (lootDrop.totalLoot.ust > 0) remaining += `✨ ${lootDrop.totalLoot.ust} UST\n`;
  
  const expiresIn = Math.floor((lootDrop.expiresAt - Date.now()) / 60000);
  const claimed = Object.keys(lootDrop.claimedPlayers).length;
  
  const embed = new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle(`🎰 Clan Loot - ${lootDrop.clan}`)
    .setDescription(`**Remaining in pool:**\n${remaining || 'All claimed!'}`)
    .addFields(
      { name: '👥 Members in Clan', value: `${lootDrop.playerCount}`, inline: true },
      { name: '✅ Players Claimed', value: `${claimed}`, inline: true },
      { name: '⏰ Expires in', value: `${expiresIn} minutes`, inline: true }
    );
  
  return { success: true, embed };
}

async function forceNewLootDrop() {
  await performLootDrop();
  return { success: true, message: '✅ New loot drop initiated!' };
}

function getLootData() {
  return { ...activeLootDrops };
}

function setLootData(data) {
  activeLootDrops = data;
}

module.exports = {
  initializeClanLootSystem,
  claimLoot,
  viewLootStatus,
  forceNewLootDrop,
  getLootData,
  setLootData
};
