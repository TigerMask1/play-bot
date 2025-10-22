const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');

function generateST() {
  return parseFloat((Math.random() * 100).toFixed(2));
}

function loadData() {
  let needsSave = false;
  let data;
  
  try {
    if (fs.existsSync(DATA_FILE)) {
      const rawData = fs.readFileSync(DATA_FILE, 'utf8');
      data = JSON.parse(rawData);
    } else {
      data = {
        users: {},
        dropChannel: null,
        currentDrop: null
      };
    }
  } catch (error) {
    console.error('Error loading data:', error);
    data = {
      users: {},
      dropChannel: null,
      currentDrop: null
    };
  }
  
  Object.keys(data.users).forEach(userId => {
    const user = data.users[userId];
    
    if (user.pendingTokens === undefined) {
      user.pendingTokens = 0;
      needsSave = true;
    }
    
    if (user.characters && Array.isArray(user.characters)) {
      user.characters.forEach(char => {
        if (char.st === undefined) {
          char.st = generateST();
          needsSave = true;
        }
      });
    }
  });
  
  if (needsSave) {
    saveData(data);
    console.log('✅ Backfilled missing ST values and pending tokens');
  }
  
  return data;
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

module.exports = { loadData, saveData };
