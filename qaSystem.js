const { saveDataImmediate } = require('./dataManager.js');
const { EmbedBuilder } = require('discord.js');

function initializeQAData(data) {
  if (!data.globalQA) {
    data.globalQA = [];
  }
  return data.globalQA;
}

async function getQAEntry(data, keyword) {
  initializeQAData(data);
  return data.globalQA.find(qa => qa.keyword.toLowerCase() === keyword.toLowerCase());
}

async function getAllQA(data) {
  initializeQAData(data);
  return data.globalQA;
}

async function addQAEntry(data, keyword, message) {
  initializeQAData(data);
  
  if (!keyword || !message) {
    return { success: false, message: '❌ Keyword and message are required!' };
  }
  
  const existing = await getQAEntry(data, keyword);
  if (existing) {
    return { success: false, message: `❌ Q&A entry for **${keyword}** already exists!` };
  }
  
  data.globalQA.push({
    keyword: keyword.toLowerCase(),
    message,
    createdAt: Date.now()
  });
  
  await saveDataImmediate(data);
  return { success: true, message: `✅ Added Q&A entry for **${keyword}**!` };
}

async function editQAEntry(data, keyword, newMessage) {
  initializeQAData(data);
  
  const entry = await getQAEntry(data, keyword);
  if (!entry) {
    return { success: false, message: `❌ Q&A entry for **${keyword}** not found!` };
  }
  
  entry.message = newMessage;
  entry.updatedAt = Date.now();
  
  await saveDataImmediate(data);
  return { success: true, message: `✅ Updated Q&A entry for **${keyword}**!` };
}

async function deleteQAEntry(data, keyword) {
  initializeQAData(data);
  
  const index = data.globalQA.findIndex(qa => qa.keyword.toLowerCase() === keyword.toLowerCase());
  if (index === -1) {
    return { success: false, message: `❌ Q&A entry for **${keyword}** not found!` };
  }
  
  const removed = data.globalQA.splice(index, 1)[0];
  await saveDataImmediate(data);
  return { success: true, message: `✅ Deleted Q&A entry for **${removed.keyword}**!` };
}

function formatQAEmbed(entry) {
  const embed = new EmbedBuilder()
    .setColor('#00D9FF')
    .setTitle(`❓ ${entry.question || entry.keyword}`)
    .setFooter({ text: 'Q&A System' })
    .setTimestamp();
  
  // If there's a question, show keyword as field and answer as description
  if (entry.question) {
    embed.setDescription(entry.message)
      .addFields({ name: '🔑 Keyword', value: `\`${entry.keyword}\`` });
  } else {
    // For legacy entries without question, just show the answer
    embed.setDescription(entry.message);
  }
  
  return embed;
}

module.exports = {
  initializeQAData,
  getQAEntry,
  getAllQA,
  addQAEntry,
  editQAEntry,
  deleteQAEntry,
  formatQAEmbed
};
