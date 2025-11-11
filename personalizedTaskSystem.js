const { saveData, saveDataImmediate } = require('./dataManager.js');

// Task pool with 50+ variations
const PERSONALIZED_TASKS = [
  // Easy Tasks (1 hour) - Bronze/Silver crate rewards
  { id: 'pt1', name: 'Quick Drop', description: 'catch 1 drop', type: 'drops', requirement: 1, field: 'dropsCaught', reward: { crates: [{ type: 'bronze', count: 1 }], coins: 150, gems: 8 }, difficulty: 'easy', duration: 3600000 },
  { id: 'pt2', name: 'First Win', description: 'win 1 battle against AI', type: 'battles', requirement: 1, field: 'battlesWon', reward: { crates: [{ type: 'silver', count: 1 }], coins: 200, gems: 10 }, difficulty: 'easy', duration: 3600000 },
  { id: 'pt3', name: 'Open Up', description: 'open 1 crate', type: 'crates', requirement: 1, field: 'cratesOpened', reward: { crates: [{ type: 'bronze', count: 1 }], coins: 100, gems: 5 }, difficulty: 'easy', duration: 3600000 },
  { id: 'pt4', name: 'Level Boost', description: 'level up your character by 1', type: 'leveling', requirement: 1, field: 'levelsGained', reward: { crates: [{ type: 'silver', count: 1 }], coins: 180, gems: 9 }, difficulty: 'easy', duration: 3600000 },
  { id: 'pt5', name: 'Chat Time', description: 'send 5 messages', type: 'messages', requirement: 5, field: 'messagesSent', reward: { coins: 120, gems: 6 }, difficulty: 'easy', duration: 3600000 },
  { id: 'pt6', name: 'Trade Start', description: 'trade some coins with another player', type: 'trading', requirement: 1, field: 'coinTradesCompleted', reward: { crates: [{ type: 'bronze', count: 1 }], coins: 150, gems: 8 }, difficulty: 'easy', duration: 3600000 },
  { id: 'pt7', name: 'Gem Trader', description: 'trade some gems with another player', type: 'trading', requirement: 1, field: 'gemTradesCompleted', reward: { crates: [{ type: 'silver', count: 1 }], coins: 200, gems: 10 }, difficulty: 'easy', duration: 3600000 },
  { id: 'pt8', name: 'Quick Battle', description: 'battle against any user', type: 'battles', requirement: 1, field: 'userBattles', reward: { crates: [{ type: 'silver', count: 1 }], coins: 250, gems: 12 }, difficulty: 'easy', duration: 3600000 },
  { id: 'pt9', name: 'Double Up', description: 'catch 2 drops', type: 'drops', requirement: 2, field: 'dropsCaught', reward: { crates: [{ type: 'bronze', count: 2 }], coins: 220, gems: 11 }, difficulty: 'easy', duration: 3600000 },
  { id: 'pt10', name: 'Crate Fever', description: 'open 2 crates', type: 'crates', requirement: 2, field: 'cratesOpened', reward: { crates: [{ type: 'silver', count: 1 }], coins: 180, gems: 9 }, difficulty: 'easy', duration: 3600000 },
  
  // Medium Tasks (2-3 hours) - Gold/Emerald crate rewards
  { id: 'pt11', name: 'Drop Hunter', description: 'catch 5 drops', type: 'drops', requirement: 5, field: 'dropsCaught', reward: { crates: [{ type: 'gold', count: 1 }], coins: 350, gems: 18, shards: 1 }, difficulty: 'medium', duration: 7200000 },
  { id: 'pt12', name: 'Battle Streak', description: 'win 3 battles', type: 'battles', requirement: 3, field: 'battlesWon', reward: { crates: [{ type: 'gold', count: 1 }], coins: 450, gems: 22, shards: 1 }, difficulty: 'medium', duration: 7200000 },
  { id: 'pt13', name: 'Crate Opener', description: 'open 3 crates', type: 'crates', requirement: 3, field: 'cratesOpened', reward: { crates: [{ type: 'gold', count: 1 }], coins: 300, gems: 15, shards: 1 }, difficulty: 'medium', duration: 7200000 },
  { id: 'pt14', name: 'Level Rush', description: 'gain 3 levels on any character', type: 'leveling', requirement: 3, field: 'levelsGained', reward: { crates: [{ type: 'emerald', count: 1 }], coins: 380, gems: 19, shards: 1 }, difficulty: 'medium', duration: 7200000 },
  { id: 'pt15', name: 'Social Butterfly', description: 'send 15 messages', type: 'messages', requirement: 15, field: 'messagesSent', reward: { coins: 280, gems: 14 }, difficulty: 'medium', duration: 7200000 },
  { id: 'pt16', name: 'Trade Master', description: 'complete 2 trades', type: 'trading', requirement: 2, field: 'tradesCompleted', reward: { crates: [{ type: 'gold', count: 1 }], coins: 400, gems: 20, shards: 1 }, difficulty: 'medium', duration: 7200000 },
  { id: 'pt17', name: 'PvP Warrior', description: 'battle 2 different users', type: 'battles', requirement: 2, field: 'userBattles', reward: { crates: [{ type: 'emerald', count: 1 }], coins: 500, gems: 25, shards: 2 }, difficulty: 'medium', duration: 7200000 },
  { id: 'pt18', name: 'Drop Collector', description: 'catch 8 drops', type: 'drops', requirement: 8, field: 'dropsCaught', reward: { crates: [{ type: 'gold', count: 2 }], coins: 420, gems: 21, shards: 1 }, difficulty: 'medium', duration: 10800000 },
  { id: 'pt19', name: 'Crate Spree', description: 'open 5 crates', type: 'crates', requirement: 5, field: 'cratesOpened', reward: { crates: [{ type: 'emerald', count: 1 }], coins: 500, gems: 25, shards: 2 }, difficulty: 'medium', duration: 10800000 },
  { id: 'pt20', name: 'Win Machine', description: 'win 5 battles', type: 'battles', requirement: 5, field: 'battlesWon', reward: { crates: [{ type: 'emerald', count: 1 }], coins: 600, gems: 30, shards: 2 }, difficulty: 'medium', duration: 10800000 },
  
  // Hard Tasks (5 hours) - Legendary crate rewards (CHALLENGING!)
  { id: 'pt21', name: 'Drop Master', description: 'catch 30 drops', type: 'drops', requirement: 30, field: 'dropsCaught', reward: { crates: [{ type: 'legendary', count: 2 }], coins: 1400, gems: 70, shards: 6 }, difficulty: 'hard', duration: 18000000 },
  { id: 'pt22', name: 'Battle Champion', description: 'win 18 battles', type: 'battles', requirement: 18, field: 'battlesWon', reward: { crates: [{ type: 'legendary', count: 2 }], coins: 1600, gems: 80, shards: 7 }, difficulty: 'hard', duration: 18000000 },
  { id: 'pt23', name: 'Crate Maniac', description: 'open 18 crates', type: 'crates', requirement: 18, field: 'cratesOpened', reward: { crates: [{ type: 'legendary', count: 2 }], coins: 1500, gems: 75, shards: 6 }, difficulty: 'hard', duration: 18000000 },
  { id: 'pt24', name: 'Power Training', description: 'gain 12 levels', type: 'leveling', requirement: 12, field: 'levelsGained', reward: { crates: [{ type: 'legendary', count: 2 }], coins: 1300, gems: 65, shards: 6 }, difficulty: 'hard', duration: 18000000 },
  { id: 'pt25', name: 'Chatterbox', description: 'send 75 messages', type: 'messages', requirement: 75, field: 'messagesSent', reward: { crates: [{ type: 'legendary', count: 1 }], coins: 1100, gems: 55, shards: 5 }, difficulty: 'hard', duration: 18000000 },
  { id: 'pt26', name: 'Trading Tycoon', description: 'complete 10 trades', type: 'trading', requirement: 10, field: 'tradesCompleted', reward: { crates: [{ type: 'legendary', count: 2 }], coins: 1400, gems: 70, shards: 6 }, difficulty: 'hard', duration: 18000000 },
  { id: 'pt27', name: 'PvP Expert', description: 'battle 8 different users', type: 'battles', requirement: 8, field: 'userBattles', reward: { crates: [{ type: 'legendary', count: 3 }], coins: 1800, gems: 90, shards: 8 }, difficulty: 'hard', duration: 18000000 },
  { id: 'pt28', name: 'Drop Legend', description: 'catch 40 drops', type: 'drops', requirement: 40, field: 'dropsCaught', reward: { crates: [{ type: 'legendary', count: 3 }], coins: 2000, gems: 100, shards: 9 }, difficulty: 'hard', duration: 18000000 },
  { id: 'pt29', name: 'Elite Trainer', description: 'gain 15 levels', type: 'leveling', requirement: 15, field: 'levelsGained', reward: { crates: [{ type: 'legendary', count: 2 }, { type: 'tyrant', count: 1 }], coins: 1700, gems: 85, shards: 7 }, difficulty: 'hard', duration: 18000000 },
  { id: 'pt30', name: 'Conversation King', description: 'send 100 messages', type: 'messages', requirement: 100, field: 'messagesSent', reward: { crates: [{ type: 'legendary', count: 2 }], coins: 1500, gems: 75, shards: 6 }, difficulty: 'hard', duration: 18000000 },
  
  // Variations with mixed objectives
  { id: 'pt31', name: 'Warm Up', description: 'win 2 battles', type: 'battles', requirement: 2, field: 'battlesWon', reward: { crates: [{ type: 'silver', count: 1 }], coins: 300, gems: 15 }, difficulty: 'easy', duration: 3600000 },
  { id: 'pt32', name: 'Triple Drop', description: 'catch 3 drops', type: 'drops', requirement: 3, field: 'dropsCaught', reward: { crates: [{ type: 'bronze', count: 1 }], coins: 250, gems: 13 }, difficulty: 'easy', duration: 3600000 },
  { id: 'pt33', name: 'Crate Collector', description: 'open 4 crates', type: 'crates', requirement: 4, field: 'cratesOpened', reward: { crates: [{ type: 'gold', count: 1 }], coins: 350, gems: 18 }, difficulty: 'medium', duration: 7200000 },
  { id: 'pt34', name: 'Message Sprint', description: 'send 10 messages', type: 'messages', requirement: 10, field: 'messagesSent', reward: { coins: 200, gems: 10 }, difficulty: 'easy', duration: 3600000 },
  { id: 'pt35', name: 'Level Up', description: 'gain 2 levels', type: 'leveling', requirement: 2, field: 'levelsGained', reward: { crates: [{ type: 'silver', count: 1 }], coins: 280, gems: 14 }, difficulty: 'easy', duration: 3600000 },
  { id: 'pt36', name: 'Trade Deal', description: 'complete 3 trades', type: 'trading', requirement: 3, field: 'tradesCompleted', reward: { crates: [{ type: 'gold', count: 1 }], coins: 550, gems: 28, shards: 2 }, difficulty: 'medium', duration: 10800000 },
  { id: 'pt37', name: 'Battle Pro', description: 'win 14 battles', type: 'battles', requirement: 14, field: 'battlesWon', reward: { crates: [{ type: 'legendary', count: 2 }], coins: 1250, gems: 63, shards: 6 }, difficulty: 'hard', duration: 18000000 },
  { id: 'pt38', name: 'Drop Enthusiast', description: 'catch 12 drops', type: 'drops', requirement: 12, field: 'dropsCaught', reward: { crates: [{ type: 'emerald', count: 1 }], coins: 650, gems: 33, shards: 2 }, difficulty: 'medium', duration: 10800000 },
  { id: 'pt39', name: 'Crate Hunter', description: 'open 15 crates', type: 'crates', requirement: 15, field: 'cratesOpened', reward: { crates: [{ type: 'legendary', count: 2 }], coins: 1200, gems: 60, shards: 5 }, difficulty: 'hard', duration: 18000000 },
  { id: 'pt40', name: 'Social Star', description: 'send 20 messages', type: 'messages', requirement: 20, field: 'messagesSent', reward: { crates: [{ type: 'gold', count: 1 }], coins: 400, gems: 20, shards: 1 }, difficulty: 'medium', duration: 7200000 },
  { id: 'pt41', name: 'Quick Trader', description: 'complete 1 coin or gem trade', type: 'trading', requirement: 1, field: 'anyTrade', reward: { crates: [{ type: 'bronze', count: 1 }], coins: 175, gems: 9 }, difficulty: 'easy', duration: 3600000 },
  { id: 'pt42', name: 'Battle Rush', description: 'win 4 battles', type: 'battles', requirement: 4, field: 'battlesWon', reward: { crates: [{ type: 'emerald', count: 1 }], coins: 520, gems: 26, shards: 2 }, difficulty: 'medium', duration: 10800000 },
  { id: 'pt43', name: 'Drop Sprint', description: 'catch 6 drops', type: 'drops', requirement: 6, field: 'dropsCaught', reward: { crates: [{ type: 'gold', count: 1 }], coins: 380, gems: 19, shards: 1 }, difficulty: 'medium', duration: 7200000 },
  { id: 'pt44', name: 'Level Power', description: 'gain 4 levels', type: 'leveling', requirement: 4, field: 'levelsGained', reward: { crates: [{ type: 'emerald', count: 1 }], coins: 480, gems: 24, shards: 2 }, difficulty: 'medium', duration: 10800000 },
  { id: 'pt45', name: 'Crate Fever II', description: 'open 6 crates', type: 'crates', requirement: 6, field: 'cratesOpened', reward: { crates: [{ type: 'emerald', count: 1 }], coins: 600, gems: 30, shards: 2 }, difficulty: 'medium', duration: 10800000 },
  { id: 'pt46', name: 'Message Marathon', description: 'send 80 messages', type: 'messages', requirement: 80, field: 'messagesSent', reward: { crates: [{ type: 'legendary', count: 2 }], coins: 1250, gems: 63, shards: 5 }, difficulty: 'hard', duration: 18000000 },
  { id: 'pt47', name: 'Ultimate Trader', description: 'complete 12 trades', type: 'trading', requirement: 12, field: 'tradesCompleted', reward: { crates: [{ type: 'legendary', count: 2 }], coins: 1600, gems: 80, shards: 7 }, difficulty: 'hard', duration: 18000000 },
  { id: 'pt48', name: 'PvP Master', description: 'battle 3 users', type: 'battles', requirement: 3, field: 'userBattles', reward: { crates: [{ type: 'gold', count: 2 }], coins: 650, gems: 33, shards: 2 }, difficulty: 'medium', duration: 10800000 },
  { id: 'pt49', name: 'Elite Battler', description: 'win 20 battles', type: 'battles', requirement: 20, field: 'battlesWon', reward: { crates: [{ type: 'legendary', count: 3 }], coins: 2100, gems: 105, shards: 9 }, difficulty: 'hard', duration: 18000000 },
  { id: 'pt50', name: 'Drop Champion', description: 'catch 35 drops', type: 'drops', requirement: 35, field: 'dropsCaught', reward: { crates: [{ type: 'legendary', count: 3 }], coins: 1800, gems: 90, shards: 8 }, difficulty: 'hard', duration: 18000000 },
  { id: 'pt51', name: 'Level Legend', description: 'gain 18 levels', type: 'leveling', requirement: 18, field: 'levelsGained', reward: { crates: [{ type: 'legendary', count: 3 }, { type: 'tyrant', count: 1 }], coins: 2300, gems: 115, shards: 10 }, difficulty: 'hard', duration: 18000000 },
  { id: 'pt52', name: 'Crate King', description: 'open 20 crates', type: 'crates', requirement: 20, field: 'cratesOpened', reward: { crates: [{ type: 'legendary', count: 3 }], coins: 1900, gems: 95, shards: 8 }, difficulty: 'hard', duration: 18000000 },
  
  // Invite Tasks (Legendary rewards!)
  { id: 'pt53', name: 'New Friend', description: 'invite 1 new member who completes !start', type: 'invites', requirement: 1, field: 'invitesCompleted', reward: { crates: [{ type: 'legendary', count: 1 }], coins: 500, gems: 25 }, difficulty: 'medium', duration: 18000000 },
  { id: 'pt54', name: 'Recruiter', description: 'invite 2 new members who complete !start', type: 'invites', requirement: 2, field: 'invitesCompleted', reward: { crates: [{ type: 'legendary', count: 2 }], coins: 1500, gems: 75, shards: 4 }, difficulty: 'hard', duration: 18000000 },
  { id: 'pt55', name: 'Community Builder', description: 'invite 3 new members who complete !start', type: 'invites', requirement: 3, field: 'invitesCompleted', reward: { crates: [{ type: 'legendary', count: 3 }, { type: 'tyrant', count: 1 }], coins: 3000, gems: 150, shards: 7 }, difficulty: 'hard', duration: 18000000 },
  { id: 'pt56', name: 'Ambassador', description: 'invite 4 new members who complete !start', type: 'invites', requirement: 4, field: 'invitesCompleted', reward: { crates: [{ type: 'legendary', count: 4 }, { type: 'tyrant', count: 2 }], coins: 4500, gems: 225, shards: 10 }, difficulty: 'hard', duration: 18000000 },
  { id: 'pt57', name: 'Growth Master', description: 'invite 5 new members who complete !start', type: 'invites', requirement: 5, field: 'invitesCompleted', reward: { crates: [{ type: 'legendary', count: 5 }, { type: 'tyrant', count: 3 }], coins: 6000, gems: 300, shards: 15 }, difficulty: 'hard', duration: 18000000 },
];

