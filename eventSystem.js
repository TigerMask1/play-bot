const { EmbedBuilder } = require('discord.js');
const mongoManager = require('./mongoManager');
const { ObjectId } = require('mongodb');

const EVENT_TYPES = ['trophy_hunt', 'crate_master', 'drop_catcher'];
const EVENT_DURATION_MS = 24 * 60 * 60 * 1000;

const EVENT_DISPLAY_NAMES = {
  trophy_hunt: '🏆 Trophy Hunt',
  crate_master: '📦 Crate Master',
  drop_catcher: '💰 Drop Catcher'
};

const EVENT_DESCRIPTIONS = {
  trophy_hunt: 'Earn the most trophies from battles to win!',
  crate_master: 'Open the most crates to claim victory!',
  drop_catcher: 'Catch the most drops to dominate!'
};

let currentEventTimer = null;
let botClient = null;
let dataManager = null;

async function init(client, data) {
  botClient = client;
  dataManager = data;
  
  const activeEvent = await mongoManager.getCurrentEvent();
  
  if (activeEvent) {
    const now = new Date();
    const endAt = new Date(activeEvent.endAt);
    
    if (now >= endAt) {
      await endEvent(activeEvent);
      await startNextEvent();
    } else {
      const timeUntilEnd = endAt - now;
      scheduleEventEnd(activeEvent, timeUntilEnd);
      console.log(`📅 Event "${EVENT_DISPLAY_NAMES[activeEvent.eventType]}" is active, ends in ${Math.round(timeUntilEnd / 1000 / 60)} minutes`);
    }
  } else {
    await startNextEvent();
  }
}

function scheduleEventEnd(event, timeUntilEnd) {
  if (currentEventTimer) {
    clearTimeout(currentEventTimer);
  }
  
  currentEventTimer = setTimeout(async () => {
    await endEvent(event);
    await startNextEvent();
  }, timeUntilEnd);
}

async function startNextEvent() {
  const lastEvent = await mongoManager.getCurrentEvent();
  
  let rotationIndex = 0;
  if (lastEvent && lastEvent.rotationIndex !== undefined) {
    rotationIndex = (lastEvent.rotationIndex + 1) % EVENT_TYPES.length;
  }
  
  const eventType = EVENT_TYPES[rotationIndex];
  const startAt = new Date();
  const endAt = new Date(startAt.getTime() + EVENT_DURATION_MS);
  
  const eventData = {
    eventType,
    status: 'active',
    startAt,
    endAt,
    rotationIndex,
    announcementChannelId: dataManager.eventChannelId,
    leaderboardSnapshot: null,
    rewardsDistributed: false
  };
  
  const eventId = await mongoManager.createEvent(eventData);
  eventData._id = eventId;
  
  scheduleEventEnd(eventData, EVENT_DURATION_MS);
  
  await announceEventStart(eventData);
  
  console.log(`🎉 Started new event: ${EVENT_DISPLAY_NAMES[eventType]}`);
}

async function endEvent(event) {
  const participants = await mongoManager.getEventParticipants(event._id);
  
  const leaderboard = participants.map((p, index) => ({
    rank: index + 1,
    userId: p.userId,
    username: p.username,
    score: p.score
  }));
  
  await mongoManager.updateEvent(event._id, {
    status: 'ended',
    leaderboardSnapshot: leaderboard
  });
  
  await distributeRewards(event, leaderboard);
  await announceEventEnd(event, leaderboard);
  
  console.log(`🏁 Ended event: ${EVENT_DISPLAY_NAMES[event.eventType]}`);
}

async function distributeRewards(event, leaderboard) {
  if (leaderboard.length === 0) {
    return;
  }
  
  const rewards = [
    { gems: 500, coins: 5000 },
    { gems: 250, coins: 2500 },
    { gems: 150, coins: 1500 }
  ];
  
  const top5PercentCount = Math.max(1, Math.ceil(leaderboard.length * 0.05));
  
  const data = await dataManager.loadData();
  
  for (let i = 0; i < leaderboard.length; i++) {
    const participant = leaderboard[i];
    const userId = participant.userId;
    
    if (!data.users[userId]) {
      data.users[userId] = { coins: 0, gems: 0, characters: {} };
    }
    
    if (i < 3 && i < rewards.length) {
      data.users[userId].gems = (data.users[userId].gems || 0) + rewards[i].gems;
      data.users[userId].coins = (data.users[userId].coins || 0) + rewards[i].coins;
    } else if (i < top5PercentCount) {
      data.users[userId].gems = (data.users[userId].gems || 0) + 75;
      data.users[userId].coins = (data.users[userId].coins || 0) + 750;
    }
  }
  
  await dataManager.saveData(data);
  await mongoManager.updateEvent(event._id, { rewardsDistributed: true });
}

