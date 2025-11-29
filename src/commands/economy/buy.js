const { EmbedBuilder } = require('discord.js');
const { COLORS, EMOJIS } = require('../../config/constants');
const { selectRandomRarity, selectRandomCharacter, generateId } = require('../../utils/helpers');
const { getRarityEmoji, formatRarity } = require('../../utils/embeds');
const db = require('../../database/MongoDB');

const SHOP_ITEMS = {
  bronze_crate: { name: 'Bronze Crate', price: 100, type: 'crate', rarity: { COMMON: 80, UNCOMMON: 20 } },
  silver_crate: { name: 'Silver Crate', price: 300, type: 'crate', rarity: { COMMON: 50, UNCOMMON: 35, RARE: 15 } },
  gold_crate: { name: 'Gold Crate', price: 750, type: 'crate', rarity: { UNCOMMON: 40, RARE: 40, EPIC: 20 } },
  legendary_crate: { name: 'Legendary Crate', price: 2000, type: 'crate', rarity: { RARE: 30, EPIC: 45, LEGENDARY: 20, MYTHIC: 5 } },
  xp_boost: { name: 'XP Booster', price: 500, type: 'booster', duration: 3600000, multiplier: 2 },
  coin_boost: { name: 'Coin Booster', price: 500, type: 'booster', duration: 3600000, multiplier: 2 }
};

module.exports = {
  name: 'buy',
  description: 'Purchase items from the shop',
  aliases: ['purchase'],
  usage: '<item>',
  cooldown: 5,
  requiresStart: true,
  module: 'shop',
  
  async execute({ message, args, serverUser, serverConfig, prefix }) {
    if (!args[0]) {
      return message.reply(`❌ Please specify an item! Usage: \`${prefix}buy <item>\`\nUse \`${prefix}shop\` to see available items.`);
    }
    
    const itemName = args.join('_').toLowerCase().replace(/\s+/g, '_');
    const item = SHOP_ITEMS[itemName] || SHOP_ITEMS[itemName.replace('_', '')];
    
    if (!item) {
      const availableItems = Object.keys(SHOP_ITEMS).map(k => k.replace(/_/g, ' ')).join(', ');
      return message.reply(`❌ Item not found! Available: ${availableItems}`);
    }
    
    if (serverUser.balance < item.price) {
      const currencyEmoji = serverConfig.economy?.currencyEmoji || EMOJIS.COINS;
      return message.reply(`❌ Not enough coins! You need ${currencyEmoji} **${item.price.toLocaleString()}** but have ${currencyEmoji} **${serverUser.balance.toLocaleString()}**.`);
    }
    
    await db.incrementServerUser(message.guild.id, message.author.id, {
      balance: -item.price
    });
    
    if (item.type === 'crate') {
      return openCrate(message, item, serverUser, serverConfig, prefix);
    } else if (item.type === 'booster') {
      return activateBooster(message, itemName, item, serverConfig);
    }
  }
};