// Human-like message templates
const MESSAGE_TEMPLATES = {
  // For inactive players
  taskAssignment: [
    "Hey! 👋 I noticed you haven't been around much lately. Wanna try something fun? {task} within the next {time}! I'll hook you up with {reward} when you're done 😊",
    "What's up! 🌟 Got a little challenge for you - {task} in the next {time}. Complete it and you'll get {reward}! Let's go! 💪",
    "Heyyy! Miss seeing you around 😄 Quick task for you: {task} before {time} runs out. Finish it and {reward} is all yours!",
    "Yo! 🎮 Feeling up for a challenge? Try to {task} within {time}. You'll earn {reward} when you nail it!",
    "Hey there! 👾 Got something exciting for you - {task} in the next {time}! Complete it and score {reward}. You got this!",
    "Hi! ✨ Haven't seen you in a bit! Here's a fun task: {task} within {time}. Rewards waiting for you: {reward} 🎁",
    "Sup! 🔥 Quick one for you - {task} before {time} is up! Finish and grab {reward}. Easy peasy!",
    "Hello! 🌈 Ready for some action? {task} within {time} and you'll get {reward}. Let's make it happen!",
    "Hey friend! 💫 Got a special task just for you: {task} in {time}. Complete it for {reward}!",
    "What's good! 🎯 Here's your mission: {task} within {time}. Rewards: {reward}. Go get 'em!"
  ],
  // For active players - exclusive, special feeling
  exclusiveActive: [
    "Psst... 🤫 Don't tell anyone, but I've got something special just for you: {task} in {time}. Exclusive rewards: {reward}! This is between us 😉",
    "Hey you! ✨ You're one of my favorite players, so here's an exclusive quest: {task} within {time}. Complete it for {reward}. Don't share this with others! 🎁",
    "Secret mission alert! 🔐 Only sharing this with you - {task} in {time} and get {reward}. Keep it hush! 😊",
    "VIP task incoming! 👑 Because you're awesome, you get this exclusive challenge: {task} within {time} for {reward}. Just for you!",
    "Shhhh! 🤐 Special quest unlocked just for YOU: {task} in {time}. Rewards: {reward}. Don't let others know!",
    "Private message! 💌 I picked you specifically for this: {task} within {time}, earn {reward}. Our little secret!",
    "Top secret! 🎯 This is a premium quest only for select players like you: {task} in {time}. Get {reward}! Keep it quiet 😉",
    "Exclusive access! ⭐ You've been chosen for this special task: {task} within {time}. Reward: {reward}. Don't spread the word!",
    "Between us... 🤝 Got a unique challenge made just for you: {task} in {time} for {reward}. This stays between you and me!",
    "Elite quest! 💎 Only sending this to special players - {task} within {time}, claim {reward}. Keep this exclusive!"
  ],
  taskComplete: [
    "Yesss! 🎉 You crushed it! Just sent you {reward}. That was awesome! 🔥",
    "Amazing work! 💪 {reward} is now yours! You're killing it today!",
    "Boom! 🌟 Task complete! Added {reward} to your account. Nice job!",
    "You did it! 🎊 {reward} is all yours now. Keep up the great work!",
    "Perfect! ✨ {reward} just landed in your account. You're on fire! 🔥",
    "Nailed it! 🎯 {reward} added! That was fast, impressive!",
    "Awesome! 🚀 Task done! Here's your {reward}. You rock!",
    "Way to go! 🌈 {reward} is yours! Love seeing you active!",
    "Incredible! 💫 Just gave you {reward}. Keep this energy up!",
    "YES! 🎮 Task completed! {reward} delivered! You're amazing!"
  ],
  taskTimeout: [
    "Ahh, no worries! ⏰ Time ran out on that task. But hey, there'll be more chances soon! Keep an eye out 👀",
    "Oof, time's up! ⌛ Couldn't finish that one, but it's all good! Another task coming your way soon 😊",
    "Time flew by! 🕐 Missed the window on this one, but don't stress - more opportunities coming!",
    "Dang, ran out of time! ⏰ No biggie though! I'll send you another task soon. Stay tuned!",
    "Timer expired! ⌛ It happens to the best of us! Watch for the next one 👊",
    "Time's up on this one! ⏰ All good though - plenty more tasks where that came from!",
    "Aww, missed the deadline! ⏱️ No worries, I'll hit you up with another task soon!",
    "Clock ran out! ⏰ It's totally fine! More chances coming your way!",
    "Time expired! ⌛ Hey, life gets busy! Next task is on the way 🌟",
    "Oops, time's up! ⏰ Don't sweat it! Another opportunity is coming soon!"
  ],
  reminderAfter5: [
    "Hey! 👋 I've sent you a few tasks but haven't heard back. Everything okay? Got a new one for you: {task} in {time}. {reward} waiting! 💪",
    "Hiii! 🌟 Just checking in - noticed you haven't tackled the recent tasks. Here's a fresh one: {task} within {time} for {reward}!",
    "Yo! 🎮 Been a minute! Sent a few tasks your way. Got another one: {task} in {time}. You'll get {reward}!",
    "Hey there! ✨ Haven't seen you jump on the last few tasks. No pressure! But here's a new one: {task} within {time} for {reward}!",
    "What's up! 🔥 Looks like the recent tasks got buried. Here's another shot: {task} in {time}! {reward} is yours if you complete it!"
  ]
};

