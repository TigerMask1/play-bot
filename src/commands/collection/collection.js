const { EmbedBuilder } = require('discord.js');
const { COLORS, EMOJIS } = require('../../config/constants');
const { getRarityEmoji, formatRarity, createPaginationButtons } = require('../../utils/embeds');
const { chunk } = require('../../utils/helpers');

module.exports = {
  name: 'collection',
  description: 'View your character collection',
  aliases: ['col', 'inv', 'inventory', 'chars', 'characters'],
  usage: '[page] [@user]',
  cooldown: 3,
  requiresStart: true,
  module: 'collection',
  
  async execute({ message, args, serverUser, prefix, db }) {
    let targetUser = message.author;
    let targetServerUser = serverUser;
    
    const mentioned = message.mentions.users.first();
    if (mentioned) {
      targetUser = mentioned;
      targetServerUser = await db.getServerUser(message.guild.id, mentioned.id);
      
      if (!targetServerUser || !targetServerUser.started) {
        return message.reply(`❌ **${mentioned.username}** hasn't started playing yet!`);
      }
    }
    
    const characters = targetServerUser.characters || [];
    
    if (characters.length === 0) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.WARNING)
            .setTitle('📦 Empty Collection')
            .setDescription(`${targetUser.id === message.author.id ? 'You have' : `**${targetUser.username}** has`} no characters yet!\n\nWait for drops and use \`${prefix}catch <code>\` to collect characters.`)
        ]
      });
    }
    
    const pageArg = args.find(arg => !arg.startsWith('<@'));
    let page = pageArg ? parseInt(pageArg) : 1;
    
    const itemsPerPage = 10;
    const pages = chunk(characters, itemsPerPage);
    const totalPages = pages.length;
    
    page = Math.max(1, Math.min(page, totalPages));
    
    const pageCharacters = pages[page - 1];
    
    const rarityCounts = {};
    for (const char of characters) {
      rarityCounts[char.rarity] = (rarityCounts[char.rarity] || 0) + 1;
    }
    
    const rarityOrder = ['MYTHIC', 'LEGENDARY', 'EPIC', 'RARE', 'UNCOMMON', 'COMMON'];
    const raritySummary = rarityOrder
      .filter(r => rarityCounts[r])
      .map(r => `${getRarityEmoji(r)} ${rarityCounts[r]}`)
      .join(' | ');
    
    const characterList = pageCharacters
      .map((char, index) => {
        const globalIndex = (page - 1) * itemsPerPage + index + 1;
        const selected = targetServerUser.selectedCharacter === char.characterId ? ' ⭐' : '';
        return `\`${globalIndex}.\` ${getRarityEmoji(char.rarity)} **${char.name}** (Lv.${char.level || 1})${selected}`;
      })
      .join('\n');
    
    const collectionEmbed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle(`📦 ${targetUser.username}'s Collection`)
      .setDescription(`**${characters.length}** characters collected\n${raritySummary}\n\n${characterList}`)
      .setFooter({ text: `Page ${page}/${totalPages} | Use ${prefix}character <number> to view details` })
      .setTimestamp();
    
    if (targetUser.displayAvatarURL) {
      collectionEmbed.setThumbnail(targetUser.displayAvatarURL({ dynamic: true }));
    }
    
    const response = { embeds: [collectionEmbed] };
    
    if (totalPages > 1) {
      response.components = [createPaginationButtons(page, totalPages, 'col_')];
    }
    
    await message.reply(response);
  }
};
