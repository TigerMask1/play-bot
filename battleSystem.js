const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { saveData } = require('./dataManager.js');
const { calculateBaseHP, calculateDamage, getMoveDisplay } = require('./battleUtils.js');

const activeBattles = new Map();
const battleInvites = new Map();

async function initiateBattle(message, data, challengerId, opponentId) {
  if (battleInvites.has(challengerId)) {
    await message.reply('❌ You already have a pending battle invite!');
    return;
  }
  
  if (battleInvites.has(opponentId)) {
    await message.reply('❌ That user already has a pending battle invite!');
    return;
  }
  
  if (activeBattles.has(challengerId)) {
    await message.reply('❌ You are already in a battle!');
    return;
  }
  
  if (activeBattles.has(opponentId)) {
    await message.reply('❌ That user is already in a battle!');
    return;
  }
  
  if (!data.users[opponentId]) {
    await message.reply('❌ That user hasn\'t started yet!');
    return;
  }
  
  if (data.users[challengerId].characters.length === 0) {
    await message.reply('❌ You don\'t have any characters! Use `!start` and `!select` to get started.');
    return;
  }
  
  if (data.users[opponentId].characters.length === 0) {
    await message.reply('❌ That user doesn\'t have any characters yet!');
    return;
  }
  
  const inviteId = `${challengerId}-${opponentId}-${Date.now()}`;
  
  const invite = {
    id: inviteId,
    challenger: challengerId,
    opponent: opponentId,
    channel: message.channel,
    timeout: null
  };
  
  battleInvites.set(challengerId, invite);
  battleInvites.set(opponentId, invite);
  
  const acceptButton = new ButtonBuilder()
    .setCustomId(`battle_accept_${inviteId}`)
    .setLabel('Accept')
    .setStyle(ButtonStyle.Success);
  
  const declineButton = new ButtonBuilder()
    .setCustomId(`battle_decline_${inviteId}`)
    .setLabel('Decline')
    .setStyle(ButtonStyle.Danger);
  
  const row = new ActionRowBuilder().addComponents(acceptButton, declineButton);
  
  const inviteEmbed = new EmbedBuilder()
    .setColor('#FF6B35')
    .setTitle('⚔️ BATTLE CHALLENGE!')
    .setDescription(`<@${challengerId}> challenges <@${opponentId}> to a battle!\n\n<@${opponentId}>, click Accept or Decline.\n\nInvite expires in 60 seconds.`);
  
  const inviteMessage = await message.channel.send({ embeds: [inviteEmbed], components: [row] });
  
  invite.message = inviteMessage;
  invite.timeout = setTimeout(() => {
    if (battleInvites.has(challengerId)) {
      expireBattleInvite(invite);
    }
  }, 60000);
  
  const filter = (interaction) => {
    return interaction.customId.startsWith('battle_') && 
           (interaction.user.id === challengerId || interaction.user.id === opponentId);
  };
  
  const collector = inviteMessage.createMessageComponentCollector({ filter, time: 60000 });
  
  collector.on('collect', async (interaction) => {
    if (interaction.customId === `battle_decline_${inviteId}`) {
      if (interaction.user.id !== opponentId) {
        await interaction.reply({ content: '❌ Only the challenged player can decline!', ephemeral: true });
        return;
      }
      
      await interaction.update({ 
        embeds: [new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('⚔️ Battle Declined')
          .setDescription(`<@${opponentId}> declined the battle challenge.`)],
        components: []
      });
      
      clearTimeout(invite.timeout);
      battleInvites.delete(challengerId);
      battleInvites.delete(opponentId);
      collector.stop();
    } else if (interaction.customId === `battle_accept_${inviteId}`) {
      if (interaction.user.id !== opponentId) {
        await interaction.reply({ content: '❌ Only the challenged player can accept!', ephemeral: true });
        return;
      }
      
      await interaction.update({ 
        embeds: [new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('⚔️ Battle Accepted!')
          .setDescription(`<@${opponentId}> accepted the challenge!\n\nBoth players, select your character!`)],
        components: []
      });
      
      clearTimeout(invite.timeout);
      battleInvites.delete(challengerId);
      battleInvites.delete(opponentId);
      collector.stop();
      
      await startCharacterSelection(message.channel, data, challengerId, opponentId);
    }
  });
}