async function announceEventStart(event) {
  if (!event.announcementChannelId || !botClient) return;
  
  try {
    const channel = await botClient.channels.fetch(event.announcementChannelId);
    if (!channel) return;
    
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle(`${EVENT_DISPLAY_NAMES[event.eventType]} Has Started! 🎉`)
      .setDescription(EVENT_DESCRIPTIONS[event.eventType])
      .addFields(
        { name: '⏰ Duration', value: '24 Hours', inline: true },
        { name: '🏆 Rewards', value: 'Top 3 and Top 5% get prizes!', inline: true }
      )
      .addFields(
        { name: '🥇 1st Place', value: '500 💎 + 5,000 💰', inline: true },
        { name: '🥈 2nd Place', value: '250 💎 + 2,500 💰', inline: true },
        { name: '🥉 3rd Place', value: '150 💎 + 1,500 💰', inline: true },
        { name: '🎖️ Top 5%', value: '75 💎 + 750 💰', inline: true }
      )
      .addFields({ name: '📊 Track Progress', value: 'Use `!event` to see your current points!', inline: false })
      .setTimestamp();
    
    await channel.send({ content: '@everyone', embeds: [embed] });
  } catch (error) {
    console.error('Error announcing event start:', error);
  }
}

async function announceEventEnd(event, leaderboard) {
  if (!event.announcementChannelId || !botClient) return;
  
  try {
    const channel = await botClient.channels.fetch(event.announcementChannelId);
    if (!channel) return;
    
    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle(`${EVENT_DISPLAY_NAMES[event.eventType]} Has Ended! 🏁`)
      .setDescription('Thank you to all participants! Here are the winners:')
      .setTimestamp();
    
    if (leaderboard.length === 0) {
      embed.addFields({ name: '🏆 Winners', value: 'None - No participants', inline: false });
    } else {
      const top3 = leaderboard.slice(0, 3);
      const medals = ['🥇', '🥈', '🥉'];
      
      for (let i = 0; i < 3; i++) {
        if (i < top3.length) {
          const participant = top3[i];
          embed.addFields({
            name: `${medals[i]} ${i + 1}st Place`,
            value: `${participant.username} - ${participant.score} points`,
            inline: false
          });
        } else {
          embed.addFields({
            name: `${medals[i]} ${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : 'rd'} Place`,
            value: 'None',
            inline: false
          });
        }
      }
      
      const top5PercentCount = Math.max(1, Math.ceil(leaderboard.length * 0.05));
      const top5PercentOthers = Math.max(0, top5PercentCount - 3);
      
      if (top5PercentOthers > 0) {
        embed.addFields({
          name: '🎖️ Top 5%',
          value: `${top5PercentOthers} other ${top5PercentOthers === 1 ? 'player' : 'players'} also received rewards!`,
          inline: false
        });
      }
    }
    
    embed.addFields({ name: '📊 View Results', value: 'Use `!event` to see your rank and points!', inline: false });
    
    await channel.send({ content: '@everyone', embeds: [embed] });
  } catch (error) {
    console.error('Error announcing event end:', error);
  }
}

async function recordProgress(userId, username, delta, eventType) {
  const activeEvent = await mongoManager.getCurrentEvent();
  
  if (!activeEvent || activeEvent.status !== 'active') {
    return false;
  }
  
  if (activeEvent.eventType !== eventType) {
    return false;
  }
  
  return await mongoManager.recordEventProgress(activeEvent._id, userId, username, delta);
}

async function getEventInfo(userId) {
  const activeEvent = await mongoManager.getCurrentEvent();
  
  if (!activeEvent) {
    return { status: 'no_event', message: 'No event is currently active.' };
  }
  
  const now = new Date();
  const endAt = new Date(activeEvent.endAt);
  
  if (activeEvent.status === 'active' && now < endAt) {
    const participants = await mongoManager.getEventParticipants(activeEvent._id);
    const userParticipant = await mongoManager.getEventParticipant(activeEvent._id, userId);
    
    const userScore = userParticipant ? userParticipant.score : 0;
    const userRank = participants.findIndex(p => p.userId === userId) + 1;
    
    const timeRemaining = endAt - now;
    const hoursRemaining = Math.floor(timeRemaining / 1000 / 60 / 60);
    const minutesRemaining = Math.floor((timeRemaining / 1000 / 60) % 60);
    
    return {
      status: 'active',
      eventType: activeEvent.eventType,
      displayName: EVENT_DISPLAY_NAMES[activeEvent.eventType],
      description: EVENT_DESCRIPTIONS[activeEvent.eventType],
      userScore,
      userRank: userRank > 0 ? userRank : 'Unranked',
      totalParticipants: participants.length,
      timeRemaining: `${hoursRemaining}h ${minutesRemaining}m`,
      endAt
    };
  } else {
    const leaderboard = activeEvent.leaderboardSnapshot || [];
    const userEntry = leaderboard.find(p => p.userId === userId);
    
    return {
      status: 'ended',
      eventType: activeEvent.eventType,
      displayName: EVENT_DISPLAY_NAMES[activeEvent.eventType],
      userScore: userEntry ? userEntry.score : 0,
      userRank: userEntry ? userEntry.rank : 'Did not participate',
      totalParticipants: leaderboard.length,
      leaderboard: leaderboard.slice(0, 3)
    };
  }
}

module.exports = {
  init,
  recordProgress,
  getEventInfo,
  EVENT_TYPES
};
