const { EmbedBuilder } = require('discord.js');
const { saveData } = require('./dataManager.js');
const CHARACTERS = require('./characters.js');

let dropInterval = null;
let activeClient = null;
let activeData = null;

const DROP_CODES = ['tyrant', 'zooba', 'zoo', 'catch', 'grab', 'quick', 'fast', 'win', 'get', 'take'];

function startDropSystem(client, data) {
  if (dropInterval) {
    stopDropSystem();
  }
  
  activeClient = client;
  activeData = data;
  
  dropInterval = setInterval(() => {
    executeDrop();
  }, 20000);
  
  console.log('✅ Drop system started!');
}

function stopDropSystem() {
  if (dropInterval) {
    clearInterval(dropInterval);
    dropInterval = null;
    console.log('⏹️ Drop system stopped!');
  }
}

async function executeDrop() {
  if (!activeData.dropChannel || !activeClient) {
    return;
  }
  
  try {
    const channel = await activeClient.channels.fetch(activeData.dropChannel);
    
    if (!channel) {
      console.error('Drop channel not found!');
      return;
    }
    
    if (activeData.currentDrop) {
      const oldDrop = activeData.currentDrop;
      activeData.currentDrop = null;
      
      let oldRewardText = '';
      if (oldDrop.type === 'tokens') {
        oldRewardText = `${oldDrop.amount} ${oldDrop.characterName} tokens`;
      } else {
        oldRewardText = `${oldDrop.amount} ${oldDrop.type}`;
      }
      
      const vanishEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('💨 Drop Vanished!')
        .setDescription(`The previous drop (${oldRewardText}) disappeared!`);
      
      await channel.send({ embeds: [vanishEmbed] });
    }
    
    const dropTypeRoll = Math.random();
    let selectedDrop;
    let characterName = '';
    
    if (dropTypeRoll < 0.6) {
      const allOwnedChars = new Set();
      Object.values(activeData.users).forEach(user => {
        if (user.characters) {
          user.characters.forEach(char => allOwnedChars.add(char.name));
        }
      });
      
      const ownedCharArray = Array.from(allOwnedChars);
      
      if (ownedCharArray.length > 0) {
        characterName = ownedCharArray[Math.floor(Math.random() * ownedCharArray.length)];
        selectedDrop = { type: 'tokens', min: 1, max: 10, emoji: '🎫', characterName: characterName };
      } else {
        selectedDrop = { type: 'coins', min: 1, max: 10, emoji: '💰' };
      }
    } else if (dropTypeRoll < 0.9) {
      selectedDrop = { type: 'coins', min: 1, max: 10, emoji: '💰' };
    } else {
      selectedDrop = { type: 'gems', min: 1, max: 2, emoji: '💎' };
    }
    
    const amount = Math.floor(Math.random() * (selectedDrop.max - selectedDrop.min + 1)) + selectedDrop.min;
    const code = DROP_CODES[Math.floor(Math.random() * DROP_CODES.length)];
    
    activeData.currentDrop = {
      type: selectedDrop.type,
      amount: amount,
      code: code,
      characterName: characterName
    };
    
    saveData(activeData);
    
    let rewardText = '';
    if (selectedDrop.type === 'tokens') {
      rewardText = `**Reward:** ${amount} ${characterName} tokens ${selectedDrop.emoji}`;
    } else {
      rewardText = `**Reward:** ${amount} ${selectedDrop.type} ${selectedDrop.emoji}`;
    }
    
    const dropEmbed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🎁 DROP APPEARED!')
      .setDescription(`A wild drop appeared!\n\n${rewardText}\n\nType \`!c ${code}\` to catch it!`)
      .setFooter({ text: 'First person to type the command gets it!' })
      .setTimestamp();
    
    await channel.send({ embeds: [dropEmbed] });
    
  } catch (error) {
    console.error('Drop execution error:', error);
  }
}

module.exports = { startDropSystem, stopDropSystem };