async function expireBattleInvite(invite) {
  battleInvites.delete(invite.challenger);
  battleInvites.delete(invite.opponent);
  
  const expireEmbed = new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('⏱️ Battle Invite Expired')
    .setDescription('The battle invite has expired.');
  
  await invite.message.edit({ embeds: [expireEmbed], components: [] });
}

async function startCharacterSelection(channel, data, player1Id, player2Id) {
  const battle = {
    id: `battle-${player1Id}-${player2Id}-${Date.now()}`,
    player1: player1Id,
    player2: player2Id,
    player1Character: null,
    player2Character: null,
    player1HP: 0,
    player2HP: 0,
    player1MaxHP: 0,
    player2MaxHP: 0,
    currentTurn: null,
    channel: channel,
    timeout: null,
    started: false
  };
  
  activeBattles.set(player1Id, battle);
  activeBattles.set(player2Id, battle);
  
  const player1Chars = data.users[player1Id].characters;
  const player2Chars = data.users[player2Id].characters;
  
  const p1SelectEmbed = new EmbedBuilder()
    .setColor('#3498DB')
    .setTitle('🎮 Select Your Character')
    .setDescription(`<@${player1Id}>, choose your character by typing its name:\n\n${player1Chars.map(c => `${c.emoji} **${c.name}** (Lvl ${c.level}, ST: ${c.st}%)`).join('\n')}`);
  
  const p2SelectEmbed = new EmbedBuilder()
    .setColor('#E74C3C')
    .setTitle('🎮 Select Your Character')
    .setDescription(`<@${player2Id}>, choose your character by typing its name:\n\n${player2Chars.map(c => `${c.emoji} **${c.name}** (Lvl ${c.level}, ST: ${c.st}%)`).join('\n')}`);
  
  await channel.send({ embeds: [p1SelectEmbed] });
  await channel.send({ embeds: [p2SelectEmbed] });
  
  const filter = (m) => {
    return (m.author.id === player1Id || m.author.id === player2Id) && !m.content.startsWith('!');
  };
  
  const collector = channel.createMessageCollector({ filter, time: 120000 });
  
  collector.on('collect', async (m) => {
    const userId = m.author.id;
    const charName = m.content.toLowerCase().trim();
    
    const userChars = data.users[userId].characters;
    const selectedChar = userChars.find(c => c.name.toLowerCase() === charName);
    
    if (!selectedChar) {
      await m.reply('❌ You don\'t own that character! Try again.');
      return;
    }
    
    if (!selectedChar.moves || !selectedChar.baseHp) {
      await m.reply('❌ This character doesn\'t have moves assigned yet! Please contact an admin.');
      return;
    }
    
    if (userId === player1Id && !battle.player1Character) {
      battle.player1Character = selectedChar;
      battle.player1HP = selectedChar.baseHp;
      battle.player1MaxHP = selectedChar.baseHp;
      await m.reply(`✅ You selected **${selectedChar.name} ${selectedChar.emoji}**!`);
    } else if (userId === player2Id && !battle.player2Character) {
      battle.player2Character = selectedChar;
      battle.player2HP = selectedChar.baseHp;
      battle.player2MaxHP = selectedChar.baseHp;
      await m.reply(`✅ You selected **${selectedChar.name} ${selectedChar.emoji}**!`);
    }
    
    if (battle.player1Character && battle.player2Character) {
      collector.stop();
      await startBattle(battle, channel, data);
    }
  });
  
  collector.on('end', (collected, reason) => {
    if (reason === 'time' && (!battle.player1Character || !battle.player2Character)) {
      channel.send('⏱️ Character selection timed out! Battle cancelled.');
      activeBattles.delete(player1Id);
      activeBattles.delete(player2Id);
    }
  });
}

