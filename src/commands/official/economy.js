const { registerOfficialCommand, COMMAND_CATEGORIES } = require('../../services/commandRegistry');
const { PERMISSION_LEVELS } = require('../../services/permissionService');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const { BOT_CONFIG } = require('../../core/config');
const { getServerSettings } = require('../../services/serverSettingsService');
const { 
  getBalance, 
  exchangeCurrency, 
  getExchangeRates, 
  setExchangeRates,
  getTransactionHistory 
} = require('../../services/economyService');

registerOfficialCommand('exchange', {
  aliases: ['convert', 'swap'],
  description: 'Exchange between server and official currencies',
  category: COMMAND_CATEGORIES.ECONOMY,
  usage: '!exchange <from> <to> <amount>',
  examples: [
    '!exchange coins playcoins 1000',
    '!exchange playcoins coins 100',
    '!exchange gems playgems 50'
  ],
  cooldown: 5,
  execute: async (message, args) => {
    const userId = message.author.id;
    const serverId = message.guild.id;
    
    if (args.length < 3) {
      const settings = await getServerSettings(serverId);
      const rates = await getExchangeRates(serverId);
      const primaryName = settings?.currencies?.primary?.name?.toLowerCase() || 'coins';
      const premiumName = settings?.currencies?.premium?.name?.toLowerCase() || 'gems';
      
      const embed = new EmbedBuilder()
        .setColor('#00D9FF')
        .setTitle('Currency Exchange')
        .setDescription('Exchange between server and official currencies')
        .addFields(
          { name: 'Usage', value: '`!exchange <from> <to> <amount>`', inline: false },
          { name: 'Available Pairs', value: 
            `\`${primaryName}\` ↔ \`playcoins\`\n` +
            `\`${premiumName}\` ↔ \`playgems\``, inline: true },
          { name: 'Current Rates', value: 
            `${primaryName} → playcoins: ${rates?.rates?.serverToOfficial?.primaryToPlayCoins || 10}:1\n` +
            `playcoins → ${primaryName}: 1:${rates?.rates?.officialToServer?.playCoinsToprimary || 10}`, inline: true },
          { name: 'Fee', value: `${rates?.fees?.exchangeFeePercent || 5}%`, inline: true }
        );
      
      await message.reply({ embeds: [embed] });
      return;
    }
    
    const fromCurrency = args[0].toLowerCase();
    const toCurrency = args[1].toLowerCase();
    const amount = parseInt(args[2]);
    
    if (!amount || amount <= 0) {
      await message.reply('Please enter a valid amount.');
      return;
    }
    
    const settings = await getServerSettings(serverId);
    const primaryName = settings?.currencies?.primary?.name?.toLowerCase() || 'coins';
    const premiumName = settings?.currencies?.premium?.name?.toLowerCase() || 'gems';
    
    let fromKey, toKey;
    
    if (fromCurrency === primaryName && toCurrency === 'playcoins') {
      fromKey = 'primary';
      toKey = 'playCoins';
    } else if (fromCurrency === 'playcoins' && toCurrency === primaryName) {
      fromKey = 'playCoins';
      toKey = 'primary';
    } else if (fromCurrency === premiumName && toCurrency === 'playgems') {
      fromKey = 'premium';
      toKey = 'playGems';
    } else if (fromCurrency === 'playgems' && toCurrency === premiumName) {
      fromKey = 'playGems';
      toKey = 'premium';
    } else {
      await message.reply(`Invalid currency pair. Use \`!exchange\` to see available pairs.`);
      return;
    }
    
    const result = await exchangeCurrency(userId, serverId, fromKey, toKey, amount);
    
    if (!result.success) {
      await message.reply(`Exchange failed: ${result.error}`);
      return;
    }
    
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('Exchange Successful!')
      .addFields(
        { name: 'Exchanged', value: `${result.originalAmount} ${fromCurrency}`, inline: true },
        { name: 'Fee', value: `${result.fee} ${fromCurrency}`, inline: true },
        { name: 'Received', value: `${result.convertedAmount} ${toCurrency}`, inline: true }
      )
      .setFooter({ text: `Rate: ${result.exchangeRate}:1` });
    
    await message.reply({ embeds: [embed] });
  }
});

registerOfficialCommand('setexchangerate', {
  aliases: ['exchangerate'],
  description: 'Set currency exchange rates (PlayAdmin only)',
  category: COMMAND_CATEGORIES.ADMIN,
  usage: '!setexchangerate <pair> <rate>',
  examples: [
    '!setexchangerate coins-playcoins 10',
    '!setexchangerate playcoins-coins 10'
  ],
  requiredPermission: PERMISSION_LEVELS.PLAY_ADMIN,
  execute: async (message, args) => {
    if (args.length < 2) {
      await message.reply('Usage: `!setexchangerate <pair> <rate>`\nPairs: `coins-playcoins`, `playcoins-coins`, `gems-playgems`, `playgems-gems`');
      return;
    }
    
    const pair = args[0].toLowerCase();
    const rate = parseFloat(args[1]);
    
    if (!rate || rate <= 0) {
      await message.reply('Please enter a valid rate (positive number).');
      return;
    }
    
    const serverId = message.guild.id;
    const currentRates = await getExchangeRates(serverId);
    const newRates = { ...currentRates.rates };
    
    if (pair === 'coins-playcoins' || pair === 'primary-playcoins') {
      newRates.serverToOfficial = { ...newRates.serverToOfficial, primaryToPlayCoins: rate };
    } else if (pair === 'playcoins-coins' || pair === 'playcoins-primary') {
      newRates.officialToServer = { ...newRates.officialToServer, playCoinsToprimary: rate };
    } else if (pair === 'gems-playgems' || pair === 'premium-playgems') {
      newRates.serverToOfficial = { ...newRates.serverToOfficial, premiumToPlayGems: rate };
    } else if (pair === 'playgems-gems' || pair === 'playgems-premium') {
      newRates.officialToServer = { ...newRates.officialToServer, playGemsToPremium: rate };
    } else {
      await message.reply('Invalid pair. Use: `coins-playcoins`, `playcoins-coins`, `gems-playgems`, `playgems-gems`');
      return;
    }
    
    const result = await setExchangeRates(serverId, newRates, message.author.id);
    
    if (result.success) {
      await message.reply(`Exchange rate for \`${pair}\` set to ${rate}:1!`);
    } else {
      await message.reply(`Failed: ${result.error}`);
    }
  }
});

