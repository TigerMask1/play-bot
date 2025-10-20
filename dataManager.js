const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const rawData = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(rawData);
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
  
  return {
    users: {},
    dropChannel: null,
    currentDrop: null
  };
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

module.exports = { loadData, saveData };
