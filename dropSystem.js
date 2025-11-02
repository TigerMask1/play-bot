const { EmbedBuilder } = require('discord.js');
const { saveData } = require('./dataManager.js');
const CHARACTERS = require('./characters.js');

let dropInterval = null;
let activeClient = null;
let activeData = null;

// Default drop channel ID (used if none set)
const DEFAULT_DROP_CHANNEL = '1430525383635107850';

const DROP_CODES = ['tyrant', 'zooba', 'zoo', 'catch', 'grab', 'quick', 'fast', 'win', 'get', 'take'];

// ======================================================
//  START / STOP SYSTEM
// ======================================================

function startDropSystem(client, data) {
  // Clear existing interval if running
  if (dropInterval) stopDropSystem();

  activeClient = client;
  activeData = data;

  // If no drop channel is defined, use the default
   
    activeData.dropChannel = DEFAULT_DROP_CHANNEL;
    saveData(activeData);
  

  // Create an interval for executing drops
  dropInterval = setInterval(() => {
    executeDrop();
  }, 20000); // 20 seconds

  console.log(`✅ Drop system started! Channel: ${activeData.dropChannel}`);
}

function stopDropSystem() {
  if (dropInterval) {
    clearInterval(dropInterval);
    dropInterval = null;
    console.log('⏹️ Drop system stopped!');
  }
}

// ======================================================
//  CORE DROP LOGIC
// ======================================================

async function executeDrop() {
  if (!activeData?.dropChannel || !activeClient) return;

  try {
    const channel = await activeClient.channels.fetch(activeData.dropChannel).catch(() => null);
    if (!channel) {
      console.error('❌ Drop channel not found!');
      return;
    }

    // ===== PHASE 1: Handle previous drop =====
    if (activeData.currentDrop) {
      const oldDrop = activeData.currentDrop;
      activeData.currentDrop = null;

      // Try deleting old drop message
      if (oldDrop.messageId) {
        try {
          const oldMessage = await channel.messages.fetch(oldDrop.messageId);
          if (oldMessage) await oldMessage.delete();
        } catch {
          console.warn(`⚠️ Old drop message already deleted.`);
        }
      }

      // Send vanished notice
      const oldReward = oldDrop.type === 'tokens'
        ? `${oldDrop.amount} ${oldDrop.characterName} tokens`
        : `${oldDrop.amount} ${oldDrop.type}`;

      const vanishEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('💨 Drop Vanished!')
        .setDescription(`The previous drop (${oldReward}) disappeared!`);

      const vanishMsg = await channel.send({ embeds: [vanishEmbed] });
      setTimeout(() => vanishMsg.delete().catch(() => {}), 5000);
    }

    // ===== PHASE 2: Create a new drop =====
    const dropTypeRoll = Math.random();
    let selectedDrop, characterName = '';

    if (dropTypeRoll < 0.02) {
      selectedDrop = { type: 'shards', min: 1, max: 2, emoji: '🔷' };
    } else if (dropTypeRoll < 0.62) {
      const allOwnedChars = new Set();
      Object.values(activeData.users).forEach(user => {
        user?.characters?.forEach(char => allOwnedChars.add(char.name));
      });

      const ownedCharArray = Array.from(allOwnedChars);
      if (ownedCharArray.length > 0) {
        characterName = ownedCharArray[Math.floor(Math.random() * ownedCharArray.length)];
        selectedDrop = { type: 'tokens', min: 1, max: 10, emoji: '🎫', characterName };
      } else {
        selectedDrop = { type: 'coins', min: 1, max: 10, emoji: '💰' };
      }
    } else if (dropTypeRoll < 0.92) {
      selectedDrop = { type: 'coins', min: 1, max: 10, emoji: '💰' };
    } else {
      selectedDrop = { type: 'gems', min: 1, max: 2, emoji: '💎' };
    }

    const amount = Math.floor(Math.random() * (selectedDrop.max - selectedDrop.min + 1)) + selectedDrop.min;
    const code = DROP_CODES[Math.floor(Math.random() * DROP_CODES.length)];

    const rewardText = selectedDrop.type === 'tokens'
      ? `**Reward:** ${amount} ${characterName} tokens ${selectedDrop.emoji}`
      : `**Reward:** ${amount} ${selectedDrop.type} ${selectedDrop.emoji}`;

    const dropEmbed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🎁 DROP APPEARED!')
      .setDescription(`A wild drop appeared!\n\n${rewardText}\n\nType \`!c ${code}\` to catch it!`)
      .setFooter({ text: 'First person to type the command gets it!' })
      .setTimestamp();

    const dropMessage = await channel.send({ embeds: [dropEmbed] });

    // Store new drop data
    activeData.currentDrop = {
      type: selectedDrop.type,
      amount,
      code,
      characterName,
      messageId: dropMessage.id
    };

    saveData(activeData);

  } catch (error) {
    console.error('❌ Drop execution error:', error);
  }
}

// ======================================================
//  COMMAND HANDLERS (for your main bot file)
// ======================================================

async function handleDropCommands(message, args, client, data) {
  const command = args[0]?.toLowerCase();

  switch (command) {
    case 'setdrop': {
      if (!message.member.permissions.has('Administrator')) {
        return message.reply('❌ Only admins can set the drop channel!');
      }

      activeData.dropChannel = message.channel.id;
      saveData(activeData);
      message.reply(`✅ Drop channel set to <#${message.channel.id}>`);
      break;
    }

    case 'startdrops': {
      if (!dropInterval) {
        startDropSystem(client, data);
        message.reply('✅ Drop system started!');
      } else {
        message.reply('⚠️ Drop system is already running.');
      }
      break;
    }

    case 'stopdrops': {
      stopDropSystem();
      message.reply('⏹️ Drop system stopped.');
      break;
    }

    default:
      message.reply('Usage: `!drops setdrop | startdrops | stopdrops`');
  }
}

module.exports = { 
  startDropSystem, 
  stopDropSystem, 
  handleDropCommands 
};
