const { EmbedBuilder } = require('discord.js');
const { COLORS, EMOJIS } = require('../../config/constants');
const { transferCoins } = require('../../utils/economy');

module.exports = {
  name: 'gift',
  description: 'Gift coins to another player',
  aliases: ['give', 'pay', 'send'],
  usage: '<@user> <amount>',
  cooldown: 10,
  requiresStart: true,
  
  async execute({ message, args, serverUser, serverConfig, prefix }) {
    const target = message.mentions.users.first();
    
    if (!target) {
      return message.reply(`❌ Please mention a user! Usage: \`${prefix}gift @user <amount>\``);
    }
    
    if (target.id === message.author.id) {
      return message.reply('❌ You cannot gift coins to yourself!');
    }
    
    if (target.bot) {
      return message.reply('❌ You cannot gift coins to a bot!');
    }
    
    const db = require('../../database/MongoDB');
    const targetUser = await db.getServerUser(message.guild.id, target.id);
    
    if (!targetUser || !targetUser.started) {
      return message.reply(`❌ **${target.username}** hasn't started playing yet!`);
    }
    
    const amountArg = args.find(arg => !arg.startsWith('<@'));
    if (!amountArg) {
      return message.reply(`❌ Please specify an amount! Usage: \`${prefix}gift @user <amount>\``);
    }
    
    const amount = parseInt(amountArg);
    
    if (isNaN(amount) || amount <= 0) {
      return message.reply('❌ Please enter a valid positive number!');
    }
    
    if (amount > serverUser.balance) {
      return message.reply(`❌ You don't have enough coins! Your balance: **${serverUser.balance.toLocaleString()}**`);
    }
    
    const result = await transferCoins(
      message.guild.id,
      message.author.id,
      target.id,
      amount
    );
    
    if (!result.success) {
      return message.reply(`❌ Transfer failed: ${result.reason}`);
    }
    
    const currencyEmoji = serverConfig.economy?.currencyEmoji || EMOJIS.COINS;
    const currencyName = serverConfig.economy?.currencyName || 'Coins';
    
    const giftEmbed = new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle(`${EMOJIS.SUCCESS} Gift Sent!`)
      .setDescription(`**${message.author.username}** gifted ${currencyEmoji} **${amount.toLocaleString()} ${currencyName}** to **${target.username}**!`)
      .addFields(
        {
          name: 'Your New Balance',
          value: `${currencyEmoji} **${(serverUser.balance - amount).toLocaleString()}**`,
          inline: true
        }
      )
      .setTimestamp();
    
    await message.reply({ embeds: [giftEmbed] });
  }
};