async function startBattle(battle, channel, data) {
  battle.started = true;
  battle.currentTurn = Math.random() < 0.5 ? battle.player1 : battle.player2;
  
  const battleStartEmbed = new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle('⚔️ BATTLE BEGINS!')
    .setDescription(`**${battle.player1Character.emoji} ${battle.player1Character.name}** vs **${battle.player2Character.emoji} ${battle.player2Character.name}**\n\n<@${battle.currentTurn}> goes first!`)
    .addFields(
      { name: `${battle.player1Character.emoji} ${battle.player1Character.name}`, value: `HP: ${battle.player1HP}/${battle.player1MaxHP}`, inline: true },
      { name: `${battle.player2Character.emoji} ${battle.player2Character.name}`, value: `HP: ${battle.player2HP}/${battle.player2MaxHP}`, inline: true }
    );
  
  await channel.send({ embeds: [battleStartEmbed] });
  
  battle.timeout = setTimeout(() => {
    if (activeBattles.has(battle.player1)) {
      endBattle(battle, channel, 'timeout');
    }
  }, 600000);
  
  await promptTurn(battle, channel, data);
}

async function promptTurn(battle, channel, data) {
  const currentPlayer = battle.currentTurn;
  const isPlayer1 = currentPlayer === battle.player1;
  const currentChar = isPlayer1 ? battle.player1Character : battle.player2Character;
  
  const moves = currentChar.moves;
  const allMoves = [moves.special, ...moves.tierMoves];
  
  const moveList = allMoves.map((move, index) => {
    const isSpecial = index === 0;
    const display = getMoveDisplay(move, currentChar.level, currentChar.st, isSpecial);
    return `**${index + 1}.** ${display}`;
  }).join('\n');
  
  const turnEmbed = new EmbedBuilder()
    .setColor('#FFA500')
    .setTitle(`⚡ <@${currentPlayer}>'s Turn!`)
    .setDescription(`**Your Character:** ${currentChar.emoji} ${currentChar.name}\n\n**Choose an action:**\nType the move number (1-3) or type **flight** to flee!\n\n${moveList}`)
    .addFields(
      { name: `${battle.player1Character.emoji} ${battle.player1Character.name}`, value: `HP: ${battle.player1HP}/${battle.player1MaxHP}`, inline: true },
      { name: `${battle.player2Character.emoji} ${battle.player2Character.name}`, value: `HP: ${battle.player2HP}/${battle.player2MaxHP}`, inline: true }
    );
  
  await channel.send({ embeds: [turnEmbed] });
  
  const filter = (m) => m.author.id === currentPlayer && !m.content.startsWith('!');
  
  const collector = channel.createMessageCollector({ filter, max: 1, time: 60000 });
  
  collector.on('collect', async (m) => {
    const action = m.content.toLowerCase().trim();
    
    if (action === 'flight' || action === 'flee' || action === 'run') {
      const winner = isPlayer1 ? battle.player2 : battle.player1;
      await m.reply(`💨 ${currentChar.emoji} ${currentChar.name} fled from battle!`);
      await endBattle(battle, channel, 'flee', winner);
      return;
    }
    
    const moveIndex = parseInt(action) - 1;
    
    if (isNaN(moveIndex) || moveIndex < 0 || moveIndex > 2) {
      await m.reply('❌ Invalid choice! Please type 1, 2, 3, or flight.');
      await promptTurn(battle, channel, data);
      return;
    }
    
    const selectedMove = allMoves[moveIndex];
    const isSpecial = moveIndex === 0;
    const damage = calculateDamage(selectedMove, currentChar.level, currentChar.st, isSpecial);
    
    const opponentPlayer = isPlayer1 ? battle.player2 : battle.player1;
    const opponentChar = isPlayer1 ? battle.player2Character : battle.player1Character;
    
    if (damage < 0) {
      const healAmount = Math.abs(damage);
      const currentHP = isPlayer1 ? battle.player1HP : battle.player2HP;
      const maxHP = isPlayer1 ? battle.player1MaxHP : battle.player2MaxHP;
      const actualHeal = Math.min(healAmount, maxHP - currentHP);
      
      if (isPlayer1) {
        battle.player1HP = Math.min(battle.player1HP + actualHeal, battle.player1MaxHP);
      } else {
        battle.player2HP = Math.min(battle.player2HP + actualHeal, battle.player2MaxHP);
      }
      
      const healEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('💚 Heal!')
        .setDescription(`${currentChar.emoji} **${currentChar.name}** used **${selectedMove.name}**!\n\nRestored ${actualHeal} HP!`)
        .addFields(
          { name: `${battle.player1Character.emoji} ${battle.player1Character.name}`, value: `HP: ${battle.player1HP}/${battle.player1MaxHP}`, inline: true },
          { name: `${battle.player2Character.emoji} ${battle.player2Character.name}`, value: `HP: ${battle.player2HP}/${battle.player2MaxHP}`, inline: true }
        );
      
      await channel.send({ embeds: [healEmbed] });
    } else if (damage === 0) {
      const buffEmbed = new EmbedBuilder()
        .setColor('#FFFF00')
        .setTitle('✨ Support Move!')
        .setDescription(`${currentChar.emoji} **${currentChar.name}** used **${selectedMove.name}**!`)
        .addFields(
          { name: `${battle.player1Character.emoji} ${battle.player1Character.name}`, value: `HP: ${battle.player1HP}/${battle.player1MaxHP}`, inline: true },
          { name: `${battle.player2Character.emoji} ${battle.player2Character.name}`, value: `HP: ${battle.player2HP}/${battle.player2MaxHP}`, inline: true }
        );
      
      await channel.send({ embeds: [buffEmbed] });
    } else {
      if (isPlayer1) {
        battle.player2HP = Math.max(0, battle.player2HP - damage);
      } else {
        battle.player1HP = Math.max(0, battle.player1HP - damage);
      }
      
      const attackEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('💥 Attack!')
        .setDescription(`${currentChar.emoji} **${currentChar.name}** used **${selectedMove.name}**!\n\nDealt ${damage} damage to ${opponentChar.emoji} **${opponentChar.name}**!`)
        .addFields(
          { name: `${battle.player1Character.emoji} ${battle.player1Character.name}`, value: `HP: ${battle.player1HP}/${battle.player1MaxHP}`, inline: true },
          { name: `${battle.player2Character.emoji} ${battle.player2Character.name}`, value: `HP: ${battle.player2HP}/${battle.player2MaxHP}`, inline: true }
        );
      
      await channel.send({ embeds: [attackEmbed] });
    }
    
    if (battle.player1HP <= 0 || battle.player2HP <= 0) {
      const winner = battle.player1HP > 0 ? battle.player1 : battle.player2;
      await endBattle(battle, channel, 'knockout', winner);
      return;
    }
    
    battle.currentTurn = opponentPlayer;
    
    setTimeout(() => {
      if (activeBattles.has(battle.player1)) {
        promptTurn(battle, channel, data);
      }
    }, 2000);
  });
  
  collector.on('end', (collected, reason) => {
    if (reason === 'time' && activeBattles.has(battle.player1)) {
      channel.send(`⏱️ <@${currentPlayer}> took too long! Battle ended.`);
      const winner = isPlayer1 ? battle.player2 : battle.player1;
      endBattle(battle, channel, 'timeout', winner);
    }
  });
}

