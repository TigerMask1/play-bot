const CHARACTERS = require('./characters.js');
const { assignMovesToCharacter, calculateBaseHP } = require('./battleUtils.js');
const eventSystem = require('./eventSystem.js');

const CRATE_TYPES = {
  gold: {
    cost: 100,
    charChance: 1.5,
    tokens: 50,
    coins: 500
  },
  emerald: {
    cost: 250,
    charChance: 5,
    tokens: 130,
    coins: 1800
  },
  legendary: {
    cost: 500,
    charChance: 10,
    tokens: 200,
    coins: 2500
  },
  tyrant: {
    cost: 750,
    charChance: 15,
    tokens: 300,
    coins: 3500
  }
};

function generateST() {
  return parseFloat((Math.random() * 100).toFixed(2));
}

async function openCrate(data, userId, crateType) {
  const crate = CRATE_TYPES[crateType];
  const user = data.users[userId];
  
  if (user.gems < crate.cost) {
    return {
      success: false,
      message: `Not enough gems! You need ${crate.cost} gems but have ${user.gems}.`
    };
  }
  
  user.gems -= crate.cost;
  user.coins += crate.coins;
  
  await eventSystem.recordProgress(userId, user.username, 1, 'crate_master');
  
  let rewards = `💰 ${crate.coins} coins`;
  
  if (!user.pendingTokens) {
    user.pendingTokens = 0;
  }
  
  if (user.characters.length > 0) {
    const randomOwnedChar = user.characters[Math.floor(Math.random() * user.characters.length)];
    randomOwnedChar.tokens += crate.tokens;
    
    if (user.pendingTokens > 0) {
      randomOwnedChar.tokens += user.pendingTokens;
      rewards += `\n🎫 ${crate.tokens + user.pendingTokens} ${randomOwnedChar.name} tokens (including ${user.pendingTokens} pending!)`;
      user.pendingTokens = 0;
    } else {
      rewards += `\n🎫 ${crate.tokens} ${randomOwnedChar.name} tokens`;
    }
  } else {
    user.pendingTokens += crate.tokens;
    rewards += `\n🎫 ${crate.tokens} tokens saved (Total pending: ${user.pendingTokens})`;
  }
  
  const roll = Math.random() * 100;
  
  if (roll < crate.charChance) {
    const crateChars = CHARACTERS.filter(c => c.obtainable === 'crate');
    const ownedCharNames = user.characters.map(c => c.name);
    const availableChars = crateChars.filter(c => !ownedCharNames.includes(c.name));
    
    if (availableChars.length > 0) {
      const randomChar = availableChars[Math.floor(Math.random() * availableChars.length)];
      const newST = generateST();
      
      let startingTokens = 0;
      if (user.characters.length === 0 && user.pendingTokens > 0) {
        startingTokens = user.pendingTokens;
        user.pendingTokens = 0;
      }
      
      const newMoves = assignMovesToCharacter(randomChar.name, newST);
      const newHP = calculateBaseHP(newST);
      
      user.characters.push({
        name: randomChar.name,
        emoji: randomChar.emoji,
        level: 1,
        tokens: startingTokens,
        st: newST,
        moves: newMoves,
        baseHp: newHP,
        currentSkin: 'default',
        ownedSkins: ['default']
      });
      
      rewards += `\n\n🎉 **NEW CHARACTER!** ${randomChar.emoji} ${randomChar.name}\n**ST:** ${newST}%`;
      if (startingTokens > 0) {
        rewards += `\n🎁 Received ${startingTokens} pending tokens!`;
      }
    } else {
      user.gems += 50;
      rewards += `\n\n✨ Bonus: 50 gems (all characters owned!)`;
    }
  }
  
  return {
    success: true,
    message: rewards
  };
}

module.exports = { openCrate, CRATE_TYPES };
