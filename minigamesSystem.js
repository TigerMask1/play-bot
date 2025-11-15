const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { saveDataImmediate } = require('./dataManager.js');
const { isMainServer } = require('./serverConfigManager.js');

const activeGames = new Map();

const COOLDOWNS = new Map();
const COOLDOWN_TIME = 10000; // 10 seconds between games

function getMultiplier(serverId) {
  return isMainServer(serverId) ? 1.5 : 1.0;
}

function checkCooldown(userId, gameName) {
  const key = `${userId}_${gameName}`;
  const now = Date.now();
  
  if (COOLDOWNS.has(key)) {
    const lastPlayed = COOLDOWNS.get(key);
    const timeLeft = COOLDOWN_TIME - (now - lastPlayed);
    
    if (timeLeft > 0) {
      return { onCooldown: true, timeLeft: Math.ceil(timeLeft / 1000) };
    }
  }
  
  COOLDOWNS.set(key, now);
  return { onCooldown: false };
}

async function coinDuel(message, args, data) {
  const userId = message.author.id;
  const serverId = message.guild?.id;
  const userData = data.users[userId];
  
  const cooldown = checkCooldown(userId, 'coinduel');
  if (cooldown.onCooldown) {
    return message.reply(`⏰ Cooldown! Wait ${cooldown.timeLeft}s before playing again.`);
  }
  
  if (!args[0] || !args[1]) {
    return message.reply('Usage: `!coinduel <heads/tails> <bet amount>`\n\n**How to play:**\n• Pick heads or tails\n• Bet coins (minimum 10)\n• Win ×2 coins on correct guess\n• 5% chance of 🪙 **Golden Flip** for ×5 payout!');
  }
  
  const choice = args[0].toLowerCase();
  const betAmount = parseInt(args[1]);
  
  if (choice !== 'heads' && choice !== 'tails') {
    return message.reply('❌ Choose either `heads` or `tails`!');
  }
  
  if (isNaN(betAmount) || betAmount < 10) {
    return message.reply('❌ Minimum bet is 10 coins!');
  }
  
  if ((userData.coins || 0) < betAmount) {
    return message.reply(`❌ You don't have enough coins!\n💰 Your balance: ${userData.coins || 0} coins`);
  }
  
  userData.coins -= betAmount;
  
  const isGoldenFlip = Math.random() < 0.05;
  const result = Math.random() < 0.5 ? 'heads' : 'tails';
  const won = result === choice;
  
  const multiplier = getMultiplier(serverId);
  let winAmount = 0;
  let resultEmoji = '';
  let title = '';
  
  if (won) {
    if (isGoldenFlip) {
      winAmount = Math.floor(betAmount * 5 * multiplier);
      resultEmoji = '🪙';
      title = '🪙 GOLDEN FLIP! HUGE WIN!';
    } else {
      winAmount = Math.floor(betAmount * 2 * multiplier);
      resultEmoji = '🎉';
      title = '🎉 YOU WON!';
    }
    userData.coins += winAmount;
  } else {
    resultEmoji = '❌';
    title = '❌ YOU LOST!';
  }
  
  await saveDataImmediate(data);
  
  const embed = new EmbedBuilder()
    .setColor(won ? '#00FF00' : '#FF0000')
    .setTitle(title)
    .setDescription(`${resultEmoji} The coin landed on **${result.toUpperCase()}**!\n\nYou picked: **${choice.toUpperCase()}**\n${isGoldenFlip ? '✨ **GOLDEN FLIP BONUS!** ✨\n' : ''}\n**Bet:** ${betAmount} 💰\n**${won ? 'Won' : 'Lost'}:** ${won ? `+${winAmount}` : betAmount} 💰\n\n💰 **New Balance:** ${userData.coins} coins`)
    .setFooter({ text: isMainServer(serverId) ? '⭐ Main Server - 1.5× rewards!' : 'Play on main server for 1.5× rewards!' });
  
  return message.reply({ embeds: [embed] });
}

