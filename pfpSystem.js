const { saveData, saveDataImmediate } = require('./dataManager.js');

function initializePfpData(userData) {
  if (!userData.pfp) {
    userData.pfp = {
      ownedPfps: [],
      equippedPfp: null
    };
  }
  return userData.pfp;
}

async function addPfp(userId, imageUrl, pfpName, data) {
  const userData = data.users[userId];
  if (!userData) {
    return { success: false, message: '❌ User not found!' };
  }

  const pfpData = initializePfpData(userData);
  
  const pfpId = `pfp_${userId}_${Date.now()}`;
  const newPfp = {
    id: pfpId,
    name: pfpName,
    url: imageUrl,
    addedAt: Date.now()
  };
  
  pfpData.ownedPfps.push(newPfp);
  await saveDataImmediate(data);
  
  return { 
    success: true, 
    message: `✅ Successfully added PFP "${pfpName}"! You now have ${pfpData.ownedPfps.length} profile image(s).`,
    pfpId: pfpId
  };
}

async function removePfp(userId, pfpId, data) {
  const userData = data.users[userId];
  if (!userData) {
    return { success: false, message: '❌ User not found!' };
  }

  const pfpData = initializePfpData(userData);
  const pfpIndex = pfpData.ownedPfps.findIndex(p => p.id === pfpId);
  
  if (pfpIndex === -1) {
    return { success: false, message: '❌ PFP not found!' };
  }
  
  const removedPfp = pfpData.ownedPfps[pfpIndex];
  pfpData.ownedPfps.splice(pfpIndex, 1);
  
  if (pfpData.equippedPfp === pfpId) {
    pfpData.equippedPfp = null;
  }
  
  await saveDataImmediate(data);
  
  return { 
    success: true, 
    message: `✅ Successfully removed PFP "${removedPfp.name}".`
  };
}

async function equipPfp(userId, pfpId, data) {
  const userData = data.users[userId];
  if (!userData) {
    return { success: false, message: '❌ User not found!' };
  }

  const pfpData = initializePfpData(userData);
  
  if (pfpId === null || pfpId === 'none') {
    pfpData.equippedPfp = null;
    await saveDataImmediate(data);
    return { 
      success: true, 
      message: '✅ Unequipped profile image! Your character image will be shown instead.'
    };
  }
  
  const pfp = pfpData.ownedPfps.find(p => p.id === pfpId);
  
  if (!pfp) {
    return { success: false, message: '❌ You don\'t own this PFP!' };
  }
  
  pfpData.equippedPfp = pfpId;
  await saveDataImmediate(data);
  
  return { 
    success: true, 
    message: `✅ Successfully equipped "${pfp.name}" as your profile image!`
  };
}

function getUserPfps(userId, data) {
  const userData = data.users[userId];
  if (!userData) return null;
  
  const pfpData = initializePfpData(userData);
  return pfpData;
}

function getEquippedPfp(userId, data) {
  const userData = data.users[userId];
  if (!userData) return null;
  
  const pfpData = initializePfpData(userData);
  
  if (!pfpData.equippedPfp) return null;
  
  const equippedPfp = pfpData.ownedPfps.find(p => p.id === pfpData.equippedPfp);
  return equippedPfp || null;
}

async function uploadPfpFromAttachment(message, pfpName, userId, data) {
  if (message.attachments.size === 0) {
    return { success: false, message: '❌ Please attach an image to use as your profile picture!' };
  }
  
  const attachment = message.attachments.first();
  
  if (!attachment.contentType || !attachment.contentType.startsWith('image/')) {
    return { success: false, message: '❌ Please attach a valid image file (PNG, JPG, GIF, etc.)!' };
  }
  
  const imageUrl = attachment.url;
  
  return await addPfp(userId, imageUrl, pfpName, data);
}

async function adminAddPfpToUser(targetUserId, imageUrl, pfpName, data) {
  return await addPfp(targetUserId, imageUrl, pfpName, data);
}

async function adminRemovePfpFromUser(targetUserId, pfpId, data) {
  return await removePfp(targetUserId, pfpId, data);
}

function listAllPfps(userId, data) {
  const pfpData = getUserPfps(userId, data);
  
  if (!pfpData || pfpData.ownedPfps.length === 0) {
    return {
      count: 0,
      equipped: null,
      pfps: []
    };
  }
  
  return {
    count: pfpData.ownedPfps.length,
    equipped: pfpData.equippedPfp,
    pfps: pfpData.ownedPfps
  };
}

module.exports = {
  initializePfpData,
  addPfp,
  removePfp,
  equipPfp,
  getUserPfps,
  getEquippedPfp,
  uploadPfpFromAttachment,
  adminAddPfpToUser,
  adminRemovePfpFromUser,
  listAllPfps
};