// Initialize personalized task data for users
function initializePersonalizedTaskData(userData) {
  if (!userData.personalizedTasks) {
    userData.personalizedTasks = {
      currentTask: null,
      taskStartTime: null,
      taskProgress: {},
      completedTasks: [],
      ignoredTaskCount: 0,
      lastTaskSent: null,
      isActive: true, // Admin can toggle this
      totalCompleted: 0,
      totalMissed: 0,
      invitedBy: null, // Who invited this user
      invitees: [], // Array of {userId, joinedAt, completedStartAt}
      inviteCount: 0 // Total successful invites
    };
  }
  
  // Backfill new fields for existing users
  if (userData.personalizedTasks.invitedBy === undefined) userData.personalizedTasks.invitedBy = null;
  if (!userData.personalizedTasks.invitees) userData.personalizedTasks.invitees = [];
  if (userData.personalizedTasks.inviteCount === undefined) userData.personalizedTasks.inviteCount = 0;
  
  return userData.personalizedTasks;
}

// Get random task (avoid recent duplicates)
function getRandomTask(userData) {
  const ptData = initializePersonalizedTaskData(userData);
  const recentTaskIds = ptData.completedTasks.slice(-10).map(t => t.taskId);
  
  // Filter out recently completed tasks
  const availableTasks = PERSONALIZED_TASKS.filter(task => !recentTaskIds.includes(task.id));
  
  if (availableTasks.length === 0) {
    return PERSONALIZED_TASKS[Math.floor(Math.random() * PERSONALIZED_TASKS.length)];
  }
  
  return availableTasks[Math.floor(Math.random() * availableTasks.length)];
}