async function diceClash(message, args, data) {
  const userId = message.author.id;
  const serverId = message.guild?.id;
  const userData = data.users[userId];
  
  const cooldown = checkCooldown(userId, 'diceclash');
  if (cooldown.onCooldown) {
    return message.reply(`⏰ Cooldown! Wait ${cooldown.timeLeft}s before playing again.`);
  }
  
  if (!args[0]) {
    return message.reply('Usage: `!diceclash <bet amount>`\n\n**How to play:**\n• Bet coins and roll dice\n• Roll 4-6: Win and continue with higher multiplier\n• Roll 1-3: Lose everything\n• Cash out anytime with buttons!\n• Max 5 rounds for huge wins!');
  }
  
  const betAmount = parseInt(args[0]);
  
  if (isNaN(betAmount) || betAmount < 10) {
    return message.reply('❌ Minimum bet is 10 coins!');
  }
  
  if ((userData.coins || 0) < betAmount) {
    return message.reply(`❌ You don't have enough coins!\n💰 Your balance: ${userData.coins || 0} coins`);
  }
  
  userData.coins -= betAmount;
  await saveDataImmediate(data);
  
  const gameId = `${userId}_${Date.now()}`;
  activeGames.set(gameId, {
    userId,
    betAmount,
    currentMultiplier: 1.5,
    round: 1,
    serverId
  });
  
  const roll = Math.floor(Math.random() * 6) + 1;
  const won = roll >= 4;
  
  if (!won) {
    activeGames.delete(gameId);
    
    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('🎲 DICE CLASH - BUSTED!')
      .setDescription(`You rolled: **${roll}** 🎲\n\n❌ You needed 4-6 to win!\n\n**Lost:** ${betAmount} 💰\n💰 **Balance:** ${userData.coins} coins`)
      .setFooter({ text: 'Better luck next time!' });
    
    return message.reply({ embeds: [embed] });
  }
  
  const multiplier = getMultiplier(serverId);
  const currentWinnings = Math.floor(betAmount * 1.5 * multiplier);
  
  const embed = new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle('🎲 DICE CLASH - Round 1')
    .setDescription(`You rolled: **${roll}** 🎲\n\n✅ You won!\n\n**Current Winnings:** ${currentWinnings} 💰\n**Next Multiplier:** ×2.0\n\n🎰 **Cash out now or risk it for more?**`)
    .setFooter({ text: `Round 1/5 | ${isMainServer(serverId) ? '⭐ Main Server Bonus Active!' : ''}` });
  
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`diceclash_continue_${gameId}`)
        .setLabel('🎲 Roll Again')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`diceclash_cashout_${gameId}`)
        .setLabel('💰 Cash Out')
        .setStyle(ButtonStyle.Success)
    );
  
  return message.reply({ embeds: [embed], components: [row] });
}

async function doorOfFate(message, args, data) {
  const userId = message.author.id;
  const serverId = message.guild?.id;
  const userData = data.users[userId];
  
  const cooldown = checkCooldown(userId, 'dooroffate');
  if (cooldown.onCooldown) {
    return message.reply(`⏰ Cooldown! Wait ${cooldown.timeLeft}s before playing again.`);
  }
  
  if (!args[0]) {
    return message.reply('Usage: `!dooroffate <bet amount>`\n\n**How to play:**\n• Bet coins and pick a door (1, 2, or 3)\n• 🚪 Door 1: 40% chance - Big Win (×3)\n• 🚪 Door 2: 40% chance - Small Win (×1.5)\n• 🚪 Door 3: 20% chance - Lose All (×0)\n• High risk, high reward!');
  }
  
  const betAmount = parseInt(args[0]);
  
  if (isNaN(betAmount) || betAmount < 10) {
    return message.reply('❌ Minimum bet is 10 coins!');
  }
  
  if ((userData.coins || 0) < betAmount) {
    return message.reply(`❌ You don't have enough coins!\n💰 Your balance: ${userData.coins || 0} coins`);
  }
  
  userData.coins -= betAmount;
  await saveDataImmediate(data);
  
  const gameId = `${userId}_${Date.now()}`;
  activeGames.set(gameId, {
    userId,
    betAmount,
    serverId,
    doors: shuffleDoors()
  });
  
  const embed = new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle('🚪 DOOR OF FATE')
    .setDescription(`You've bet **${betAmount} 💰**\n\n**Choose your fate:**\n🚪 **Door 1** - Mystery awaits...\n🚪 **Door 2** - What's behind here?\n🚪 **Door 3** - Take the risk?\n\n**Possible outcomes:**\n✅ Big Win (×3)\n⚠️ Small Win (×1.5)\n❌ Lose All`)
    .setFooter({ text: 'Click a button to choose your door!' });
  
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`door_1_${gameId}`)
        .setLabel('🚪 Door 1')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`door_2_${gameId}`)
        .setLabel('🚪 Door 2')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`door_3_${gameId}`)
        .setLabel('🚪 Door 3')
        .setStyle(ButtonStyle.Primary)
    );
  
  return message.reply({ embeds: [embed], components: [row] });
}

