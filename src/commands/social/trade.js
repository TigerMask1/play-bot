const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { COLORS, EMOJIS } = require('../../config/constants');
const { getRarityEmoji } = require('../../utils/embeds');
const db = require('../../database/MongoDB');

module.exports = {
  name: 'trade',
  description: 'Trade characters with another player',
  aliases: ['swap', 'exchange'],
  usage: '@user <your character #> <their character #>',
  cooldown: 60,
  requiresStart: true,
  module: 'trading',
  
  async execute({ message, args, serverUser, prefix }) {
    const target = message.mentions.users.first();
    
    if (!target) {
      return message.reply(`❌ Please mention a user! Usage: \`${prefix}trade @user <your char #> <their char #>\``);
    }
    
    if (target.id === message.author.id) {
      return message.reply('❌ You cannot trade with yourself!');
    }
    
    if (target.bot) {
      return message.reply('❌ You cannot trade with a bot!');
    }
    
    const targetUser = await db.getServerUser(message.guild.id, target.id);
    
    if (!targetUser || !targetUser.started) {
      return message.reply(`❌ **${target.username}** hasn't started playing yet!`);
    }
    
    const yourIndex = parseInt(args.find(a => !a.startsWith('<@')));
    const theirIndex = parseInt(args[args.length - 1]);
    
    if (isNaN(yourIndex) || isNaN(theirIndex)) {
      return message.reply(`❌ Please provide character numbers! Usage: \`${prefix}trade @user <your char #> <their char #>\`\nUse \`${prefix}collection\` to see character numbers.`);
    }
    
    const yourChar = serverUser.characters[yourIndex - 1];
    const theirChar = targetUser.characters[theirIndex - 1];
    
    if (!yourChar) {
      return message.reply(`❌ You don't have a character at position #${yourIndex}! Use \`${prefix}collection\` to check.`);
    }
    
    if (!theirChar) {
      return message.reply(`❌ **${target.username}** doesn't have a character at position #${theirIndex}!`);
    }
    
    const tradeEmbed = new EmbedBuilder()
      .setColor(COLORS.WARNING)
      .setTitle(`${EMOJIS.TRADE} Trade Request`)
      .setDescription(`**${message.author.username}** wants to trade with **${target.username}**!`)
      .addFields(
        {
          name: `${message.author.username} offers`,
          value: `${getRarityEmoji(yourChar.rarity)} **${yourChar.name}** (Lv.${yourChar.level || 1})`,
          inline: true
        },
        {
          name: `${target.username} offers`,
          value: `${getRarityEmoji(theirChar.rarity)} **${theirChar.name}** (Lv.${theirChar.level || 1})`,
          inline: true
        }
      )
      .setFooter({ text: 'Trade expires in 60 seconds' });
    
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`trade_accept_${message.author.id}_${target.id}`)
        .setLabel('Accept Trade')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅'),
      new ButtonBuilder()
        .setCustomId(`trade_decline_${message.author.id}_${target.id}`)
        .setLabel('Decline')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌')
    );
    
    const tradeMsg = await message.reply({ embeds: [tradeEmbed], components: [row] });
    
    const collector = tradeMsg.createMessageComponentCollector({
      filter: (i) => i.user.id === target.id,
      time: 60000,
      max: 1
    });
    
    collector.on('collect', async (interaction) => {
      if (interaction.customId.startsWith('trade_decline')) {
        await interaction.update({
          embeds: [
            new EmbedBuilder()
              .setColor(COLORS.ERROR)
              .setDescription(`${EMOJIS.ERROR} **${target.username}** declined the trade.`)
          ],
          components: []
        });
        return;
      }
      
      const freshSenderUser = await db.getServerUser(message.guild.id, message.author.id);
      const freshTargetUser = await db.getServerUser(message.guild.id, target.id);
      
      const senderHasChar = freshSenderUser.characters.some(c => c.characterId === yourChar.characterId);
      const targetHasChar = freshTargetUser.characters.some(c => c.characterId === theirChar.characterId);
      
      if (!senderHasChar || !targetHasChar) {
        await interaction.update({
          embeds: [
            new EmbedBuilder()
              .setColor(COLORS.ERROR)
              .setDescription(`${EMOJIS.ERROR} Trade failed! One of the characters is no longer available.`)
          ],
          components: []
        });
        return;
      }
      
      const senderNewChars = freshSenderUser.characters.filter(c => c.characterId !== yourChar.characterId);
      senderNewChars.push({ ...theirChar, obtainedAt: new Date() });
      
      const targetNewChars = freshTargetUser.characters.filter(c => c.characterId !== theirChar.characterId);
      targetNewChars.push({ ...yourChar, obtainedAt: new Date() });
      
      await db.updateServerUser(message.guild.id, message.author.id, {
        characters: senderNewChars,
        'stats.tradesCompleted': (freshSenderUser.stats?.tradesCompleted || 0) + 1
      });
      
      await db.updateServerUser(message.guild.id, target.id, {
        characters: targetNewChars,
        'stats.tradesCompleted': (freshTargetUser.stats?.tradesCompleted || 0) + 1
      });
      
      await interaction.update({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.SUCCESS)
            .setTitle(`${EMOJIS.SUCCESS} Trade Complete!`)
            .setDescription(`**${message.author.username}** and **${target.username}** completed a trade!`)
            .addFields(
              {
                name: `${message.author.username} received`,
                value: `${getRarityEmoji(theirChar.rarity)} **${theirChar.name}**`,
                inline: true
              },
              {
                name: `${target.username} received`,
                value: `${getRarityEmoji(yourChar.rarity)} **${yourChar.name}**`,
                inline: true
              }
            )
        ],
        components: []
      });
    });
    
    collector.on('end', (collected) => {
      if (collected.size === 0) {
        tradeMsg.edit({
          embeds: [
            new EmbedBuilder()
              .setColor(COLORS.WARNING)
              .setDescription(`${EMOJIS.WARNING} Trade request expired.`)
          ],
          components: []
        }).catch(() => {});
      }
    });
  }
};
