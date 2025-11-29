const { registerOfficialCommand, COMMAND_CATEGORIES } = require('../../services/commandRegistry');
const { PERMISSION_LEVELS } = require('../../services/permissionService');
const { EmbedBuilder } = require('discord.js');

const { 
  CONTENT_TYPES,
  createOfficialContent,
  updateOfficialContent,
  deleteOfficialContent,
  getOfficialContent,
  getAllOfficialContentByType,
  createServerContent,
  getServerContent,
  publishServerContent,
  getMergedContent
} = require('../../services/contentService');
const { createCharacterData, createMoveData, createItemData } = require('../../models/schemas');
const { getServerSettings } = require('../../services/serverSettingsService');
const { logContentCreate, AUDIT_SCOPES } = require('../../services/auditService');

registerOfficialCommand('addcharacter', {
  aliases: ['createchar'],
  description: 'Add a custom character to your server',
  category: COMMAND_CATEGORIES.ADMIN,
  usage: '!addcharacter <name> <emoji> [rarity]',
  examples: ['!addcharacter Blaze :fire: rare', '!addcharacter Luna :moon:'],
  requiredPermission: PERMISSION_LEVELS.PLAY_ADMIN,
  execute: async (message, args) => {
    if (args.length < 2) {
      await message.reply('Usage: `!addcharacter <name> <emoji> [rarity]`\nRarities: common, uncommon, rare, epic, legendary');
      return;
    }
    
    const name = args[0];
    const emoji = args[1];
    const rarity = args[2]?.toLowerCase() || 'common';
    
    const validRarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    if (!validRarities.includes(rarity)) {
      await message.reply('Invalid rarity. Use: common, uncommon, rare, epic, legendary');
      return;
    }
    
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const characterData = createCharacterData(name, emoji, rarity);
    
    const result = await createServerContent(
      message.guild.id,
      CONTENT_TYPES.CHARACTER,
      slug,
      characterData,
      message.author.id
    );
    
    if (!result.success) {
      await message.reply(`Failed to create character: ${result.error}`);
      return;
    }
    
    await logContentCreate(message.author.id, AUDIT_SCOPES.SERVER, message.guild.id, 'character', slug, characterData);
    
    await message.reply(`Character **${name}** ${emoji} (${rarity}) created! Use \`!publishcharacter ${slug}\` to make it available.`);
  }
});

registerOfficialCommand('publishcharacter', {
  aliases: ['pubchar'],
  description: 'Publish a custom character to make it available',
  category: COMMAND_CATEGORIES.ADMIN,
  usage: '!publishcharacter <slug>',
  requiredPermission: PERMISSION_LEVELS.PLAY_ADMIN,
  execute: async (message, args) => {
    if (!args[0]) {
      await message.reply('Usage: `!publishcharacter <slug>`');
      return;
    }
    
    const result = await publishServerContent(
      message.guild.id,
      CONTENT_TYPES.CHARACTER,
      args[0].toLowerCase(),
      message.author.id
    );
    
    if (result.success) {
      await message.reply(`Character \`${args[0]}\` is now published and available!`);
    } else {
      await message.reply(`Failed: ${result.error}`);
    }
  }
});

registerOfficialCommand('servercharacters', {
  aliases: ['customchars', 'mychars'],
  description: 'View custom characters in this server',
  category: COMMAND_CATEGORIES.ADMIN,
  usage: '!servercharacters',
  requiredPermission: PERMISSION_LEVELS.PLAY_ADMIN,
  execute: async (message) => {
    const characters = await getServerContent(message.guild.id, CONTENT_TYPES.CHARACTER);
    
    if (characters.length === 0) {
      await message.reply('No custom characters created yet. Use `!addcharacter` to create one.');
      return;
    }
    
    const formatChar = (c) => {
      const status = c.isPublished ? '✅' : '⏸️';
      return `${status} **${c.data.name}** ${c.data.emoji} (${c.data.rarity}) - \`${c.slug}\``;
    };
    
    const embed = new EmbedBuilder()
      .setColor('#00D9FF')
      .setTitle('Server Custom Characters')
      .setDescription(characters.map(formatChar).join('\n'))
      .setFooter({ text: '✅ = Published, ⏸️ = Draft' });
    
    await message.reply({ embeds: [embed] });
  }
});

registerOfficialCommand('characters', {
  aliases: ['chars', 'allchars'],
  description: 'View all available characters',
  category: COMMAND_CATEGORIES.GAMEPLAY,
  usage: '!characters [page]',
  execute: async (message, args) => {
    const serverId = message.guild.id;
    const settings = await getServerSettings(serverId);
    const characters = await getMergedContent(serverId, CONTENT_TYPES.CHARACTER, settings);
    
    if (characters.length === 0) {
      await message.reply('No characters available.');
      return;
    }
    
    const pageSize = 15;
    const page = Math.max(1, parseInt(args[0]) || 1);
    const totalPages = Math.ceil(characters.length / pageSize);
    const startIndex = (page - 1) * pageSize;
    const pageChars = characters.slice(startIndex, startIndex + pageSize);
    
    const formatChar = (c) => `${c.emoji} **${c.name}** (${c.rarity})`;
    
    const embed = new EmbedBuilder()
      .setColor(settings?.botSettings?.color || '#00D9FF')
      .setTitle('Available Characters')
      .setDescription(pageChars.map(formatChar).join('\n'))
      .setFooter({ text: `Page ${page}/${totalPages} | Total: ${characters.length} characters` });
    
    await message.reply({ embeds: [embed] });
  }
});

