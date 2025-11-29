const { EmbedBuilder } = require('discord.js');
const { COLORS, EMOJIS } = require('../../config/constants');
const { getRarityEmoji } = require('../../utils/embeds');
const db = require('../../database/MongoDB');

module.exports = {
  name: 'select',
  description: 'Select a character as your active character',
  aliases: ['choose', 'equip', 'set'],
  usage: '<number or name>',
  cooldown: 5,
  requiresStart: true,
  module: 'collection',
  
  async execute({ message, args, serverUser, prefix }) {
    if (!args[0]) {
      return message.reply(`❌ Please specify a character! Usage: \`${prefix}select <number or name>\``);
    }
    
    const characters = serverUser.characters || [];
    
    if (characters.length === 0) {
      return message.reply('❌ You have no characters in your collection!');
    }
    
    let character;
    let characterIndex;
    
    const index = parseInt(args[0]) - 1;
    if (!isNaN(index) && index >= 0 && index < characters.length) {
      character = characters[index];
      characterIndex = index;
    } else {
      const searchName = args.join(' ').toLowerCase();
      characterIndex = characters.findIndex(c => c.name.toLowerCase().includes(searchName));
      if (characterIndex !== -1) {
        character = characters[characterIndex];
      }
    }
    
    if (!character) {
      return message.reply(`❌ Character not found! Use \`${prefix}collection\` to see your characters.`);
    }
    
    if (serverUser.selectedCharacter === character.characterId) {
      return message.reply(`❌ **${character.name}** is already your selected character!`);
    }
    
    await db.updateServerUser(message.guild.id, message.author.id, {
      selectedCharacter: character.characterId
    });
    
    const selectEmbed = new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle(`${EMOJIS.SUCCESS} Character Selected!`)
      .setDescription(`**${getRarityEmoji(character.rarity)} ${character.name}** is now your active character!`)
      .addFields(
        { name: 'Level', value: `${character.level || 1}`, inline: true },
        { name: '❤️ HP', value: `${character.baseStats?.hp || 100}`, inline: true },
        { name: '⚔️ ATK', value: `${character.baseStats?.attack || 10}`, inline: true }
      )
      .setFooter({ text: 'This character will be used in battles!' })
      .setTimestamp();
    
    if (character.imageUrl) {
      selectEmbed.setThumbnail(character.imageUrl);
    }
    
    await message.reply({ embeds: [selectEmbed] });
  }
};
