const { getCollection, COLLECTIONS } = require('../infrastructure/database');
const { createWorkHistorySchema } = require('../models/schemas');
const { getServerSettings } = require('./serverSettingsService');
const { updateServerBalance } = require('./economyService');
const { updateServerProfile, getServerProfile } = require('./profileService');
const logger = require('../core/logger');

async function getAvailableJobs(serverId) {
  const settings = await getServerSettings(serverId);
  if (!settings?.workSettings?.enabled) {
    return [];
  }
  return settings.workSettings.jobs || [];
}

async function checkWorkEligibility(userId, serverId, jobId = null) {
  const settings = await getServerSettings(serverId);
  if (!settings?.workSettings?.enabled) {
    return { eligible: false, reason: 'Work commands are disabled on this server' };
  }
  
  const profile = await getServerProfile(userId, serverId);
  if (!profile?.started) {
    return { eligible: false, reason: 'You need to use !start first' };
  }
  
  const lastWork = profile.cooldowns?.work;
  const jobs = settings.workSettings.jobs;
  
  if (jobId) {
    const job = jobs.find(j => j.id === jobId);
    if (!job) {
      return { eligible: false, reason: 'Job not found' };
    }
    
    const jobCooldown = job.cooldown * 1000;
    const lastJobWork = profile.cooldowns?.[`work_${jobId}`];
    
    if (lastJobWork && (Date.now() - new Date(lastJobWork).getTime()) < jobCooldown) {
      const remaining = Math.ceil((jobCooldown - (Date.now() - new Date(lastJobWork).getTime())) / 1000);
      return { eligible: false, reason: `${job.name} on cooldown (${remaining}s remaining)`, job };
    }
  } else {
    const globalCooldown = settings.workSettings.cooldown * 1000;
    if (lastWork && (Date.now() - new Date(lastWork).getTime()) < globalCooldown) {
      const remaining = Math.ceil((globalCooldown - (Date.now() - new Date(lastWork).getTime())) / 1000);
      return { eligible: false, reason: `Work on cooldown (${remaining}s remaining)` };
    }
  }
  
  return { eligible: true };
}

async function performWork(userId, serverId, jobId) {
  const settings = await getServerSettings(serverId);
  const jobs = settings.workSettings.jobs;
  
  const job = jobs.find(j => j.id === jobId);
  if (!job) {
    return { success: false, error: 'Job not found' };
  }
  
  const eligibility = await checkWorkEligibility(userId, serverId, jobId);
  if (!eligibility.eligible) {
    return { success: false, error: eligibility.reason };
  }
  
  const failed = Math.random() < (job.failChance || 0);
  
  let result;
  if (failed) {
    const message = job.failMessages?.[Math.floor(Math.random() * job.failMessages.length)] 
      || 'Your work failed!';
    result = {
      success: false,
      job,
      message,
      rewards: 0,
      xp: 0
    };
  } else {
    const rewardAmount = Math.floor(
      Math.random() * (job.rewards.max - job.rewards.min + 1)
    ) + job.rewards.min;
    
    const xpAmount = Math.floor(
      Math.random() * (job.xp.max - job.xp.min + 1)
    ) + job.xp.min;
    
    const message = job.messages?.[Math.floor(Math.random() * job.messages.length)]
      || `You completed ${job.name} successfully!`;
    
    result = {
      success: true,
      job,
      message,
      rewards: rewardAmount,
      xp: xpAmount
    };
    
    await updateServerBalance(userId, serverId, 'primary', rewardAmount, `Work: ${job.name}`);
    await grantXP(userId, serverId, xpAmount);
  }
  
  const cooldownUpdate = {
    'cooldowns.work': new Date(),
    [`cooldowns.work_${jobId}`]: new Date()
  };
  
  await updateServerProfile(userId, serverId, {
    ...cooldownUpdate,
    $inc: { 'stats.workCompleted': 1 }
  });
  
  const collection = await getCollection(COLLECTIONS.ECONOMY_TRANSACTIONS);
  await collection.insertOne(createWorkHistorySchema(userId, serverId, jobId, result));
  
  return result;
}

async function grantXP(userId, serverId, amount) {
  const settings = await getServerSettings(serverId);
  const profile = await getServerProfile(userId, serverId);
  
  const currentXP = profile.xp || 0;
  const currentLevel = profile.level || 1;
  const newXP = currentXP + amount;
  
  const levelFormula = settings.progressionSettings?.levelFormula || { base: 100, multiplier: 1.5 };
  const xpForNextLevel = Math.floor(levelFormula.base * Math.pow(levelFormula.multiplier, currentLevel - 1));
  
  let newLevel = currentLevel;
  let remainingXP = newXP;
  let levelsGained = 0;
  
  while (remainingXP >= xpForNextLevel) {
    remainingXP -= xpForNextLevel;
    newLevel++;
    levelsGained++;
  }
  
  await updateServerProfile(userId, serverId, {
    xp: remainingXP,
    level: newLevel,
    $inc: { 'stats.xpEarned': amount }
  });
  
  return { newLevel, newXP: remainingXP, levelsGained, totalXPGained: amount };
}

async function addCustomJob(serverId, jobConfig, addedBy) {
  const collection = await getCollection(COLLECTIONS.SERVER_SETTINGS);
  
  const existingSettings = await getServerSettings(serverId);
  const existingJobs = existingSettings?.workSettings?.jobs || [];
  
  if (existingJobs.find(j => j.id === jobConfig.id)) {
    return { success: false, error: 'Job with this ID already exists' };
  }
  
  const newJob = {
    id: jobConfig.id,
    name: jobConfig.name,
    emoji: jobConfig.emoji || '💼',
    cooldown: jobConfig.cooldown || 300,
    rewards: {
      min: jobConfig.rewardMin || 20,
      max: jobConfig.rewardMax || 80
    },
    xp: {
      min: jobConfig.xpMin || 5,
      max: jobConfig.xpMax || 15
    },
    messages: jobConfig.messages || [`You completed ${jobConfig.name}!`],
    failChance: jobConfig.failChance || 0.1,
    failMessages: jobConfig.failMessages || ['You failed!'],
    addedBy,
    addedAt: new Date()
  };
  
  await collection.updateOne(
    { serverId },
    { $push: { 'workSettings.jobs': newJob } }
  );
  
  return { success: true, job: newJob };
}

async function removeCustomJob(serverId, jobId) {
  const collection = await getCollection(COLLECTIONS.SERVER_SETTINGS);
  
  await collection.updateOne(
    { serverId },
    { $pull: { 'workSettings.jobs': { id: jobId } } }
  );
  
  return { success: true };
}

async function updateJobConfig(serverId, jobId, updates) {
  const collection = await getCollection(COLLECTIONS.SERVER_SETTINGS);
  
  const updateFields = {};
  for (const [key, value] of Object.entries(updates)) {
    updateFields[`workSettings.jobs.$.${key}`] = value;
  }
  
  await collection.updateOne(
    { serverId, 'workSettings.jobs.id': jobId },
    { $set: updateFields }
  );
  
  return { success: true };
}

module.exports = {
  getAvailableJobs,
  checkWorkEligibility,
  performWork,
  grantXP,
  addCustomJob,
  removeCustomJob,
  updateJobConfig
};
