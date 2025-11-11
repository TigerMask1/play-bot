const { saveData } = require('./dataManager.js');

// Task pool with 50+ variations
const PERSONALIZED_TASKS = [
  // Easy Tasks (1 hour)
  { id: 'pt1', name: 'Quick Drop', description: 'catch 1 drop', type: 'drops', requirement: 1, field: 'dropsCaught', reward: { coins: 150, gems: 8 }, difficulty: 'easy', duration: 3600000 },
  { id: 'pt2', name: 'First Win', description: 'win 1 battle against AI', type: 'battles', requirement: 1, field: 'battlesWon', reward: { coins: 200, gems: 10 }, difficulty: 'easy', duration: 3600000 },
  { id: 'pt3', name: 'Open Up', description: 'open 1 crate', type: 'crates', requirement: 1, field: 'cratesOpened', reward: { coins: 100, gems: 5 }, difficulty: 'easy', duration: 3600000 },
  { id: 'pt4', name: 'Level Boost', description: 'level up your character by 1', type: 'leveling', requirement: 1, field: 'levelsGained', reward: { coins: 180, gems: 9 }, difficulty: 'easy', duration: 3600000 },
  { id: 'pt5', name: 'Chat Time', description: 'send 5 messages', type: 'messages', requirement: 5, field: 'messagesSent', reward: { coins: 120, gems: 6 }, difficulty: 'easy', duration: 3600000 },
  { id: 'pt6', name: 'Trade Start', description: 'trade some coins with another player', type: 'trading', requirement: 1, field: 'coinTradesCompleted', reward: { coins: 150, gems: 8 }, difficulty: 'easy', duration: 3600000 },
  { id: 'pt7', name: 'Gem Trader', description: 'trade some gems with another player', type: 'trading', requirement: 1, field: 'gemTradesCompleted', reward: { coins: 200, gems: 10 }, difficulty: 'easy', duration: 3600000 },
  { id: 'pt8', name: 'Quick Battle', description: 'battle against any user', type: 'battles', requirement: 1, field: 'userBattles', reward: { coins: 250, gems: 12 }, difficulty: 'easy', duration: 3600000 },
  { id: 'pt9', name: 'Double Up', description: 'catch 2 drops', type: 'drops', requirement: 2, field: 'dropsCaught', reward: { coins: 220, gems: 11 }, difficulty: 'easy', duration: 3600000 },
  { id: 'pt10', name: 'Crate Fever', description: 'open 2 crates', type: 'crates', requirement: 2, field: 'cratesOpened', reward: { coins: 180, gems: 9 }, difficulty: 'easy', duration: 3600000 },
  
  // Medium Tasks (2-3 hours)
  { id: 'pt11', name: 'Drop Hunter', description: 'catch 5 drops', type: 'drops', requirement: 5, field: 'dropsCaught', reward: { coins: 350, gems: 18, shards: 1 }, difficulty: 'medium', duration: 7200000 },
  { id: 'pt12', name: 'Battle Streak', description: 'win 3 battles', type: 'battles', requirement: 3, field: 'battlesWon', reward: { coins: 450, gems: 22, shards: 1 }, difficulty: 'medium', duration: 7200000 },
  { id: 'pt13', name: 'Crate Opener', description: 'open 3 crates', type: 'crates', requirement: 3, field: 'cratesOpened', reward: { coins: 300, gems: 15, shards: 1 }, difficulty: 'medium', duration: 7200000 },
  { id: 'pt14', name: 'Level Rush', description: 'gain 3 levels on any character', type: 'leveling', requirement: 3, field: 'levelsGained', reward: { coins: 380, gems: 19, shards: 1 }, difficulty: 'medium', duration: 7200000 },
  { id: 'pt15', name: 'Social Butterfly', description: 'send 15 messages', type: 'messages', requirement: 15, field: 'messagesSent', reward: { coins: 280, gems: 14 }, difficulty: 'medium', duration: 7200000 },
  { id: 'pt16', name: 'Trade Master', description: 'complete 2 trades', type: 'trading', requirement: 2, field: 'tradesCompleted', reward: { coins: 400, gems: 20, shards: 1 }, difficulty: 'medium', duration: 7200000 },
  { id: 'pt17', name: 'PvP Warrior', description: 'battle 2 different users', type: 'battles', requirement: 2, field: 'userBattles', reward: { coins: 500, gems: 25, shards: 2 }, difficulty: 'medium', duration: 7200000 },
  { id: 'pt18', name: 'Drop Collector', description: 'catch 8 drops', type: 'drops', requirement: 8, field: 'dropsCaught', reward: { coins: 420, gems: 21, shards: 1 }, difficulty: 'medium', duration: 10800000 },
  { id: 'pt19', name: 'Crate Spree', description: 'open 5 crates', type: 'crates', requirement: 5, field: 'cratesOpened', reward: { coins: 500, gems: 25, shards: 2 }, difficulty: 'medium', duration: 10800000 },
  { id: 'pt20', name: 'Win Machine', description: 'win 5 battles', type: 'battles', requirement: 5, field: 'battlesWon', reward: { coins: 600, gems: 30, shards: 2 }, difficulty: 'medium', duration: 10800000 },
  
  // Hard Tasks (5 hours)
  { id: 'pt21', name: 'Drop Master', description: 'catch 15 drops', type: 'drops', requirement: 15, field: 'dropsCaught', reward: { coins: 800, gems: 40, shards: 3 }, difficulty: 'hard', duration: 18000000 },
  { id: 'pt22', name: 'Battle Champion', description: 'win 10 battles', type: 'battles', requirement: 10, field: 'battlesWon', reward: { coins: 1000, gems: 50, shards: 4 }, difficulty: 'hard', duration: 18000000 },
  { id: 'pt23', name: 'Crate Maniac', description: 'open 10 crates', type: 'crates', requirement: 10, field: 'cratesOpened', reward: { coins: 900, gems: 45, shards: 3 }, difficulty: 'hard', duration: 18000000 },
  { id: 'pt24', name: 'Power Training', description: 'gain 5 levels', type: 'leveling', requirement: 5, field: 'levelsGained', reward: { coins: 750, gems: 38, shards: 3 }, difficulty: 'hard', duration: 18000000 },
  { id: 'pt25', name: 'Chatterbox', description: 'send 30 messages', type: 'messages', requirement: 30, field: 'messagesSent', reward: { coins: 600, gems: 30, shards: 2 }, difficulty: 'hard', duration: 18000000 },
  { id: 'pt26', name: 'Trading Tycoon', description: 'complete 5 trades', type: 'trading', requirement: 5, field: 'tradesCompleted', reward: { coins: 850, gems: 43, shards: 3 }, difficulty: 'hard', duration: 18000000 },
  { id: 'pt27', name: 'PvP Expert', description: 'battle 5 different users', type: 'battles', requirement: 5, field: 'userBattles', reward: { coins: 1100, gems: 55, shards: 4 }, difficulty: 'hard', duration: 18000000 },
  { id: 'pt28', name: 'Drop Legend', description: 'catch 25 drops', type: 'drops', requirement: 25, field: 'dropsCaught', reward: { coins: 1200, gems: 60, shards: 5 }, difficulty: 'hard', duration: 18000000 },
  { id: 'pt29', name: 'Elite Trainer', description: 'gain 8 levels', type: 'leveling', requirement: 8, field: 'levelsGained', reward: { coins: 1000, gems: 50, shards: 4 }, difficulty: 'hard', duration: 18000000 },
  { id: 'pt30', name: 'Conversation King', description: 'send 50 messages', type: 'messages', requirement: 50, field: 'messagesSent', reward: { coins: 900, gems: 45, shards: 3 }, difficulty: 'hard', duration: 18000000 },
  
  // Variations with mixed objectives
  { id: 'pt31', name: 'Warm Up', description: 'win 2 battles', type: 'battles', requirement: 2, field: 'battlesWon', reward: { coins: 300, gems: 15 }, difficulty: 'easy', duration: 3600000 },
  { id: 'pt32', name: 'Triple Drop', description: 'catch 3 drops', type: 'drops', requirement: 3, field: 'dropsCaught', reward: { coins: 250, gems: 13 }, difficulty: 'easy', duration: 3600000 },
  { id: 'pt33', name: 'Crate Collector', description: 'open 4 crates', type: 'crates', requirement: 4, field: 'cratesOpened', reward: { coins: 350, gems: 18 }, difficulty: 'medium', duration: 7200000 },
  { id: 'pt34', name: 'Message Sprint', description: 'send 10 messages', type: 'messages', requirement: 10, field: 'messagesSent', reward: { coins: 200, gems: 10 }, difficulty: 'easy', duration: 3600000 },
  { id: 'pt35', name: 'Level Up', description: 'gain 2 levels', type: 'leveling', requirement: 2, field: 'levelsGained', reward: { coins: 280, gems: 14 }, difficulty: 'easy', duration: 3600000 },
  { id: 'pt36', name: 'Trade Deal', description: 'complete 3 trades', type: 'trading', requirement: 3, field: 'tradesCompleted', reward: { coins: 550, gems: 28, shards: 2 }, difficulty: 'medium', duration: 10800000 },
  { id: 'pt37', name: 'Battle Pro', description: 'win 7 battles', type: 'battles', requirement: 7, field: 'battlesWon', reward: { coins: 750, gems: 38, shards: 3 }, difficulty: 'hard', duration: 18000000 },
  { id: 'pt38', name: 'Drop Enthusiast', description: 'catch 12 drops', type: 'drops', requirement: 12, field: 'dropsCaught', reward: { coins: 650, gems: 33, shards: 2 }, difficulty: 'medium', duration: 10800000 },
  { id: 'pt39', name: 'Crate Hunter', description: 'open 7 crates', type: 'crates', requirement: 7, field: 'cratesOpened', reward: { coins: 700, gems: 35, shards: 3 }, difficulty: 'hard', duration: 18000000 },
  { id: 'pt40', name: 'Social Star', description: 'send 20 messages', type: 'messages', requirement: 20, field: 'messagesSent', reward: { coins: 400, gems: 20, shards: 1 }, difficulty: 'medium', duration: 7200000 },
  { id: 'pt41', name: 'Quick Trader', description: 'complete 1 coin or gem trade', type: 'trading', requirement: 1, field: 'anyTrade', reward: { coins: 175, gems: 9 }, difficulty: 'easy', duration: 3600000 },
  { id: 'pt42', name: 'Battle Rush', description: 'win 4 battles', type: 'battles', requirement: 4, field: 'battlesWon', reward: { coins: 520, gems: 26, shards: 2 }, difficulty: 'medium', duration: 10800000 },
  { id: 'pt43', name: 'Drop Sprint', description: 'catch 6 drops', type: 'drops', requirement: 6, field: 'dropsCaught', reward: { coins: 380, gems: 19, shards: 1 }, difficulty: 'medium', duration: 7200000 },
  { id: 'pt44', name: 'Level Power', description: 'gain 4 levels', type: 'leveling', requirement: 4, field: 'levelsGained', reward: { coins: 480, gems: 24, shards: 2 }, difficulty: 'medium', duration: 10800000 },
  { id: 'pt45', name: 'Crate Fever II', description: 'open 6 crates', type: 'crates', requirement: 6, field: 'cratesOpened', reward: { coins: 600, gems: 30, shards: 2 }, difficulty: 'medium', duration: 10800000 },
  { id: 'pt46', name: 'Message Marathon', description: 'send 40 messages', type: 'messages', requirement: 40, field: 'messagesSent', reward: { coins: 750, gems: 38, shards: 3 }, difficulty: 'hard', duration: 18000000 },
  { id: 'pt47', name: 'Ultimate Trader', description: 'complete 7 trades', type: 'trading', requirement: 7, field: 'tradesCompleted', reward: { coins: 1050, gems: 53, shards: 4 }, difficulty: 'hard', duration: 18000000 },
  { id: 'pt48', name: 'PvP Master', description: 'battle 3 users', type: 'battles', requirement: 3, field: 'userBattles', reward: { coins: 650, gems: 33, shards: 2 }, difficulty: 'medium', duration: 10800000 },
  { id: 'pt49', name: 'Elite Battler', description: 'win 12 battles', type: 'battles', requirement: 12, field: 'battlesWon', reward: { coins: 1300, gems: 65, shards: 5 }, difficulty: 'hard', duration: 18000000 },
  { id: 'pt50', name: 'Drop Champion', description: 'catch 20 drops', type: 'drops', requirement: 20, field: 'dropsCaught', reward: { coins: 1000, gems: 50, shards: 4 }, difficulty: 'hard', duration: 18000000 },
  { id: 'pt51', name: 'Level Legend', description: 'gain 10 levels', type: 'leveling', requirement: 10, field: 'levelsGained', reward: { coins: 1400, gems: 70, shards: 6 }, difficulty: 'hard', duration: 18000000 },
  { id: 'pt52', name: 'Crate King', description: 'open 12 crates', type: 'crates', requirement: 12, field: 'cratesOpened', reward: { coins: 1100, gems: 55, shards: 5 }, difficulty: 'hard', duration: 18000000 },
];

