const { EmbedBuilder } = require('discord.js');
const { COLORS, EMOJIS, BOT_NAME, ECONOMY } = require('../../config/constants');
const db = require('../../database/MongoDB');

module.exports = {
  name: 'start',
  description: 'Begin your collection journey',
  aliases: ['begin', 'register'],
  cooldown: 5,
  
  async execute({ message, serverUser, globalUser, serverConfig, prefix, db }) {
    if (serverUser.started) {
      return message.reply(`You've already started! Use \`${prefix}help\` to see available commands.`);
    }
    
    const currencyEmoji = serverConfig.economy?.currencyEmoji || EMOJIS.COINS;
    const currencyName = serverConfig.economy?.currencyName || 'Coins';
    
    await db.updateServerUser(message.guild.id, message.author.id, {
      started: true,
      balance: ECONOMY.STARTING_BALANCE,
      gems: ECONOMY.STARTING_GEMS
    });
    
    await db.incrementServerUser(message.guild.id, message.author.id, {});
    
    await db.updateServerConfig(message.guild.id, {
      'stats.membersStarted': (serverConfig.stats?.membersStarted || 0) + 1
    });
    
    const welcomeEmbed = new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle(`${EMOJIS.SUCCESS} Welcome to ${BOT_NAME}!`)
      .setDescription(`**${message.author.username}**, your journey begins now!

You've received:
${currencyEmoji} **${ECONOMY.STARTING_BALANCE} ${currencyName}**
${EMOJIS.PLAYCOINS} **0 PlayCoins** (Global Currency)

**Getting Started:**
• Wait for character drops in the drop channel
• Type \`${prefix}catch <code>\` to claim characters
• Use \`${prefix}collection\` to view your characters
• Battle other players with \`${prefix}battle @user\`

**Daily Rewards:**
• Use \`${prefix}daily\` every day for free rewards
• Build streaks for bonus coins!

**Need Help?**
• \`${prefix}help\` - View all commands
• \`${prefix}profile\` - Check your stats`)
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: `${BOT_NAME} | Good luck collecting!` })
      .setTimestamp();
    
    await message.reply({ embeds: [welcomeEmbed] });
  }
};
