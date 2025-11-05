const CHARACTERS = require('./characters.js');
const { assignMovesToCharacter, calculateBaseHP } = require('./battleUtils.js');
const eventSystem = require('./eventSystem.js');

const CRATE_TYPES = {
  bronze: {
    cost: 0,
    charChance: 0.02,
    tokens: 15,
    coins: 100,
    points: 1,
    emoji: '🟫'
  },
  silver: {
    cost: 0,
    charChance: 1,
    tokens: 30,
    coins: 250,
    points: 2,
    emoji: '⚪'
  },
  gold: {
    cost: 100,
    charChance: 1.5,
    tokens: 50,
    coins: 500,
    points: 3,
    emoji: '🟡'
  },
  emerald: {
    cost: 250,
    charChance: 5,
    tokens: 130,
    coins: 1800,
    points: 5,
    emoji: '🟢'
  },
  legendary: {
    cost: 500,
    charChance: 10,
    tokens: 200,
    coins: 2500,
    points: 8,
    emoji: '🟣'
  },
  tyrant: {
    cost: 750,
    charChance: 15,
    tokens: 300,
    coins: 3500,
    points: 12,
    emoji: '🔴'
  }
};

function generateST() {
  return parseFloat((Math.random() * 100).toFixed(2));
}

async function buyCrate(data, userId, crateType) {
  const crate = CRATE_TYPES[crateType];
  const user = data.users[userId];
  
  if (!crate) {
    return {
      success: false,
      message: `Invalid crate type! Available: gold, emerald, legendary, tyrant`
    };
  }
  
  if (crate.cost === 0) {
    return {
      success: false,
      message: `You can't buy ${crateType} crates! They are earned through message rewards.`
    };
  }
  
  if (user.gems < crate.cost) {
    return {
      success: false,
      message: `Not enough gems! You need ${crate.cost} gems but have ${user.gems}.`
    };
  }
  
  user.gems -= crate.cost;
  
  const crateKey = `${crateType}Crates`;
  if (!user[crateKey]) {
    user[crateKey] = 0;
  }
  user[crateKey] += 1;
  
  return {
    success: true,
    message: `Successfully purchased 1 ${crate.emoji} ${crateType} crate for ${crate.cost} gems!\nUse \`!opencrate ${crateType}\` to open it.`
  };
}

async function openCrate(data, userId, crateType) {
  const crate = CRATE_TYPES[crateType];
  const user = data.users[userId];
  
  if (!crate) {
    return {
      success: false,
      message: `Invalid crate type! Available: bronze, silver, gold, emerald, legendary, tyrant`
    };
  }
  
  const crateKey = `${crateType}Crates`;
  const userCrates = user[crateKey] || 0;
  
  if (userCrates < 1) {
    return {
      success: false,
      message: `You don't have any ${crateType} crates! ${crate.cost > 0 ? `Use \`!crate ${crateType}\` to buy one for ${crate.cost} gems.` : 'Earn them through message rewards!'}`
    };
  }
  
  user[crateKey] = userCrates - 1;
  
  user.coins += crate.coins;
  
  if (!user.questProgress) user.questProgress = {};
  user.questProgress.cratesOpened = (user.questProgress.cratesOpened || 0) + 1;
  
  if (crateType === 'tyrant') {
    user.questProgress.tyrantCratesOpened = (user.questProgress.tyrantCratesOpened || 0) + 1;
  }
  
  await eventSystem.recordProgress(userId, user.username, crate.points, 'crate_master');
  
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
      
      user.questProgress.charsFromCrates = (user.questProgress.charsFromCrates || 0) + 1;
      
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

module.exports = { openCrate, buyCrate, CRATE_TYPES };