function shuffleDoors() {
  const outcomes = ['bigwin', 'smallwin', 'lose'];
  return outcomes.sort(() => Math.random() - 0.5);
}

async function almostWinMachine(message, args, data) {
  const userId = message.author.id;
  const serverId = message.guild?.id;
  const userData = data.users[userId];
  
  const cooldown = checkCooldown(userId, 'almostwin');
  if (cooldown.onCooldown) {
    return message.reply(`⏰ Cooldown! Wait ${cooldown.timeLeft}s before playing again.`);
  }
  
  if (!args[0]) {
    return message.reply('Usage: `!almostwin <bet amount>`\n\n**How to play:**\n• Roll a number between 1-100\n• 🎯 90-100: JACKPOT! (×10)\n• 🎉 75-89: Big Win (×4)\n• ✅ 50-74: Medium Win (×2)\n• ⚠️ 25-49: Small Win (×1.2)\n• ❌ 1-24: Lose\n• So close... try again!');
  }
  
  const betAmount = parseInt(args[0]);
  
  if (isNaN(betAmount) || betAmount < 10) {
    return message.reply('❌ Minimum bet is 10 coins!');
  }
  
  if ((userData.coins || 0) < betAmount) {
    return message.reply(`❌ You don't have enough coins!\n💰 Your balance: ${userData.coins || 0} coins`);
  }
  
  userData.coins -= betAmount;
  
  const roll = Math.floor(Math.random() * 100) + 1;
  const multiplier = getMultiplier(serverId);
  
  let result, color, winMultiplier, winAmount;
  
  if (roll >= 90) {
    result = '🎯 JACKPOT!!!';
    color = '#FFD700';
    winMultiplier = 10 * multiplier;
    winAmount = Math.floor(betAmount * winMultiplier);
  } else if (roll >= 75) {
    result = '🎉 BIG WIN!';
    color = '#00FF00';
    winMultiplier = 4 * multiplier;
    winAmount = Math.floor(betAmount * winMultiplier);
  } else if (roll >= 50) {
    result = '✅ Medium Win!';
    color = '#32CD32';
    winMultiplier = 2 * multiplier;
    winAmount = Math.floor(betAmount * winMultiplier);
  } else if (roll >= 25) {
    result = '⚠️ Small Win';
    color = '#FFA500';
    winMultiplier = 1.2 * multiplier;
    winAmount = Math.floor(betAmount * winMultiplier);
  } else {
    result = '❌ Lost!';
    color = '#FF0000';
    winMultiplier = 0;
    winAmount = 0;
  }
  
  userData.coins += winAmount;
  await saveDataImmediate(data);
  
  const nearMiss = roll >= 20 && roll < 25 ? '\n\n😱 **SO CLOSE!** You were just 1-5 away from winning!' :
                  roll >= 85 && roll < 90 ? '\n\n😱 **ALMOST JACKPOT!** You were so close to ×10!' : '';
  
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle('🎰 ALMOST-WIN MACHINE')
    .setDescription(`You rolled: **${roll}/100**\n\n${result}${nearMiss}\n\n**Bet:** ${betAmount} 💰\n**${winAmount > 0 ? 'Won' : 'Lost'}:** ${winAmount > 0 ? `+${winAmount}` : betAmount} 💰\n\n💰 **New Balance:** ${userData.coins} coins`)
    .setFooter({ text: isMainServer(serverId) ? '⭐ Main Server - 1.5× rewards!' : 'Try again!' });
  
  return message.reply({ embeds: [embed] });
}

