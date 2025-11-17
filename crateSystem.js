const CHARACTERS = require('./characters.js');
const { assignMovesToCharacter, calculateBaseHP } = require('./battleUtils.js');
const eventSystem = require('./eventSystem.js');
const { checkTaskProgress, completePersonalizedTask, initializePersonalizedTaskData } = require('./personalizedTaskSystem.js');
const { getEmojiForCharacter } = require('./emojiAssetManager.js');

const USE_MONGODB = process.env.USE_MONGODB === 'true';
let mongoManager = null;
if (USE_MONGODB) {
  mongoManager = require('./mongoManager.js');
}

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
    emoji: '<:emoji_2:1439429824862093445>'
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

module.exports.CRATE_TYPES = CRATE_TYPES;

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

async function openCrate(data, userId, crateType, client = null) {
  const crate = CRATE_TYPES[crateType];
  let user = data.users[userId];
  
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
  
  const rewards = {
    coins: crate.coins,
    questProgress: {
      cratesOpened: 1
    }
  };
  
  if (crateType === 'tyrant') {
    rewards.questProgress.tyrantCratesOpened = 1;
  }
  
  if (!user.pendingTokens) {
    user.pendingTokens = 0;
  }
  
  let characterTokenUpdate = null;
  let pendingTokensToApply = user.pendingTokens;
  
  if (user.characters.length > 0) {
    const randomCharIndex = Math.floor(Math.random() * user.characters.length);
    const tokensToAdd = crate.tokens + pendingTokensToApply;
    characterTokenUpdate = {
      index: randomCharIndex,
      tokens: tokensToAdd,
      characterName: user.characters[randomCharIndex].name
    };
    pendingTokensToApply = 0;
  } else {
    pendingTokensToApply += crate.tokens;
  }
  
  rewards.pendingTokens = pendingTokensToApply;
  if (characterTokenUpdate) {
    rewards.characterTokenUpdate = characterTokenUpdate;
  }
  
  const roll = Math.random() * 100;
  let newCharacter = null;
  
  if (roll < crate.charChance) {
    const crateChars = CHARACTERS.filter(c => c.obtainable === 'crate');
    const ownedCharNames = user.characters.map(c => c.name);
    const availableChars = crateChars.filter(c => !ownedCharNames.includes(c.name));
    
    if (availableChars.length > 0) {
      const randomChar = availableChars[Math.floor(Math.random() * availableChars.length)];
      const newST = generateST();
      
      let startingTokens = 0;
      if (user.characters.length === 0 && pendingTokensToApply > 0) {
        startingTokens = pendingTokensToApply;
        rewards.pendingTokens = 0;
      }
      
      const newMoves = assignMovesToCharacter(randomChar.name, newST);
      const newHP = calculateBaseHP(newST);
      
      newCharacter = {
        name: randomChar.name,
        emoji: getEmojiForCharacter(randomChar.name),
        level: 1,
        tokens: startingTokens,
        st: newST,
        moves: newMoves,
        baseHp: newHP,
        currentSkin: 'default',
        ownedSkins: ['default']
      };
      
      rewards.newCharacter = newCharacter;
      rewards.questProgress.charsFromCrates = 1;
    } else {
      rewards.gems = 50;
    }
  }
  
  if (USE_MONGODB && mongoManager) {
    const atomicResult = await mongoManager.openCrateAtomic(userId, crateType, rewards);
    
    if (!atomicResult.success) {
      return {
        success: false,
        message: `You don't have any ${crateType} crates to open!`
      };
    }
    
    data.users[userId] = atomicResult.userData;
    user = data.users[userId];
  } else {
    user[crateKey] = userCrates - 1;
    user.coins += rewards.coins;
    
    if (!user.questProgress) user.questProgress = {};
    user.questProgress.cratesOpened = (user.questProgress.cratesOpened || 0) + 1;
    if (crateType === 'tyrant') {
      user.questProgress.tyrantCratesOpened = (user.questProgress.tyrantCratesOpened || 0) + 1;
    }
    if (newCharacter) {
      user.characters.push(newCharacter);
      user.questProgress.charsFromCrates = (user.questProgress.charsFromCrates || 0) + 1;
    }
    
    user.pendingTokens = rewards.pendingTokens;
    
    if (characterTokenUpdate) {
      user.characters[characterTokenUpdate.index].tokens += characterTokenUpdate.tokens;
    }
    
    if (rewards.gems) {
      user.gems += rewards.gems;
    }
    
    user.lastActivity = Date.now();
  }
  
  if (client) {
    const ptData = initializePersonalizedTaskData(user);
    if (ptData.taskProgress.cratesOpened !== undefined) {
      const completedTask = checkTaskProgress(user, 'cratesOpened', 1);
      if (completedTask) {
        await completePersonalizedTask(client, userId, data, completedTask);
      }
    }
  }
  
  await eventSystem.recordProgress(userId, user.username, crate.points, 'crate_master');
  
  let rewardMessage = `💰 ${crate.coins} coins`;
  
  if (characterTokenUpdate) {
    const totalTokens = characterTokenUpdate.tokens;
    const baseTokens = crate.tokens;
    const hadPending = totalTokens > baseTokens;
    
    if (hadPending) {
      rewardMessage += `\n🎫 ${totalTokens} ${characterTokenUpdate.characterName} tokens (including ${totalTokens - baseTokens} pending!)`;
    } else {
      rewardMessage += `\n🎫 ${totalTokens} ${characterTokenUpdate.characterName} tokens`;
    }
  } else if (!newCharacter || newCharacter.tokens === 0) {
    rewardMessage += `\n🎫 ${crate.tokens} tokens saved (Total pending: ${rewards.pendingTokens})`;
  }
  
  if (newCharacter) {
    rewardMessage += `\n\n🎉 **NEW CHARACTER!** ${newCharacter.emoji} ${newCharacter.name}\n**ST:** ${newCharacter.st}%`;
    if (newCharacter.tokens > 0) {
      rewardMessage += `\n🎁 Received ${newCharacter.tokens} pending tokens!`;
    }
  } else if (rewards.gems) {
    rewardMessage += `\n\n✨ Bonus: ${rewards.gems} gems (all characters owned!)`;
  }
  
  return {
    success: true,
    message: rewardMessage
  };
}

module.exports = { openCrate, buyCrate, CRATE_TYPES };