// Format reward text
function formatReward(reward) {
  const parts = [];
  
  // Format crates
  if (reward.crates && reward.crates.length > 0) {
    for (const crate of reward.crates) {
      const crateType = crate.type.charAt(0).toUpperCase() + crate.type.slice(1);
      parts.push(`${crate.count}x ${crateType} Crate${crate.count > 1 ? 's' : ''}`);
    }
  }
  
  if (reward.coins) parts.push(`${reward.coins} coins`);
  if (reward.gems) parts.push(`${reward.gems} gems`);
  if (reward.shards) parts.push(`${reward.shards} shards`);
  return parts.join(', ');
}

// Format time remaining
function formatTime(ms) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    return 'a few moments';
  }
}

// Send task DM to user
async function sendPersonalizedTask(client, userId, data) {
  const userData = data.users[userId];
  if (!userData) return;
  
  const ptData = initializePersonalizedTaskData(userData);
  
  // Check if system is active for this user
  if (!ptData.isActive) return;
  
  // Don't send if they already have an active task
  if (ptData.currentTask && Date.now() < ptData.taskStartTime + ptData.currentTask.duration) {
    return;
  }
  
  try {
    const user = await client.users.fetch(userId);
    if (!user) return;
    
    // Check if we should ping (only after 5 ignored tasks)
    const shouldPing = ptData.ignoredTaskCount >= 5;
    
    // Check if user is active (last activity within 2 hours)
    const lastActivity = userData.lastActivity || 0;
    const timeSinceActivity = Date.now() - lastActivity;
    const isActive = timeSinceActivity < (2 * 3600000); // 2 hours
    
    // Get random task
    const task = getRandomTask(userData);
    
    // Select message template based on activity status
    let messageTemplate;
    if (shouldPing) {
      messageTemplate = MESSAGE_TEMPLATES.reminderAfter5[Math.floor(Math.random() * MESSAGE_TEMPLATES.reminderAfter5.length)];
      ptData.ignoredTaskCount = 0; // Reset after pinging
    } else if (isActive) {
      // Use exclusive messaging for active players
      messageTemplate = MESSAGE_TEMPLATES.exclusiveActive[Math.floor(Math.random() * MESSAGE_TEMPLATES.exclusiveActive.length)];
    } else {
      // Use regular messaging for inactive players
      messageTemplate = MESSAGE_TEMPLATES.taskAssignment[Math.floor(Math.random() * MESSAGE_TEMPLATES.taskAssignment.length)];
    }
    
    // Format message
    const message = messageTemplate
      .replace('{task}', task.description)
      .replace('{time}', formatTime(task.duration))
      .replace('{reward}', formatReward(task.reward));
    
    // Initialize task progress tracking
    ptData.taskProgress = {
      dropsCaught: 0,
      battlesWon: 0,
      cratesOpened: 0,
      levelsGained: 0,
      messagesSent: 0,
      tradesCompleted: 0,
      coinTradesCompleted: 0,
      gemTradesCompleted: 0,
      userBattles: 0,
      anyTrade: 0,
      invitesCompleted: 0
    };
    
    // Set current task
    ptData.currentTask = task;
    ptData.taskStartTime = Date.now();
    ptData.lastTaskSent = Date.now();
    
    await saveData(data);
    
    // Send DM
    await user.send(message);
    
    console.log(`📬 Personalized task sent to ${userData.username}: ${task.name}`);
    
  } catch (error) {
    console.error(`Failed to send personalized task to ${userId}:`, error.message);
  }
}