registerOfficialCommand('setexchangefee', {
  aliases: ['exchangefee'],
  description: 'Set currency exchange fee percentage (PlayAdmin only)',
  category: COMMAND_CATEGORIES.ADMIN,
  usage: '!setexchangefee <percent>',
  examples: ['!setexchangefee 5'],
  requiredPermission: PERMISSION_LEVELS.PLAY_ADMIN,
  execute: async (message, args) => {
    if (!args[0]) {
      await message.reply('Usage: `!setexchangefee <percent>` (0-50)');
      return;
    }
    
    const fee = parseFloat(args[0]);
    
    if (isNaN(fee) || fee < 0 || fee > 50) {
      await message.reply('Fee must be between 0 and 50.');
      return;
    }
    
    const serverId = message.guild.id;
    const currentRates = await getExchangeRates(serverId);
    currentRates.fees.exchangeFeePercent = fee;
    
    const { getCollection, COLLECTIONS } = require('../../infrastructure/database');
    const collection = await getCollection(COLLECTIONS.CURRENCY_EXCHANGE_RATES);
    
    await collection.updateOne(
      { serverId },
      { 
        $set: { 
          'fees.exchangeFeePercent': fee,
          lastUpdatedBy: message.author.id,
          updatedAt: new Date()
        }
      }
    );
    
    await message.reply(`Exchange fee set to ${fee}%!`);
  }
});

registerOfficialCommand('transactions', {
  aliases: ['history', 'txn'],
  description: 'View your transaction history',
  category: COMMAND_CATEGORIES.ECONOMY,
  usage: '!transactions [limit]',
  examples: ['!transactions', '!transactions 20'],
  execute: async (message, args) => {
    const userId = message.author.id;
    const serverId = message.guild.id;
    const limit = Math.min(parseInt(args[0]) || 10, 25);
    
    const transactions = await getTransactionHistory(userId, serverId, limit);
    
    if (transactions.length === 0) {
      await message.reply('No transactions found.');
      return;
    }
    
    const formatTxn = (txn) => {
      const date = new Date(txn.createdAt).toLocaleDateString();
      const sign = txn.amount >= 0 ? '+' : '';
      return `\`${date}\` ${txn.type} | ${sign}${txn.amount} ${txn.currency}`;
    };
    
    const embed = new EmbedBuilder()
      .setColor('#00D9FF')
      .setTitle(`${message.author.username}'s Transactions`)
      .setDescription(transactions.map(formatTxn).join('\n'))
      .setFooter({ text: `Showing ${transactions.length} transactions` });
    
    await message.reply({ embeds: [embed] });
  }
});

registerOfficialCommand('daily', {
  aliases: ['claim'],
  description: 'Claim your daily reward',
  category: COMMAND_CATEGORIES.ECONOMY,
  usage: '!daily',
  cooldown: 3,
  execute: async (message) => {
    const userId = message.author.id;
    const serverId = message.guild.id;
    
    const { getServerProfile, updateServerProfile } = require('../../services/profileService');
    const { updateServerBalance } = require('../../services/economyService');
    
    const profile = await getServerProfile(userId, serverId);
    
    if (!profile?.started) {
      await message.reply('You need to use `!start` first!');
      return;
    }
    
    const now = Date.now();
    const lastClaim = profile.lastDailyClaim;
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    if (lastClaim && (now - new Date(lastClaim).getTime()) < oneDayMs) {
      const nextClaim = new Date(new Date(lastClaim).getTime() + oneDayMs);
      const timeLeft = nextClaim - now;
      const hours = Math.floor(timeLeft / (60 * 60 * 1000));
      const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
      
      await message.reply(`You've already claimed today! Next claim in ${hours}h ${minutes}m.`);
      return;
    }
    
    const settings = await getServerSettings(serverId);
    const streak = (profile.dailyStreak || 0) + 1;
    const baseReward = 100;
    const streakBonus = Math.min(streak * 10, 100);
    const totalReward = baseReward + streakBonus;
    
    await updateServerBalance(userId, serverId, 'primary', totalReward, 'Daily reward');
    await updateServerProfile(userId, serverId, {
      lastDailyClaim: new Date(),
      dailyStreak: streak
    });
    
    const primaryCurrency = settings?.currencies?.primary || { name: 'Coins', symbol: '🪙' };
    
    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('Daily Reward Claimed!')
      .addFields(
        { name: 'Reward', value: `${primaryCurrency.symbol} ${totalReward} ${primaryCurrency.name}`, inline: true },
        { name: 'Streak', value: `${streak} days`, inline: true },
        { name: 'Streak Bonus', value: `+${streakBonus}`, inline: true }
      )
      .setFooter({ text: 'Come back tomorrow for more!' });
    
    await message.reply({ embeds: [embed] });
  }
});

module.exports = {};
