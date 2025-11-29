const { EmbedBuilder } = require('discord.js');
const { COLORS, EMOJIS } = require('../../config/constants');
const { characterEmbed, getRarityEmoji, formatRarity } = require('../../utils/embeds');
const { createProgressBar, calculateLevel } = require('../../utils/helpers');

module.exports = {
  name: 'character',
  description: 'View character details',
  aliases: ['char', 'info', 'view'],
  usage: '<number or name>',
  cooldown: 3,
  requiresStart: true,
  module: 'collection',
  
  async execute({ message, args, serverUser, prefix }) {
    if (!args[0]) {
      if (serverUser.selectedCharacter) {
        const char = serverUser.characters.find(c => c.characterId === serverUser.selectedCharacter);
        if (char) {
          return sendCharacterInfo(message, char, serverUser, prefix);
        }
      }
      return message.reply(`❌ Please specify a character! Usage: \`${prefix}character <number or name>\``);
    }
    
    const characters = serverUser.characters || [];
    
    if (characters.length === 0) {
      return message.reply('❌ You have no characters in your collection!');
    }
    
    let character;
    
    const index = parseInt(args[0]) - 1;
    if (!isNaN(index) && index >= 0 && index < characters.length) {
      character = characters[index];
    } else {
      const searchName = args.join(' ').toLowerCase();
      character = characters.find(c => c.name.toLowerCase().includes(searchName));
    }
    
    if (!character) {
      return message.reply(`❌ Character not found! Use \`${prefix}collection\` to see your characters.`);
    }
    
    await sendCharacterInfo(message, character, serverUser, prefix);
  }
};

async function sendCharacterInfo(message, character, serverUser, prefix) {
  const isSelected = serverUser.selectedCharacter === character.characterId;
  const levelInfo = calculateLevel(character.xp || 0);
  
  const embed = new EmbedBuilder()
    .setColor(COLORS.RARITY[character.rarity] || COLORS.PRIMARY)
    .setTitle(`${getRarityEmoji(character.rarity)} ${character.name}${isSelected ? ' ⭐' : ''}`)
    .setDescription(character.description || 'A collectible character.');
  
  const xpBar = createProgressBar(levelInfo.currentXP, levelInfo.requiredXP, 10);
  
  embed.addFields(
    { name: 'Rarity', value: formatRarity(character.rarity), inline: true },
    { name: 'Level', value: `${character.level || 1}`, inline: true },
    { name: 'XP', value: `${xpBar} ${levelInfo.currentXP}/${levelInfo.requiredXP}`, inline: true },
    { name: '❤️ HP', value: `${character.baseStats?.hp || 100}`, inline: true },
    { name: '⚔️ Attack', value: `${character.baseStats?.attack || 10}`, inline: true },
    { name: '🛡️ Defense', value: `${character.baseStats?.defense || 10}`, inline: true },
    { name: '💨 Speed', value: `${character.baseStats?.speed || 10}`, inline: true }
  );
  
  if (character.obtainedAt) {
    embed.addFields({
      name: '📅 Obtained',
      value: `<t:${Math.floor(new Date(character.obtainedAt).getTime() / 1000)}:R>`,
      inline: true
    });
  }
  
  if (character.imageUrl) {
    embed.setThumbnail(character.imageUrl);
  }
  
  embed.setFooter({ text: `Use ${prefix}select <name> to set as active character` });
  
  await message.reply({ embeds: [embed] });
}