async function endBattle(battle, channel, reason, winner = null) {
  clearTimeout(battle.timeout);
  activeBattles.delete(battle.player1);
  activeBattles.delete(battle.player2);
  
  if (reason === 'timeout') {
    const timeoutEmbed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('⏱️ Battle Timeout')
      .setDescription('The battle has ended due to inactivity.');
    
    await channel.send({ embeds: [timeoutEmbed] });
  } else if (reason === 'flee') {
    const fleeEmbed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🏆 Victory by Forfeit!')
      .setDescription(`<@${winner}> wins the battle!`);
    
    await channel.send({ embeds: [fleeEmbed] });
  } else if (reason === 'knockout') {
    const winnerChar = winner === battle.player1 ? battle.player1Character : battle.player2Character;
    const loserChar = winner === battle.player1 ? battle.player2Character : battle.player1Character;
    
    const victoryEmbed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🏆 VICTORY!')
      .setDescription(`${winnerChar.emoji} **${winnerChar.name}** defeated ${loserChar.emoji} **${loserChar.name}**!\n\n<@${winner}> wins the battle!`)
      .addFields(
        { name: `${battle.player1Character.emoji} ${battle.player1Character.name}`, value: `HP: ${battle.player1HP}/${battle.player1MaxHP}`, inline: true },
        { name: `${battle.player2Character.emoji} ${battle.player2Character.name}`, value: `HP: ${battle.player2HP}/${battle.player2MaxHP}`, inline: true }
      );
    
    await channel.send({ embeds: [victoryEmbed] });
  }
}

module.exports = {
  initiateBattle
};