// Human-like message templates
const MESSAGE_TEMPLATES = {
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
      totalMissed: 0
    };
  }
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
    
    // Get random task
    const task = getRandomTask(userData);
    
    // Select message template
    let messageTemplate;
    if (shouldPing) {
      messageTemplate = MESSAGE_TEMPLATES.reminderAfter5[Math.floor(Math.random() * MESSAGE_TEMPLATES.reminderAfter5.length)];
      ptData.ignoredTaskCount = 0; // Reset after pinging
    } else {
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
      anyTrade: 0
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
  
  await saveData(data);
  
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

// Get inactive users (haven't been active in last 24 hours)
function getInactiveUsers(data, minInactiveHours = 6) {
  const inactiveUsers = [];
  const now = Date.now();
  const inactiveThreshold = minInactiveHours * 3600000;
  
  for (const userId in data.users) {
    const userData = data.users[userId];
    const ptData = initializePersonalizedTaskData(userData);
    
    if (!ptData.isActive) continue; // Skip if disabled by admin
    
    // Check last activity (message, battle, drop, etc)
    const lastActivity = userData.lastActivity || 0;
    const timeSinceActivity = now - lastActivity;
    
    // Check if enough time passed since last task
    const timeSinceLastTask = now - (ptData.lastTaskSent || 0);
    const minTimeBetweenTasks = 2 * 3600000; // 2 hours minimum
    
    // User is inactive and ready for a task
    if (timeSinceActivity > inactiveThreshold && timeSinceLastTask > minTimeBetweenTasks) {
      inactiveUsers.push(userId);
    }
  }
  
  return inactiveUsers;
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
  getInactiveUsers,
  togglePersonalizedTasks,
  getTaskStats,
  formatReward,
  formatTime
};
