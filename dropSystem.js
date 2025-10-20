const { EmbedBuilder } = require('discord.js');
const { saveData } = require('./dataManager.js');

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
      
      const vanishEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('💨 Drop Vanished!')
        .setDescription(`The previous drop (${oldDrop.amount} ${oldDrop.type}) disappeared!`);
      
      await channel.send({ embeds: [vanishEmbed] });
    }
    
    const dropTypes = [
      { type: 'tokens', min: 1, max: 10, emoji: '🎫' },
      { type: 'coins', min: 10, max: 100, emoji: '💰' },
      { type: 'gems', min: 1, max: 2, emoji: '💎' }
    ];
    
    const selectedDrop = dropTypes[Math.floor(Math.random() * dropTypes.length)];
    const amount = Math.floor(Math.random() * (selectedDrop.max - selectedDrop.min + 1)) + selectedDrop.min;
    const code = DROP_CODES[Math.floor(Math.random() * DROP_CODES.length)];
    
    activeData.currentDrop = {
      type: selectedDrop.type,
      amount: amount,
      code: code
    };
    
    saveData(activeData);
    
    const dropEmbed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🎁 DROP APPEARED!')
      .setDescription(`A wild drop appeared!\n\n**Reward:** ${amount} ${selectedDrop.emoji} ${selectedDrop.type}\n\nType \`!c ${code}\` to catch it!`)
      .setFooter({ text: 'First person to type the command gets it!' })
      .setTimestamp();
    
    await channel.send({ embeds: [dropEmbed] });
    
  } catch (error) {
    console.error('Drop execution error:', error);
  }
}

module.exports = { startDropSystem, stopDropSystem };