// Check task progress and completion
function checkTaskProgress(userData, field, incrementBy = 1) {
  const ptData = userData.personalizedTasks;
  if (!ptData || !ptData.currentTask) return null;
  
  // Check if task expired
  const timeElapsed = Date.now() - ptData.taskStartTime;
  if (timeElapsed > ptData.currentTask.duration) {
    return null; // Task expired
  }
  
  // Update progress
  if (ptData.taskProgress[field] !== undefined) {
    ptData.taskProgress[field] += incrementBy;
  }
  
  // Check completion
  const currentTask = ptData.currentTask;
  const currentProgress = ptData.taskProgress[currentTask.field] || 0;
  
  if (currentProgress >= currentTask.requirement) {
    return currentTask; // Task completed!
  }
  
  return null;
}

// Award task completion
async function completePersonalizedTask(client, userId, data, task) {
  const userData = data.users[userId];
  const ptData = userData.personalizedTasks;
  
  // Give rewards
  if (task.reward.coins) {
    userData.coins = (userData.coins || 0) + task.reward.coins;
  }
  if (task.reward.gems) {
    userData.gems = (userData.gems || 0) + task.reward.gems;
  }
  if (task.reward.shards) {
    userData.shards = (userData.shards || 0) + task.reward.shards;
  }
  
  // Give crate rewards
  if (task.reward.crates && task.reward.crates.length > 0) {
    if (!userData.crates) {
      userData.crates = { bronze: 0, silver: 0, gold: 0, emerald: 0, legendary: 0, tyrant: 0 };
    }
    for (const crate of task.reward.crates) {
      userData.crates[crate.type] = (userData.crates[crate.type] || 0) + crate.count;
    }
  }
  
  // Record completion
  ptData.completedTasks.push({
    taskId: task.id,
    taskName: task.name,
    completedAt: Date.now()
  });
  ptData.totalCompleted += 1;
  ptData.ignoredTaskCount = 0; // Reset ignored count on completion
  
  // Clear current task
  ptData.currentTask = null;
  ptData.taskStartTime = null;
  ptData.taskProgress = {};
  
  // CRITICAL: Use immediate save for reward distribution to ensure MongoDB persistence
  await saveDataImmediate(data);
  console.log(`💾 Saved personalized task rewards to database for ${userData.username}`);
  
  try {
    const user = await client.users.fetch(userId);
    if (user) {
      const messageTemplate = MESSAGE_TEMPLATES.taskComplete[Math.floor(Math.random() * MESSAGE_TEMPLATES.taskComplete.length)];
      const message = messageTemplate.replace('{reward}', formatReward(task.reward));
      await user.send(message);
      console.log(`✅ ${userData.username} completed personalized task: ${task.name}`);
    }
  } catch (error) {
    console.error(`Failed to send completion message to ${userId}:`, error.message);
  }
}

