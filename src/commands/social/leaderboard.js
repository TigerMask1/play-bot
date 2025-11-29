const { EmbedBuilder } = require('discord.js');
const { COLORS, EMOJIS } = require('../../config/constants');
const { leaderboardEmbed } = require('../../utils/embeds');
const db = require('../../database/MongoDB');

module.exports = {
  name: 'leaderboard',
  description: 'View server leaderboards',
  aliases: ['lb', 'top', 'rankings'],
  usage: '[type]',
  cooldown: 5,
  module: 'leaderboards',
  
  async execute({ message, args, serverConfig, prefix }) {
    const type = args[0]?.toLowerCase() || 'coins';
    
    const types = {
      coins: { field: 'balance', title: 'Richest Players', emoji: serverConfig.economy?.currencyEmoji || EMOJIS.COINS },
      gems: { field: 'gems', title: 'Most Gems', emoji: serverConfig.economy?.premiumEmoji || EMOJIS.GEMS },
      level: { field: 'level', title: 'Highest Level', emoji: '📊' },
      collection: { field: 'stats.charactersCollected', title: 'Biggest Collectors', emoji: '📦' },
      battles: { field: 'stats.battlesWon', title: 'Battle Champions', emoji: EMOJIS.BATTLE },
      playcoins: { field: 'global', title: 'Top PlayCoins (Global)', emoji: EMOJIS.PLAYCOINS }
    };
    
    if (!types[type]) {
      const validTypes = Object.keys(types).join(', ');
      return message.reply(`❌ Invalid type! Available: ${validTypes}\nUsage: \`${prefix}leaderboard [type]\``);
    }
    
    const config = types[type];
    
    let entries;
    
    if (type === 'playcoins') {
      entries = await db.getGlobalLeaderboard('playCoins', 10);
    } else {
      entries = await db.getLeaderboard(message.guild.id, config.field, 10);
    }
    
    if (!entries || entries.length === 0) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.WARNING)
            .setTitle(`${config.emoji} ${config.title}`)
            .setDescription('No entries yet! Be the first to make it to the leaderboard.')
        ]
      });
    }
    
    const fieldPath = config.field.split('.');
    const getFieldValue = (entry) => {
      let value = entry;
      for (const key of fieldPath) {
        value = value?.[key];
      }
      return value || 0;
    };
    
    const formattedEntries = entries.map(entry => ({
      username: entry.username,
      [config.field]: getFieldValue(entry)
    }));
    
    const embed = leaderboardEmbed(config.title, formattedEntries, config.field, config.emoji);
    embed.setFooter({ text: `${message.guild.name} | Use ${prefix}leaderboard <type> for other rankings` });
    
    await message.reply({ embeds: [embed] });
  }
};
