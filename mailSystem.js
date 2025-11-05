const CHARACTERS = require('./characters.js');
const { assignMovesAndHP } = require('./battleUtils.js');

function sendMailToAll(message, rewards = {}, senderName = "Admin") {
  return {
    id: Date.now(),
    from: senderName,
    message: message,
    rewards: rewards,
    timestamp: new Date().toISOString(),
    claimed: false
  };
}

function addMailToUser(userData, mail) {
  if (!userData.mailbox) userData.mailbox = [];
  
  const userMail = { ...mail };
  userData.mailbox.push(userMail);
  
  return true;
}

function claimMail(userData, mailIndex) {
  if (!userData.mailbox || mailIndex < 0 || mailIndex >= userData.mailbox.length) {
    return { success: false, message: "❌ Invalid mail!" };
  }
  
  const mail = userData.mailbox[mailIndex];
  
  if (mail.claimed) {
    return { success: false, message: "❌ You've already claimed this mail!" };
  }
  
  const rewardMessages = [];
  
  if (mail.rewards.coins) {
    userData.coins = (userData.coins || 0) + mail.rewards.coins;
    rewardMessages.push(`💰 ${mail.rewards.coins} coins`);
  }
  
  if (mail.rewards.gems) {
    userData.gems = (userData.gems || 0) + mail.rewards.gems;
    rewardMessages.push(`💎 ${mail.rewards.gems} gems`);
  }
  
  if (mail.rewards.shards) {
    userData.shards = (userData.shards || 0) + mail.rewards.shards;
    rewardMessages.push(`🔷 ${mail.rewards.shards} shards`);
  }
  
  if (mail.rewards.character) {
    const charName = mail.rewards.character;
    const charData = CHARACTERS.find(c => c.name.toLowerCase() === charName.toLowerCase());
    
    if (charData) {
      if (!userData.characters) userData.characters = {};
      
      if (userData.characters[charData.name]) {
        const tokens = 100;
        userData.characters[charData.name].tokens = (userData.characters[charData.name].tokens || 0) + tokens;
        rewardMessages.push(`🎫 ${tokens} ${charData.name} tokens (duplicate)`);
      } else {
        const st = parseFloat((Math.random() * 99 + 1).toFixed(2));
        const charObj = assignMovesAndHP({ name: charData.name, level: 1, tokens: 0, st: st });
        userData.characters[charData.name] = charObj;
        rewardMessages.push(`${charData.emoji} ${charData.name} (${st.toFixed(2)}% ST)`);
      }
    }
  }
  
  if (mail.rewards.bronzeCrates) {
    userData.bronzeCrates = (userData.bronzeCrates || 0) + mail.rewards.bronzeCrates;
    rewardMessages.push(`🟫 ${mail.rewards.bronzeCrates} Bronze Crate(s)`);
  }
  
  if (mail.rewards.silverCrates) {
    userData.silverCrates = (userData.silverCrates || 0) + mail.rewards.silverCrates;
    rewardMessages.push(`⚪ ${mail.rewards.silverCrates} Silver Crate(s)`);
  }
  
  if (mail.rewards.goldCrates) {
    userData.goldCrates = (userData.goldCrates || 0) + mail.rewards.goldCrates;
    rewardMessages.push(`🟡 ${mail.rewards.goldCrates} Gold Crate(s)`);
  }
  
  if (mail.rewards.emeraldCrates) {
    userData.emeraldCrates = (userData.emeraldCrates || 0) + mail.rewards.emeraldCrates;
    rewardMessages.push(`🟢 ${mail.rewards.emeraldCrates} Emerald Crate(s)`);
  }
  
  if (mail.rewards.legendaryCrates) {
    userData.legendaryCrates = (userData.legendaryCrates || 0) + mail.rewards.legendaryCrates;
    rewardMessages.push(`🟣 ${mail.rewards.legendaryCrates} Legendary Crate(s)`);
  }
  
  if (mail.rewards.tyrantCrates) {
    userData.tyrantCrates = (userData.tyrantCrates || 0) + mail.rewards.tyrantCrates;
    rewardMessages.push(`🔴 ${mail.rewards.tyrantCrates} Tyrant Crate(s)`);
  }
  
  mail.claimed = true;
  
  return {
    success: true,
    message: `✅ Claimed rewards from mail!`,
    rewards: rewardMessages
  };
}

function getUnclaimedMailCount(userData) {
  if (!userData.mailbox) return 0;
  return userData.mailbox.filter(m => !m.claimed).length;
}

function formatMailDisplay(mail, index) {
  const status = mail.claimed ? '✅' : '📬';
  const date = new Date(mail.timestamp).toLocaleDateString();
  
  const rewards = [];
  if (mail.rewards.coins) rewards.push(`💰${mail.rewards.coins}`);
  if (mail.rewards.gems) rewards.push(`💎${mail.rewards.gems}`);
  if (mail.rewards.shards) rewards.push(`🔷${mail.rewards.shards}`);
  if (mail.rewards.character) rewards.push(`🎭${mail.rewards.character}`);
  if (mail.rewards.goldCrates) rewards.push(`📦×${mail.rewards.goldCrates}`);
  if (mail.rewards.emeraldCrates) rewards.push(`💚×${mail.rewards.emeraldCrates}`);
  if (mail.rewards.legendaryCrates) rewards.push(`🟣×${mail.rewards.legendaryCrates}`);
  if (mail.rewards.tyrantCrates) rewards.push(`🔴×${mail.rewards.tyrantCrates}`);
  
  const rewardText = rewards.length > 0 ? `Rewards: ${rewards.join(' ')}` : 'No rewards';
  
  return `${status} **Mail #${index + 1}** from ${mail.from} (${date})\n${mail.message}\n${rewardText}`;
}

module.exports = {
  sendMailToAll,
  addMailToUser,
  claimMail,
  getUnclaimedMailCount,
  formatMailDisplay
};