// Check for expired tasks
async function checkExpiredTasks(client, data) {
  for (const userId in data.users) {
    const userData = data.users[userId];
    const ptData = userData.personalizedTasks;
    
    if (!ptData || !ptData.currentTask) continue;
    
    const timeElapsed = Date.now() - ptData.taskStartTime;
    
    // Task expired
    if (timeElapsed > ptData.currentTask.duration) {
      const expiredTask = ptData.currentTask;
      
      // Update stats
      ptData.totalMissed += 1;
      ptData.ignoredTaskCount += 1;
      
      // Clear task
      ptData.currentTask = null;
      ptData.taskStartTime = null;
      ptData.taskProgress = {};
      
      await saveData(data);
      
      try {
        const user = await client.users.fetch(userId);
        if (user) {
          const messageTemplate = MESSAGE_TEMPLATES.taskTimeout[Math.floor(Math.random() * MESSAGE_TEMPLATES.taskTimeout.length)];
          await user.send(messageTemplate);
          console.log(`⏰ ${userData.username} missed personalized task: ${expiredTask.name}`);
        }
      } catch (error) {
        console.error(`Failed to send timeout message to ${userId}:`, error.message);
      }
    }
  }
}

// Get eligible users for tasks (both active and inactive)
function getEligibleUsers(data) {
  const eligibleUsers = [];
  const now = Date.now();
  
  for (const userId in data.users) {
    const userData = data.users[userId];
    const ptData = initializePersonalizedTaskData(userData);
    
    if (!ptData.isActive) continue; // Skip if disabled by admin
    
    // Check last activity
    const lastActivity = userData.lastActivity || 0;
    const timeSinceActivity = now - lastActivity;
    const isActive = timeSinceActivity < (2 * 3600000); // Active if within 2 hours
    
    // Check if enough time passed since last task
    const timeSinceLastTask = now - (ptData.lastTaskSent || 0);
    
    let minTimeBetweenTasks;
    if (isActive) {
      // Active players: Send task every 3 hours minimum
      minTimeBetweenTasks = 3 * 3600000;
    } else {
      // Inactive players (6+ hours idle): Send task every 2 hours minimum
      const inactiveThreshold = 6 * 3600000;
      if (timeSinceActivity < inactiveThreshold) continue; // Not inactive enough yet
      minTimeBetweenTasks = 2 * 3600000;
    }
    
    // User is ready for a task
    if (timeSinceLastTask > minTimeBetweenTasks) {
      eligibleUsers.push(userId);
    }
  }
  
  return eligibleUsers;
}

