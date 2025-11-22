const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const activeGames = new Map();

const DOOR_EMOJIS = ['🚪 Door 1️⃣', '🚪 Door 2️⃣', '🚪 Door 3️⃣'];
const BOMB_EMOJI = '💣';
const SAFE_EMOJI = '✅';

async function startDoorGame(message, challengerId, opponentId, isAI = false) {
  const gameId = `${message.guildId}-${Date.now()}`;
  
  const game = {
    gameId,
    serverId: message.guildId,
    challengerId,
    opponentId,
    isAI,
    bet: 100,
    bombDoor: null,
    selectedDoor: null,
    state: 'setup', // setup, waiting_for_choice, finished
    setupMessageId: null,
    setupChannelId: null,
    createdAt: Date.now()
  };
  
  activeGames.set(gameId, game);
  
  if (isAI) {
    // AI randomly picks bomb door
    game.bombDoor = Math.floor(Math.random() * 3);
    game.state = 'waiting_for_choice';
    return { success: true, gameId, game };
  }
  
  // Send setup request to opponent via DM
  try {
    const opponent = await message.client.users.fetch(opponentId);
    const setupEmbed = new EmbedBuilder()
      .setColor('#FF6B6B')
      .setTitle('🎮 Door Game Setup')
      .setDescription(`<@${challengerId}> has challenged you to a Door Game!\n\n**Bet:** 100 coins each\n**Prize:** 180 coins to winner (20 coins tax)\n\n**Your Task:** Click a button below to secretly place the bomb behind one of 3 doors.`)
      .setFooter({ text: `Game ID: ${gameId}` });
    
    const setupRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`door_setup_1_${gameId}`)
          .setLabel('🚪 Door 1')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`door_setup_2_${gameId}`)
          .setLabel('🚪 Door 2')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`door_setup_3_${gameId}`)
          .setLabel('🚪 Door 3')
          .setStyle(ButtonStyle.Primary)
      );
    
    const dmMessage = await opponent.send({ embeds: [setupEmbed], components: [setupRow] });
    game.setupMessageId = dmMessage.id;
    game.setupChannelId = dmMessage.channelId;
    
    return { success: true, gameId, game };
  } catch (error) {
    console.error('Error sending DM for door game setup:', error);
    activeGames.delete(gameId);
    return { success: false, error: 'Could not send DM to opponent. Make sure they have DMs enabled!' };
  }
}

async function handleSetupSelection(interaction, gameId, doorNumber) {
  const game = activeGames.get(gameId);
  if (!game) {
    await interaction.reply({ content: '❌ Game not found!', ephemeral: true });
    return;
  }
  
  if (game.state !== 'setup') {
    await interaction.reply({ content: '❌ Game setup already completed!', ephemeral: true });
    return;
  }
  
  if (interaction.user.id !== game.opponentId) {
    await interaction.reply({ content: '❌ You are not the opponent in this game!', ephemeral: true });
    return;
  }
  
  game.bombDoor = doorNumber - 1; // 0-indexed
  game.state = 'waiting_for_choice';
  
  await interaction.reply({ content: `✅ Bomb placed behind Door ${doorNumber}! The challenger will now choose.`, ephemeral: true });
}

async function presentChoiceToChallenger(message, gameId) {
  const game = activeGames.get(gameId);
  if (!game || game.state !== 'waiting_for_choice') {
    return { success: false, error: 'Game not ready' };
  }
  
  const choiceEmbed = new EmbedBuilder()
    .setColor('#4ECDC4')
    .setTitle('🎮 Door Game - Choose Your Door!')
    .setDescription(`<@${game.opponentId}> has set up the bomb!\n\n**Choose carefully:**`)
    .addFields(
      { name: '🚪 Door 1', value: 'Could have the bomb...', inline: true },
      { name: '🚪 Door 2', value: 'Could have the bomb...', inline: true },
      { name: '🚪 Door 3', value: 'Could have the bomb...', inline: true }
    )
    .setFooter({ text: `Game ID: ${gameId}` });
  
  const choiceRow = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`door_choice_1_${gameId}`)
        .setLabel('🚪 Door 1')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`door_choice_2_${gameId}`)
        .setLabel('🚪 Door 2')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`door_choice_3_${gameId}`)
        .setLabel('🚪 Door 3')
        .setStyle(ButtonStyle.Success)
    );
  
  try {
    const choiceMessage = await message.reply({ embeds: [choiceEmbed], components: [choiceRow] });
    game.choiceMessageId = choiceMessage.id;
    return { success: true };
  } catch (error) {
    console.error('Error presenting choice:', error);
    return { success: false, error };
  }
}

async function handleDoorChoice(interaction, gameId, doorNumber) {
  const game = activeGames.get(gameId);
  if (!game) {
    await interaction.reply({ content: '❌ Game not found!', ephemeral: true });
    return;
  }
  
  if (game.state !== 'waiting_for_choice') {
    await interaction.reply({ content: '❌ Game already finished!', ephemeral: true });
    return;
  }
  
  if (interaction.user.id !== game.challengerId) {
    await interaction.reply({ content: '❌ You are not the challenger in this game!', ephemeral: true });
    return;
  }
  
  game.selectedDoor = doorNumber - 1; // 0-indexed
  game.state = 'finished';
  
  const isWin = game.selectedDoor !== game.bombDoor;
  
  const resultEmbed = new EmbedBuilder()
    .setColor(isWin ? '#95E1D3' : '#FF6B6B')
    .setTitle(isWin ? '🎉 YOU WIN!' : '💣 YOU LOSE!')
    .setDescription(isWin 
      ? `You chose Door ${doorNumber + 1} and it was safe!` 
      : `You chose Door ${doorNumber + 1} and it had the bomb!`)
    .addFields(
      { name: `Bomb Location`, value: `Door ${game.bombDoor + 1}`, inline: true },
      { name: `Your Choice`, value: `Door ${doorNumber + 1}`, inline: true },
      { name: `Result`, value: isWin ? '✅ Safe' : '💣 Bomb', inline: true }
    );
  
  if (isWin) {
    resultEmbed.addFields(
      { name: 'Prize', value: `💰 +180 coins (100 bet + 80 win + 20 tax)` }
    );
  }
  
  await interaction.reply({ embeds: [resultEmbed] });
  
  return { success: true, isWin, gameId };
}

function getActiveGame(gameId) {
  return activeGames.get(gameId);
}

function deleteGame(gameId) {
  activeGames.delete(gameId);
}

module.exports = {
  startDoorGame,
  handleSetupSelection,
  presentChoiceToChallenger,
  handleDoorChoice,
  getActiveGame,
  deleteGame,
  activeGames
};
