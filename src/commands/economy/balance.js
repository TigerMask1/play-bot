const { EmbedBuilder } = require('discord.js');
const { COLORS, EMOJIS } = require('../../config/constants');

module.exports = {
  name: 'balance',
  description: 'Check your balance',
  aliases: ['bal', 'coins', 'money', 'wallet'],
  cooldown: 3,
  requiresStart: true,
  module: 'collection',
  
  async execute({ message, serverUser, globalUser, serverConfig }) {
    const currencyEmoji = serverConfig.economy?.currencyEmoji || EMOJIS.COINS;
    const currencyName = serverConfig.economy?.currencyName || 'Coins';
    const premiumEmoji = serverConfig.economy?.premiumEmoji || EMOJIS.GEMS;
    const premiumName = serverConfig.economy?.premiumName || 'Gems';
    
    const balanceEmbed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle(`💰 ${message.author.username}'s Balance`)
      .addFields(
        {
          name: '📍 Server Currency',
          value: `${currencyEmoji} **${serverUser.balance.toLocaleString()}** ${currencyName}\n${premiumEmoji} **${serverUser.gems.toLocaleString()}** ${premiumName}`,
          inline: true
        },
        {
          name: '🌍 Global Currency',
          value: `${EMOJIS.PLAYCOINS} **${globalUser.playCoins.toLocaleString()}** PlayCoins\n${EMOJIS.PLAYGEMS} **${globalUser.playGems.toLocaleString()}** PlayGems`,
          inline: true
        }
      )
      .setFooter({ text: 'Server currency stays here | Global currency works everywhere!' })
      .setTimestamp();
    
    await message.reply({ embeds: [balanceEmbed] });
  }
};