async function openCrate(message, item, serverUser, serverConfig, prefix) {
  let characters = await db.getServerCharacters(message.guild.id);
  
  if (characters.length === 0) {
    characters = getDefaultCharacters();
  }
  
  const rarity = selectWeightedRarity(item.rarity);
  let character = selectRandomCharacter(characters, rarity);
  
  if (!character) {
    character = selectRandomCharacter(characters);
  }
  
  if (!character) {
    await db.incrementServerUser(message.guild.id, message.author.id, {
      balance: item.price
    });
    return message.reply('❌ No characters available! Refunded your coins.');
  }
  
  const ownedCharacter = {
    ...character,
    obtainedAt: new Date(),
    level: 1,
    xp: 0
  };
  
  await db.collection('server_users').updateOne(
    { serverId: message.guild.id, odiscrdId: message.author.id },
    {
      $push: { characters: ownedCharacter },
      $inc: { 'stats.charactersCollected': 1 }
    }
  );
  
  const currencyEmoji = serverConfig.economy?.currencyEmoji || EMOJIS.COINS;
  
  const embed = new EmbedBuilder()
    .setColor(COLORS.RARITY[character.rarity] || COLORS.SUCCESS)
    .setTitle(`📦 ${item.name} Opened!`)
    .setDescription(`**${message.author.username}** obtained:\n\n${getRarityEmoji(character.rarity)} **${character.name}** (${formatRarity(character.rarity)})`)
    .addFields(
      { name: '❤️ HP', value: `${character.baseStats?.hp || 100}`, inline: true },
      { name: '⚔️ ATK', value: `${character.baseStats?.attack || 10}`, inline: true },
      { name: '🛡️ DEF', value: `${character.baseStats?.defense || 10}`, inline: true }
    )
    .setFooter({ text: `Cost: ${currencyEmoji} ${item.price} | Use ${prefix}collection to view` })
    .setTimestamp();
  
  if (character.imageUrl) {
    embed.setThumbnail(character.imageUrl);
  }
  
  await message.reply({ embeds: [embed] });
}

async function activateBooster(message, itemName, item, serverConfig) {
  const boosterType = itemName.includes('xp') ? 'xp' : 'coins';
  const expiresAt = Date.now() + item.duration;
  
  await db.collection('server_users').updateOne(
    { serverId: message.guild.id, odiscrdId: message.author.id },
    {
      $set: {
        [`inventory.boosters.${boosterType}`]: {
          multiplier: item.multiplier,
          expiresAt: new Date(expiresAt)
        }
      }
    }
  );
  
  const currencyEmoji = serverConfig.economy?.currencyEmoji || EMOJIS.COINS;
  
  const embed = new EmbedBuilder()
    .setColor(COLORS.SUCCESS)
    .setTitle(`${EMOJIS.SUCCESS} Booster Activated!`)
    .setDescription(`**${item.name}** is now active!\n\n${item.multiplier}x ${boosterType.toUpperCase()} for 1 hour!`)
    .addFields({
      name: 'Expires',
      value: `<t:${Math.floor(expiresAt / 1000)}:R>`,
      inline: true
    })
    .setFooter({ text: `Cost: ${currencyEmoji} ${item.price}` })
    .setTimestamp();
  
  await message.reply({ embeds: [embed] });
}

function selectWeightedRarity(weights) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let random = Math.random() * total;
  
  for (const [rarity, weight] of Object.entries(weights)) {
    random -= weight;
    if (random <= 0) return rarity;
  }
  
  return Object.keys(weights)[0];
}

function getDefaultCharacters() {
  return [
    { characterId: 'def_1', name: 'Flame Fox', rarity: 'COMMON', baseStats: { hp: 80, attack: 12, defense: 8, speed: 15 } },
    { characterId: 'def_2', name: 'Stone Golem', rarity: 'COMMON', baseStats: { hp: 120, attack: 8, defense: 18, speed: 5 } },
    { characterId: 'def_3', name: 'Wind Spirit', rarity: 'UNCOMMON', baseStats: { hp: 70, attack: 14, defense: 6, speed: 20 } },
    { characterId: 'def_4', name: 'Crystal Dragon', rarity: 'RARE', baseStats: { hp: 100, attack: 20, defense: 15, speed: 12 } },
    { characterId: 'def_5', name: 'Frost Phoenix', rarity: 'EPIC', baseStats: { hp: 110, attack: 25, defense: 18, speed: 14 } },
    { characterId: 'def_6', name: 'Celestial Guardian', rarity: 'LEGENDARY', baseStats: { hp: 150, attack: 32, defense: 28, speed: 15 } },
    { characterId: 'def_7', name: 'Chaos Emperor', rarity: 'MYTHIC', baseStats: { hp: 180, attack: 40, defense: 35, speed: 20 } }
  ];
}
