const CHARACTERS = require('./characters.js');

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

function openCrate(data, userId, crateType) {
  const crate = CRATE_TYPES[crateType];
  const user = data.users[userId];
  
  if (user.gems < crate.cost) {
    return {
      success: false,
      message: `Not enough gems! You need ${crate.cost} gems but have ${user.gems}.`
    };
  }
  
  user.gems -= crate.cost;
  user.tokens += crate.tokens;
  user.coins += crate.coins;
  
  let rewards = `🎫 ${crate.tokens} tokens\n💰 ${crate.coins} coins`;
  
  const roll = Math.random() * 100;
  
  if (roll < crate.charChance) {
    const crateChars = CHARACTERS.filter(c => c.obtainable === 'crate');
    const ownedCharNames = user.characters.map(c => c.name);
    const availableChars = crateChars.filter(c => !ownedCharNames.includes(c.name));
    
    if (availableChars.length > 0) {
      const randomChar = availableChars[Math.floor(Math.random() * availableChars.length)];
      user.characters.push({
        name: randomChar.name,
        emoji: randomChar.emoji,
        level: 1,
        tokens: 0
      });
      
      rewards += `\n\n🎉 **NEW CHARACTER!** ${randomChar.emoji} ${randomChar.name}`;
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