async function rockPaperScissors(message, args, data) {
  const userId = message.author.id;
  const serverId = message.guild?.id;
  const userData = data.users[userId];
  
  const cooldown = checkCooldown(userId, 'rps');
  if (cooldown.onCooldown) {
    return message.reply(`⏰ Cooldown! Wait ${cooldown.timeLeft}s before playing again.`);
  }
  
  if (!args[0] || !args[1]) {
    return message.reply('Usage: `!rps <rock/paper/scissors> <bet amount>`\n\n**How to play:**\n• Choose rock, paper, or scissors\n• Bet coins\n• Win ×2 coins if you beat the bot\n• Tie = bet refunded\n• 🎁 5% chance for ×3 **Critical Win**!');
  }
  
  const choice = args[0].toLowerCase();
  const betAmount = parseInt(args[1]);
  
  if (!['rock', 'paper', 'scissors'].includes(choice)) {
    return message.reply('❌ Choose `rock`, `paper`, or `scissors`!');
  }
  
  if (isNaN(betAmount) || betAmount < 10) {
    return message.reply('❌ Minimum bet is 10 coins!');
  }
  
  if ((userData.coins || 0) < betAmount) {
    return message.reply(`❌ You don't have enough coins!\n💰 Your balance: ${userData.coins || 0} coins`);
  }
  
  userData.coins -= betAmount;
  
  const choices = ['rock', 'paper', 'scissors'];
  const botChoice = choices[Math.floor(Math.random() * 3)];
  
  const emojis = {
    rock: '🪨',
    paper: '📄',
    scissors: '✂️'
  };
  
  let result, color, winAmount = 0;
  const isCritical = Math.random() < 0.05;
  const multiplier = getMultiplier(serverId);
  
  if (choice === botChoice) {
    result = '🤝 TIE!';
    color = '#FFA500';
    winAmount = betAmount;
    userData.coins += winAmount;
  } else if (
    (choice === 'rock' && botChoice === 'scissors') ||
    (choice === 'paper' && botChoice === 'rock') ||
    (choice === 'scissors' && botChoice === 'paper')
  ) {
    if (isCritical) {
      result = '⚡ CRITICAL WIN!';
      color = '#FFD700';
      winAmount = Math.floor(betAmount * 3 * multiplier);
    } else {
      result = '🎉 YOU WIN!';
      color = '#00FF00';
      winAmount = Math.floor(betAmount * 2 * multiplier);
    }
    userData.coins += winAmount;
  } else {
    result = '❌ YOU LOSE!';
    color = '#FF0000';
  }
  
  await saveDataImmediate(data);
  
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle('🎮 ROCK PAPER SCISSORS')
    .setDescription(`${emojis[choice]} You: **${choice.toUpperCase()}**\n${emojis[botChoice]} Bot: **${botChoice.toUpperCase()}**\n\n${result}${isCritical ? '\n✨ **CRITICAL HIT BONUS!** ✨' : ''}\n\n**Bet:** ${betAmount} 💰\n**${result.includes('WIN') ? 'Won' : result.includes('TIE') ? 'Refunded' : 'Lost'}:** ${winAmount > 0 ? `+${winAmount}` : betAmount} 💰\n\n💰 **New Balance:** ${userData.coins} coins`)
    .setFooter({ text: isMainServer(serverId) ? '⭐ Main Server - 1.5× rewards!' : 'Play on main server for 1.5× rewards!' });
  
  return message.reply({ embeds: [embed] });
}

