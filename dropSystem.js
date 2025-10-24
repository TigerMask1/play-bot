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
  }, 20000); // Your original 20-second interval
  
  console.log('✅ Drop system started!');
}

function stopDropSystem() {
  if (dropInterval) {
    clearInterval(dropInterval);
    dropInterval = null;
    console.log('⏹️ Drop system stopped!');
  }
}

/**
 * This function is now modified to:
 * 1. Delete the previous drop message (if one exists).
 * 2. Send a "vanished" message that self-deletes after 5 seconds.
 * 3. Send the new drop message and store its ID for the next cycle.
 */
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
    
    // --- Phase 1: Handle the *previous* drop ---
    if (activeData.currentDrop) {
      const oldDrop = activeData.currentDrop;
      activeData.currentDrop = null; // Clear it immediately
      
      // --- MODIFICATION 1: Delete the old drop message by its stored ID ---
      if (oldDrop.messageId) {
        try {
          // Fetch the old message and delete it
          const oldMessage = await channel.messages.fetch(oldDrop.messageId);
          if (oldMessage) {
            await oldMessage.delete();
          }
        } catch (deleteError) {
          // This is fine, the message might have been manually deleted.
          console.warn(`Could not delete old drop message (ID: ${oldDrop.messageId}): ${deleteError.message}`);
        }
      }
      
      // Create the text for the "vanished" embed
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
        
      // --- MODIFICATION 2: Send the 'vanished' message and make it self-destruct ---
      const vanishMsg = await channel.send({ embeds: [vanishEmbed] });
      setTimeout(() => {
        // Delete the "vanished" message after 5 seconds to reduce clutter
        vanishMsg.delete().catch(e => console.warn(`Could not delete vanish message: ${e.message}`));
      }, 5000); 
    }
    
    // --- Phase 2: Create the *new* drop ---
    
    const dropTypeRoll = Math.random();
    let selectedDrop;
    let characterName = '';
    
    if (dropTypeRoll < 0.02) {
      // 2% chance for shards
      selectedDrop = { type: 'shards', min: 1, max: 2, emoji: '🔷' };
    } else if (dropTypeRoll < 0.62) {
      // 60% chance for tokens (if characters exist)
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
        // Fallback to coins if no one has any characters yet
        selectedDrop = { type: 'coins', min: 1, max: 10, emoji: '💰' };
      }
    } else if (dropTypeRoll < 0.92) {
      // 30% chance for coins
      selectedDrop = { type: 'coins', min: 1, max: 10, emoji: '💰' };
    } else {
      // 8% chance for gems
      selectedDrop = { type: 'gems', min: 1, max: 2, emoji: '💎' };
    }
    
    const amount = Math.floor(Math.random() * (selectedDrop.max - selectedDrop.min + 1)) + selectedDrop.min;
    const code = DROP_CODES[Math.floor(Math.random() * DROP_CODES.length)];
    
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
    
    // --- MODIFICATION 3: Send the new drop message and store its ID ---
    const dropMessage = await channel.send({ embeds: [dropEmbed] });
    
    // Store all info about the *new* drop, including its message ID
    activeData.currentDrop = {
      type: selectedDrop.type,
      amount: amount,
      code: code,
      characterName: characterName,
      messageId: dropMessage.id // <-- This is the important part
    };
    
    saveData(activeData);
    
  } catch (error) {
    console.error('Drop execution error:', error);
  }
}

module.exports = { startDropSystem, stopDropSystem };