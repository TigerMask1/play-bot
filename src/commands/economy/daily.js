const { EmbedBuilder } = require('discord.js');
const { COLORS, EMOJIS } = require('../../config/constants');
const { claimDaily } = require('../../utils/economy');
const { formatDuration } = require('../../utils/helpers');

module.exports = {
  name: 'daily',
  description: 'Claim your daily rewards',
  aliases: ['d'],
  cooldown: 5,
  requiresStart: true,
  
  async execute({ message, serverConfig }) {
    const result = await claimDaily(
      message.guild.id,
      message.author.id,
      serverConfig
    );
    
    const currencyEmoji = serverConfig.economy?.currencyEmoji || EMOJIS.COINS;
    const currencyName = serverConfig.economy?.currencyName || 'Coins';
    
    if (!result.success) {
      const timeLeft = formatDuration(result.remaining);
      
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.WARNING)
            .setTitle(`${EMOJIS.WARNING} Already Claimed!`)
            .setDescription(`You can claim your daily again in **${timeLeft}**`)
        ]
      });
    }
    
    const dailyEmbed = new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle(`${EMOJIS.SUCCESS} Daily Rewards Claimed!`)
      .setDescription(`**${message.author.username}** collected their daily rewards!`)
      .addFields(
        {
          name: `${currencyEmoji} ${currencyName}`,
          value: `+**${result.coins.toLocaleString()}**${result.streakBonus > 0 ? ` (includes +${result.streakBonus} streak bonus)` : ''}`,
          inline: true
        },
        {
          name: `${EMOJIS.PLAYCOINS} PlayCoins`,
          value: `+**${result.playCoins}**`,
          inline: true
        },
        {
          name: '🔥 Daily Streak',
          value: `**${result.streak}** days`,
          inline: true
        }
      )
      .setFooter({ text: 'Come back tomorrow to continue your streak!' })
      .setTimestamp();
    
    await message.reply({ embeds: [dailyEmbed] });
  }
};