async function handleDiceClashButton(interaction, data) {
  const [action, type, gameId] = interaction.customId.split('_');
  
  const game = activeGames.get(gameId);
  if (!game) {
    return interaction.reply({ content: '❌ This game has expired!', ephemeral: true });
  }
  
  if (game.userId !== interaction.user.id) {
    return interaction.reply({ content: '❌ This is not your game!', ephemeral: true });
  }
  
  const userData = data.users[game.userId];
  const multiplier = getMultiplier(game.serverId);
  
  if (type === 'cashout') {
    const currentWinnings = Math.floor(game.betAmount * game.currentMultiplier * multiplier);
    userData.coins += currentWinnings;
    await saveDataImmediate(data);
    activeGames.delete(gameId);
    
    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('💰 CASHED OUT!')
      .setDescription(`Smart move! You cashed out safely.\n\n**Won:** ${currentWinnings} 💰\n💰 **New Balance:** ${userData.coins} coins`)
      .setFooter({ text: 'Play again anytime!' });
    
    return interaction.update({ embeds: [embed], components: [] });
  }
  
  if (type === 'continue') {
    if (game.round >= 5) {
      const finalWinnings = Math.floor(game.betAmount * game.currentMultiplier * multiplier);
      userData.coins += finalWinnings;
      await saveDataImmediate(data);
      activeGames.delete(gameId);
      
      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('🏆 MAX ROUNDS REACHED!')
        .setDescription(`You've reached the maximum 5 rounds!\n\n**Final Winnings:** ${finalWinnings} 💰\n💰 **New Balance:** ${userData.coins} coins`)
        .setFooter({ text: 'Amazing run!' });
      
      return interaction.update({ embeds: [embed], components: [] });
    }
    
    const roll = Math.floor(Math.random() * 6) + 1;
    const won = roll >= 4;
    
    if (!won) {
      activeGames.delete(gameId);
      
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('🎲 DICE CLASH - BUSTED!')
        .setDescription(`You rolled: **${roll}** 🎲\n\n❌ You needed 4-6 to continue!\n\n**Lost everything!**\n💰 **Balance:** ${userData.coins} coins`)
        .setFooter({ text: 'So close! Try again!' });
      
      return interaction.update({ embeds: [embed], components: [] });
    }
    
    game.round++;
    const multipliers = [1.5, 2.0, 3.0, 4.5, 6.0];
    game.currentMultiplier = multipliers[game.round - 1] || 6.0;
    
    const currentWinnings = Math.floor(game.betAmount * game.currentMultiplier * multiplier);
    const nextMultiplier = multipliers[game.round] || 'MAX';
    
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle(`🎲 DICE CLASH - Round ${game.round}`)
      .setDescription(`You rolled: **${roll}** 🎲\n\n✅ You won!\n\n**Current Winnings:** ${currentWinnings} 💰\n**Next Multiplier:** ×${nextMultiplier}\n\n${game.round >= 5 ? '🏆 **FINAL ROUND!** Cash out or risk it all!' : '🎰 **Cash out now or risk it for more?**'}`)
      .setFooter({ text: `Round ${game.round}/5 | ${isMainServer(game.serverId) ? '⭐ Main Server Bonus Active!' : ''}` });
    
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`diceclash_continue_${gameId}`)
          .setLabel('🎲 Roll Again')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`diceclash_cashout_${gameId}`)
          .setLabel('💰 Cash Out')
          .setStyle(ButtonStyle.Success)
      );
    
    return interaction.update({ embeds: [embed], components: [row] });
  }
}

async function handleDoorButton(interaction, data) {
  const parts = interaction.customId.split('_');
  const doorNumber = parseInt(parts[1]);
  const gameId = parts[2];
  
  const game = activeGames.get(gameId);
  if (!game) {
    return interaction.reply({ content: '❌ This game has expired!', ephemeral: true });
  }
  
  if (game.userId !== interaction.user.id) {
    return interaction.reply({ content: '❌ This is not your game!', ephemeral: true });
  }
  
  const userData = data.users[game.userId];
  const outcome = game.doors[doorNumber - 1];
  const multiplier = getMultiplier(game.serverId);
  
  let result, color, winAmount = 0;
  
  if (outcome === 'bigwin') {
    result = '🎉 BIG WIN!';
    color = '#FFD700';
    winAmount = Math.floor(game.betAmount * 3 * multiplier);
  } else if (outcome === 'smallwin') {
    result = '✅ Small Win';
    color = '#00FF00';
    winAmount = Math.floor(game.betAmount * 1.5 * multiplier);
  } else {
    result = '❌ LOSE ALL!';
    color = '#FF0000';
    winAmount = 0;
  }
  
  userData.coins += winAmount;
  await saveDataImmediate(data);
  activeGames.delete(gameId);
  
  const doorEmojis = ['🚪', '🚪', '🚪'];
  doorEmojis[doorNumber - 1] = outcome === 'bigwin' ? '💎' : outcome === 'smallwin' ? '💰' : '💀';
  
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle('🚪 DOOR OF FATE - REVEALED!')
    .setDescription(`You chose Door ${doorNumber}!\n\n${doorEmojis[0]} | ${doorEmojis[1]} | ${doorEmojis[2]}\n\n${result}\n\n**Bet:** ${game.betAmount} 💰\n**${winAmount > 0 ? 'Won' : 'Lost'}:** ${winAmount > 0 ? `+${winAmount}` : game.betAmount} 💰\n\n💰 **New Balance:** ${userData.coins} coins`)
    .setFooter({ text: isMainServer(game.serverId) ? '⭐ Main Server - 1.5× rewards!' : 'Try your luck again!' });
  
  return interaction.update({ embeds: [embed], components: [] });
}

module.exports = {
  coinDuel,
  diceClash,
  doorOfFate,
  almostWinMachine,
  rockPaperScissors,
  handleDiceClashButton,
  handleDoorButton
};
