const { EmbedBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { COLORS, EMOJIS, PERMISSIONS, RARITY_WEIGHTS } = require('../../config/constants');
const { hasPermission } = require('../../utils/permissions');
const { getDefaultCharacter } = require('../../config/defaults');
const { getRarityEmoji, formatRarity } = require('../../utils/embeds');
const { sanitizeInput, isValidUrl, generateId } = require('../../utils/helpers');
const db = require('../../database/MongoDB');

module.exports = {
  name: 'createcharacter',
  description: 'Create a custom character for your server',
  aliases: ['addchar', 'newchar', 'charCreate'],
  usage: '<name> | <rarity> | <hp> <atk> <def> <spd> | [description] | [imageUrl]',
  cooldown: 10,
  
  async execute({ message, args, serverConfig, prefix }) {
    if (!hasPermission(message.member, PERMISSIONS.ADMIN, serverConfig)) {
      return message.reply('❌ You need Admin permissions to create characters!');
    }
    
    if (args.length === 0) {
      return showCreateHelp(message, prefix);
    }
    
    const input = args.join(' ');
    const parts = input.split('|').map(p => p.trim());
    
    if (parts.length < 3) {
      return message.reply(`❌ Not enough information! Usage:\n\`${prefix}createcharacter <name> | <rarity> | <hp> <atk> <def> <spd> | [description] | [imageUrl]\``);
    }
    
    const name = sanitizeInput(parts[0], 50);
    if (!name || name.length < 2) {
      return message.reply('❌ Character name must be at least 2 characters!');
    }
    
    const rarity = parts[1].toUpperCase();
    const validRarities = Object.keys(RARITY_WEIGHTS);
    if (!validRarities.includes(rarity)) {
      return message.reply(`❌ Invalid rarity! Valid options: ${validRarities.join(', ')}`);
    }
    
    const statParts = parts[2].split(/\s+/);
    if (statParts.length < 4) {
      return message.reply('❌ Please provide all 4 stats: HP ATK DEF SPD');
    }
    
    const [hp, atk, def, spd] = statParts.map(s => parseInt(s));
    if ([hp, atk, def, spd].some(s => isNaN(s) || s < 1 || s > 9999)) {
      return message.reply('❌ Stats must be numbers between 1 and 9999!');
    }
    
    const description = parts[3] ? sanitizeInput(parts[3], 200) : '';
    const imageUrl = parts[4] ? parts[4].trim() : null;
    
    if (imageUrl && !isValidUrl(imageUrl)) {
      return message.reply('❌ Invalid image URL! Please provide a valid URL or leave it empty.');
    }
    
    const existingChar = await db.collection('server_characters').findOne({
      serverId: message.guild.id,
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });
    
    if (existingChar) {
      return message.reply(`❌ A character named **${name}** already exists!`);
    }
    
    const character = getDefaultCharacter(message.guild.id, {
      characterId: generateId('char_'),
      name,
      description,
      rarity,
      imageUrl,
      hp,
      attack: atk,
      defense: def,
      speed: spd,
      isCustom: true,
      createdBy: message.author.id
    });
    
    await db.createServerCharacter(character);
    
    const embed = new EmbedBuilder()
      .setColor(COLORS.RARITY[rarity])
      .setTitle(`${EMOJIS.SUCCESS} Character Created!`)
      .setDescription(`**${getRarityEmoji(rarity)} ${name}** has been added to your server!`)
      .addFields(
        { name: 'Rarity', value: formatRarity(rarity), inline: true },
        { name: '❤️ HP', value: `${hp}`, inline: true },
        { name: '⚔️ Attack', value: `${atk}`, inline: true },
        { name: '🛡️ Defense', value: `${def}`, inline: true },
        { name: '💨 Speed', value: `${spd}`, inline: true },
        { name: 'ID', value: `\`${character.characterId}\``, inline: true }
      )
      .setFooter({ text: 'This character will now appear in drops!' })
      .setTimestamp();
    
    if (description) {
      embed.addFields({ name: 'Description', value: description, inline: false });
    }
    
    if (imageUrl) {
      embed.setThumbnail(imageUrl);
    }
    
    await message.reply({ embeds: [embed] });
  }
};

async function showCreateHelp(message, prefix) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.INFO)
    .setTitle('🎨 Create Character')
    .setDescription('Create a custom character for your server!')
    .addFields(
      {
        name: 'Usage',
        value: `\`${prefix}createcharacter <name> | <rarity> | <hp> <atk> <def> <spd> | [description] | [imageUrl]\``,
        inline: false
      },
      {
        name: 'Rarities',
        value: 'COMMON, UNCOMMON, RARE, EPIC, LEGENDARY, MYTHIC',
        inline: false
      },
      {
        name: 'Example',
        value: `\`${prefix}createcharacter Shadow Wolf | EPIC | 150 25 20 30 | A mysterious wolf from the shadow realm | https://example.com/wolf.png\``,
        inline: false
      },
      {
        name: 'Stats',
        value: `• **HP** - Health points (1-9999)
• **ATK** - Attack power (1-9999)
• **DEF** - Defense (1-9999)
• **SPD** - Speed (1-9999)`,
        inline: false
      }
    )
    .setFooter({ text: 'Description and image URL are optional' })
    .setTimestamp();
  
  await message.reply({ embeds: [embed] });
}
