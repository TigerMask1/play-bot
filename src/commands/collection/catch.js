const { EmbedBuilder } = require('discord.js');
const { COLORS, EMOJIS, ECONOMY } = require('../../config/constants');
const { randomInt } = require('../../utils/helpers');
const { getRarityEmoji, formatRarity } = require('../../utils/embeds');

module.exports = {
  name: 'catch',
  description: 'Catch a dropped character',
  aliases: ['c', 'claim', 'grab'],
  usage: '<code>',
  cooldown: 1,
  requiresStart: true,
  module: 'drops',
  
  async execute({ bot, message, args, serverConfig, prefix, db }) {
    if (!args[0]) {
      return message.reply(`❌ Please provide the catch code! Usage: \`${prefix}catch <code>\``);
    }
    
    const code = args[0].toUpperCase();
    const serverId = message.guild.id;
    
    const dropModule = bot.getModule('drops');
    if (!dropModule) {
      return message.reply('❌ Drop system is not available.');
    }
    
    const drop = dropModule.getActiveDrop(serverId);
    
    if (!drop) {
      return message.reply('❌ There is no active drop right now! Wait for the next one.');
    }
    
    if (drop.code !== code) {
      return message.reply('❌ Wrong code! Try again.');
    }
    
    dropModule.clearDrop(serverId);
    
    const character = drop.character;
    const coinsEarned = randomInt(ECONOMY.DROP_COINS_MIN, ECONOMY.DROP_COINS_MAX);
    const playCoinsEarned = randomInt(ECONOMY.DROP_PLAYCOINS_MIN, ECONOMY.DROP_PLAYCOINS_MAX);
    
    const ownedCharacter = {
      ...character,
      obtainedAt: new Date(),
      level: 1,
      xp: 0
    };
    
    await db.collection('server_users').updateOne(
      { serverId, odiscrdId: message.author.id },
      {
        $push: { characters: ownedCharacter },
        $inc: {
          balance: coinsEarned,
          'stats.dropsCaught': 1,
          'stats.charactersCollected': 1
        },
        $set: { lastActivity: new Date() }
      }
    );
    
    await db.incrementGlobalUser(message.author.id, {
      playCoins: playCoinsEarned,
      'globalStats.totalCharacters': 1
    });
    
    await db.updateServerConfig(serverId, {
      'stats.totalCatches': (serverConfig.stats?.totalCatches || 0) + 1
    });
    
    const currencyEmoji = serverConfig.economy?.currencyEmoji || EMOJIS.COINS;
    
    const catchEmbed = new EmbedBuilder()
      .setColor(COLORS.RARITY[character.rarity] || COLORS.SUCCESS)
      .setTitle(`${EMOJIS.SUCCESS} Caught!`)
      .setDescription(`**${message.author.username}** caught **${getRarityEmoji(character.rarity)} ${character.name}**!`)
      .addFields(
        { name: 'Rarity', value: formatRarity(character.rarity), inline: true },
        { name: `${currencyEmoji} Coins`, value: `+${coinsEarned}`, inline: true },
        { name: `${EMOJIS.PLAYCOINS} PlayCoins`, value: `+${playCoinsEarned}`, inline: true }
      )
      .setFooter({ text: `Use ${prefix}collection to view your characters!` })
      .setTimestamp();
    
    if (character.imageUrl) {
      catchEmbed.setThumbnail(character.imageUrl);
    }
    
    await message.reply({ embeds: [catchEmbed] });
  }
};