// Track invite completion when invited user completes !start
function trackInviteCompletion(inviterUserId, inviteeUserId, data) {
  const inviter = data.users[inviterUserId];
  const invitee = data.users[inviteeUserId];
  
  if (!inviter || !invitee) return false;
  
  const inviterPT = initializePersonalizedTaskData(inviter);
  const inviteePT = initializePersonalizedTaskData(invitee);
  
  // Mark invitee's inviter
  if (!inviteePT.invitedBy) {
    inviteePT.invitedBy = inviterUserId;
  }
  
  // Find the invitee in inviter's list and mark completion
  const inviteeRecord = inviterPT.invitees.find(inv => inv.userId === inviteeUserId);
  if (inviteeRecord && !inviteeRecord.completedStartAt) {
    inviteeRecord.completedStartAt = Date.now();
    inviterPT.inviteCount += 1;
    return true;
  }
  
  return false;
}

// Register a new invite (call when someone uses invite link/code)
function registerInvite(inviterUserId, inviteeUserId, data) {
  const inviter = data.users[inviterUserId];
  const invitee = data.users[inviteeUserId];
  
  if (!inviter || !invitee) return false;
  
  const inviterPT = initializePersonalizedTaskData(inviter);
  const inviteePT = initializePersonalizedTaskData(invitee);
  
  // Prevent self-invite
  if (inviterUserId === inviteeUserId) return false;
  
  // Lock invitedBy after first assignment
  if (inviteePT.invitedBy) return false;
  
  inviteePT.invitedBy = inviterUserId;
  inviterPT.invitees.push({
    userId: inviteeUserId,
    joinedAt: Date.now(),
    completedStartAt: null
  });
  
  return true;
}

// Toggle personalized tasks for a user
function togglePersonalizedTasks(userId, data, enabled) {
  const userData = data.users[userId];
  if (!userData) return false;
  
  const ptData = initializePersonalizedTaskData(userData);
  ptData.isActive = enabled;
  
  return true;
}

// Get task stats for a user
function getTaskStats(userData) {
  const ptData = initializePersonalizedTaskData(userData);
  
  return {
    totalCompleted: ptData.totalCompleted || 0,
    totalMissed: ptData.totalMissed || 0,
    currentTask: ptData.currentTask ? ptData.currentTask.name : 'None',
    timeRemaining: ptData.currentTask ? Math.max(0, ptData.taskStartTime + ptData.currentTask.duration - Date.now()) : 0,
    isActive: ptData.isActive
  };
}

module.exports = {
  PERSONALIZED_TASKS,
  initializePersonalizedTaskData,
  sendPersonalizedTask,
  checkTaskProgress,
  completePersonalizedTask,
  checkExpiredTasks,
  getEligibleUsers,
  trackInviteCompletion,
  registerInvite,
  togglePersonalizedTasks,
  getTaskStats,
  formatReward,
  formatTime
};
