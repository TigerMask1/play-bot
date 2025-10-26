const fs = require('fs');
const path = require('path');
const { assignMovesToCharacter, calculateBaseHP } = require('./battleUtils.js');

const DATA_FILE = path.join(__dirname, 'data.json');
const USE_MONGODB = process.env.USE_MONGODB === 'true';

let mongoManager = null;
if (USE_MONGODB) {
  mongoManager = require('./mongoManager.js');
}

function generateST() {
  return parseFloat((Math.random() * 100).toFixed(2));
}

function backfillUserData(data) {
  let needsSave = false;
  
  Object.keys(data.users).forEach(userId => {
    const user = data.users[userId];
    
    if (user.pendingTokens === undefined) {
      user.pendingTokens = 0;
      needsSave = true;
    }
    
    if (user.shards === undefined) {
      user.shards = 0;
      needsSave = true;
    }
    
    if (user.stBoosters === undefined) {
      user.stBoosters = 0;
      needsSave = true;
    }
    
    if (user.trophies === undefined) {
      user.trophies = 200;
      needsSave = true;
    }
    
    if (user.messageCount === undefined) {
      user.messageCount = 0;
      needsSave = true;
    }
    
    if (user.lastDailyClaim === undefined) {
      user.lastDailyClaim = null;
      needsSave = true;
    }
    
    if (user.questProgress === undefined) {
      user.questProgress = {
        dropsCaught: 0,
        battlesWon: 0,
        cratesOpened: 0,
        tradesCompleted: 0,
        boostsUsed: 0,
        currentWinStreak: 0,
        maxWinStreak: 0,
        charsReleased: 0,
        tyrantCratesOpened: 0,
        totalBattles: 0,
        charsFromCrates: 0,
        highLevelWin: 0
      };
      needsSave = true;
    }
    
    if (user.completedQuests === undefined) {
      user.completedQuests = [];
      needsSave = true;
    }
    
    if (user.mailbox === undefined) {
      user.mailbox = [];
      needsSave = true;
    }
    
    if (user.characters && Array.isArray(user.characters)) {
      user.characters.forEach(char => {
        if (char.st === undefined) {
          char.st = generateST();
          needsSave = true;
        }
        
        if (!char.moves) {
          char.moves = assignMovesToCharacter(char.name, char.st);
          needsSave = true;
        }
        
        if (!char.baseHp) {
          char.baseHp = calculateBaseHP(char.st);
          needsSave = true;
        }
        
        if (!char.currentSkin) {
          char.currentSkin = 'default';
          needsSave = true;
        }
        
        if (!char.ownedSkins) {
          char.ownedSkins = ['default'];
          needsSave = true;
        }
      });
    }
  });
  
  if (!data.battleChannelId) {
    data.battleChannelId = data.battleChannel || null;
    delete data.battleChannel;
    needsSave = true;
  }
  
  if (!data.dropChannelId) {
    data.dropChannelId = data.dropChannel || null;
    delete data.dropChannel;
    needsSave = true;
  }
  
  delete data.currentDrop;
  
  return { data, needsSave };
}

async function loadData() {
  if (USE_MONGODB) {
    try {
      const data = await mongoManager.loadData();
      const { data: backfilledData, needsSave } = backfillUserData(data);
      
      if (needsSave) {
        await mongoManager.saveData(backfilledData);
        console.log('✅ Backfilled missing data in MongoDB: ST, moves, HP, pending tokens, shards, trophies, message tracking, daily rewards, quests, mailbox, and skins');
      }
      
      return backfilledData;
    } catch (error) {
      console.error('Error loading from MongoDB:', error);
      return {
        users: {},
        dropChannelId: null,
        battleChannelId: null
      };
    }
  } else {
    let data;
    
    try {
      if (fs.existsSync(DATA_FILE)) {
        const rawData = fs.readFileSync(DATA_FILE, 'utf8');
        data = JSON.parse(rawData);
      } else {
        data = {
          users: {},
          dropChannelId: null,
          battleChannelId: null
        };
      }
    } catch (error) {
      console.error('Error loading JSON data:', error);
      data = {
        users: {},
        dropChannelId: null,
        battleChannelId: null
      };
    }
    
    const { data: backfilledData, needsSave } = backfillUserData(data);
    
    if (needsSave) {
      saveData(backfilledData);
      console.log('✅ Backfilled missing data: ST, moves, HP, pending tokens, shards, trophies, message tracking, daily rewards, quests, mailbox, and skins');
    }
    
    return backfilledData;
  }
}

function saveData(data) {
  if (USE_MONGODB) {
    mongoManager.saveData(data).catch(error => {
      console.error('Error saving to MongoDB:', error);
    });
  } else {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving JSON data:', error);
    }
  }
}

module.exports = { loadData, saveData };