registerOfficialCommand('addofficialcharacter', {
  aliases: ['addglobalchar'],
  description: 'Add an official character (Super Admin only)',
  category: COMMAND_CATEGORIES.SUPER_ADMIN,
  usage: '!addofficialcharacter <name> <emoji> [rarity]',
  requiredPermission: PERMISSION_LEVELS.SUPER_ADMIN,
  execute: async (message, args) => {
    if (args.length < 2) {
      await message.reply('Usage: `!addofficialcharacter <name> <emoji> [rarity]`');
      return;
    }
    
    const name = args[0];
    const emoji = args[1];
    const rarity = args[2]?.toLowerCase() || 'common';
    
    const validRarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    if (!validRarities.includes(rarity)) {
      await message.reply('Invalid rarity. Use: common, uncommon, rare, epic, legendary');
      return;
    }
    
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const characterData = createCharacterData(name, emoji, rarity);
    
    const result = await createOfficialContent(
      CONTENT_TYPES.CHARACTER,
      slug,
      characterData,
      message.author.id
    );
    
    if (!result.success) {
      await message.reply(`Failed: ${result.error}`);
      return;
    }
    
    await logContentCreate(message.author.id, AUDIT_SCOPES.GLOBAL, null, 'character', slug, characterData);
    
    await message.reply(`Official character **${name}** ${emoji} (${rarity}) created!`);
  }
});

registerOfficialCommand('officialcharacters', {
  aliases: ['globalchars'],
  description: 'View all official characters (Super Admin only)',
  category: COMMAND_CATEGORIES.SUPER_ADMIN,
  usage: '!officialcharacters',
  requiredPermission: PERMISSION_LEVELS.SUPER_ADMIN,
  execute: async (message) => {
    const characters = await getAllOfficialContentByType(CONTENT_TYPES.CHARACTER);
    
    if (characters.length === 0) {
      await message.reply('No official characters created yet.');
      return;
    }
    
    const formatChar = (c) => `${c.data.emoji} **${c.data.name}** (${c.data.rarity}) - \`${c.slug}\``;
    
    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('Official Characters')
      .setDescription(characters.map(formatChar).join('\n'))
      .setFooter({ text: `Total: ${characters.length} official characters` });
    
    await message.reply({ embeds: [embed] });
  }
});

registerOfficialCommand('addmove', {
  aliases: ['createmove'],
  description: 'Add a custom move to your server',
  category: COMMAND_CATEGORIES.ADMIN,
  usage: '!addmove <name> <type> <power> <accuracy> <energy>',
  examples: ['!addmove "Fire Blast" fire 90 85 30'],
  requiredPermission: PERMISSION_LEVELS.PLAY_ADMIN,
  execute: async (message, args) => {
    if (args.length < 5) {
      await message.reply('Usage: `!addmove <name> <type> <power> <accuracy> <energy>`\nTypes: normal, fire, water, grass, electric, ice, fighting, poison, ground, flying, psychic, bug, rock, ghost, dragon, dark, steel, fairy');
      return;
    }
    
    const name = args[0].replace(/"/g, '');
    const type = args[1].toLowerCase();
    const power = parseInt(args[2]);
    const accuracy = parseInt(args[3]);
    const energy = parseInt(args[4]);
    
    const validTypes = ['normal', 'fire', 'water', 'grass', 'electric', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'];
    if (!validTypes.includes(type)) {
      await message.reply('Invalid type.');
      return;
    }
    
    if (isNaN(power) || isNaN(accuracy) || isNaN(energy)) {
      await message.reply('Power, accuracy, and energy must be numbers.');
      return;
    }
    
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const moveData = createMoveData(name, type, power, accuracy, energy);
    
    const result = await createServerContent(
      message.guild.id,
      CONTENT_TYPES.MOVE,
      slug,
      moveData,
      message.author.id
    );
    
    if (!result.success) {
      await message.reply(`Failed: ${result.error}`);
      return;
    }
    
    await message.reply(`Move **${name}** (${type}) created! Power: ${power}, Accuracy: ${accuracy}%, Energy: ${energy}`);
  }
});

registerOfficialCommand('additem', {
  aliases: ['createitem'],
  description: 'Add a custom item to your server',
  category: COMMAND_CATEGORIES.ADMIN,
  usage: '!additem <name> <emoji> <type> <price>',
  examples: ['!additem "Health Potion" :potion: consumable 100'],
  requiredPermission: PERMISSION_LEVELS.PLAY_ADMIN,
  execute: async (message, args) => {
    if (args.length < 4) {
      await message.reply('Usage: `!additem <name> <emoji> <type> <price>`\nTypes: consumable, equipment, material, special');
      return;
    }
    
    const name = args[0].replace(/"/g, '');
    const emoji = args[1];
    const type = args[2].toLowerCase();
    const price = parseInt(args[3]);
    
    const validTypes = ['consumable', 'equipment', 'material', 'special'];
    if (!validTypes.includes(type)) {
      await message.reply('Invalid type. Use: consumable, equipment, material, special');
      return;
    }
    
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const itemData = createItemData(name, emoji, type, {}, { coins: price });
    
    const result = await createServerContent(
      message.guild.id,
      CONTENT_TYPES.ITEM,
      slug,
      itemData,
      message.author.id
    );
    
    if (!result.success) {
      await message.reply(`Failed: ${result.error}`);
      return;
    }
    
    await message.reply(`Item **${name}** ${emoji} (${type}) created! Price: ${price} coins`);
  }
});

module.exports = {};
