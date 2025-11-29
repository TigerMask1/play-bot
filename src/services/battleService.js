const { getCollection, COLLECTIONS } = require('../infrastructure/database');
const { createBattleSchema } = require('../models/schemas');
const { getServerSettings } = require('./serverSettingsService');
const { getServerProfile, updateServerProfile } = require('./profileService');
const { updateServerBalance, updateOfficialBalance } = require('./economyService');
const { grantXP } = require('./workService');
const logger = require('../core/logger');

const activeBattles = new Map();

async function checkBattleEligibility(userId, serverId) {
  const settings = await getServerSettings(serverId);
  if (!settings?.battleSettings?.enabled) {
    return { eligible: false, reason: 'Battles are disabled on this server' };
  }
  
  const profile = await getServerProfile(userId, serverId);
  if (!profile?.started) {
    return { eligible: false, reason: 'You need to use !start first' };
  }
  
  if (!profile.characters || profile.characters.length === 0) {
    return { eligible: false, reason: 'You need at least one character to battle' };
  }
  
  const lastBattle = profile.cooldowns?.battle;
  const cooldown = settings.battleSettings.cooldown * 1000;
  
  if (lastBattle && (Date.now() - new Date(lastBattle).getTime()) < cooldown) {
    const remaining = Math.ceil((cooldown - (Date.now() - new Date(lastBattle).getTime())) / 1000);
    return { eligible: false, reason: `Battle on cooldown (${remaining}s remaining)` };
  }
  
  const existingBattle = Array.from(activeBattles.values()).find(
    b => (b.challengerId === userId || b.defenderId === userId) && b.serverId === serverId
  );
  
  if (existingBattle) {
    return { eligible: false, reason: 'You are already in a battle' };
  }
  
  return { eligible: true, profile };
}

async function challengePlayer(challengerId, defenderId, serverId) {
  const challengerCheck = await checkBattleEligibility(challengerId, serverId);
  if (!challengerCheck.eligible) {
    return { success: false, error: challengerCheck.reason };
  }
  
  const defenderCheck = await checkBattleEligibility(defenderId, serverId);
  if (!defenderCheck.eligible) {
    return { success: false, error: `Opponent: ${defenderCheck.reason}` };
  }
  
  const battleId = `battle_${serverId}_${Date.now()}`;
  const battle = {
    id: battleId,
    ...createBattleSchema(challengerId, defenderId, serverId),
    challengerProfile: challengerCheck.profile,
    defenderProfile: defenderCheck.profile,
    expiresAt: new Date(Date.now() + 60 * 1000)
  };
  
  activeBattles.set(battleId, battle);
  
  setTimeout(() => {
    const b = activeBattles.get(battleId);
    if (b && b.status === 'pending') {
      activeBattles.delete(battleId);
    }
  }, 60 * 1000);
  
  return { success: true, battle };
}

async function acceptChallenge(battleId, defenderId) {
  const battle = activeBattles.get(battleId);
  
  if (!battle) {
    return { success: false, error: 'Battle not found or expired' };
  }
  
  if (battle.defenderId !== defenderId) {
    return { success: false, error: 'You are not the challenged player' };
  }
  
  if (battle.status !== 'pending') {
    return { success: false, error: 'Battle is not pending' };
  }
  
  battle.status = 'team_selection';
  battle.startedAt = new Date();
  
  return { success: true, battle };
}

async function selectTeam(battleId, userId, team) {
  const battle = activeBattles.get(battleId);
  
  if (!battle) {
    return { success: false, error: 'Battle not found' };
  }
  
  const settings = await getServerSettings(battle.serverId);
  const maxTeamSize = settings.battleSettings?.maxTeamSize || 6;
  
  if (team.length > maxTeamSize) {
    return { success: false, error: `Team cannot exceed ${maxTeamSize} characters` };
  }
  
  if (team.length === 0) {
    return { success: false, error: 'You must select at least one character' };
  }
  
  const profile = userId === battle.challengerId ? battle.challengerProfile : battle.defenderProfile;
  const validTeam = team.every(charId => 
    profile.characters.some(c => c.userId === charId || c.slug === charId)
  );
  
  if (!validTeam) {
    return { success: false, error: 'Invalid character in team' };
  }
  
  const teamCharacters = team.map(charId => 
    profile.characters.find(c => c.userId === charId || c.slug === charId)
  );
  
  if (userId === battle.challengerId) {
    battle.challengerTeam = teamCharacters;
  } else {
    battle.defenderTeam = teamCharacters;
  }
  
  if (battle.challengerTeam.length > 0 && battle.defenderTeam.length > 0) {
    battle.status = 'active';
    battle.currentTurn = battle.challengerId;
    battle.turnNumber = 1;
    initializeBattleState(battle);
  }
  
  return { success: true, battle };
}

function initializeBattleState(battle) {
  battle.challengerState = {
    activeIndex: 0,
    team: battle.challengerTeam.map(char => ({
      ...char,
      currentHp: char.originalData?.baseStats?.hp || 100,
      currentEnergy: 100,
      status: [],
      statModifiers: { attack: 0, defense: 0, speed: 0 }
    }))
  };
  
  battle.defenderState = {
    activeIndex: 0,
    team: battle.defenderTeam.map(char => ({
      ...char,
      currentHp: char.originalData?.baseStats?.hp || 100,
      currentEnergy: 100,
      status: [],
      statModifiers: { attack: 0, defense: 0, speed: 0 }
    }))
  };
}

async function executeMove(battleId, userId, moveSlug, targetIndex = 0) {
  const battle = activeBattles.get(battleId);
  
  if (!battle || battle.status !== 'active') {
    return { success: false, error: 'Battle not active' };
  }
  
  if (battle.currentTurn !== userId) {
    return { success: false, error: 'Not your turn' };
  }
  
  const isChallenger = userId === battle.challengerId;
  const attackerState = isChallenger ? battle.challengerState : battle.defenderState;
  const defenderState = isChallenger ? battle.defenderState : battle.challengerState;
  
  const attacker = attackerState.team[attackerState.activeIndex];
  const defender = defenderState.team[defenderState.activeIndex];
  
  const move = attacker.moves?.find(m => m.slug === moveSlug) || {
    name: 'Tackle',
    type: 'normal',
    power: 40,
    accuracy: 100,
    energy: 10
  };
  
  if (attacker.currentEnergy < move.energy) {
    return { success: false, error: 'Not enough energy' };
  }
  
  const accuracyRoll = Math.random() * 100;
  const hit = accuracyRoll <= move.accuracy;
  
  let damage = 0;
  let log = '';
  
  if (hit) {
    const attackStat = (attacker.originalData?.baseStats?.attack || 50) + (attacker.statModifiers?.attack || 0);
    const defenseStat = (defender.originalData?.baseStats?.defense || 50) + (defender.statModifiers?.defense || 0);
    
    damage = Math.floor(((2 * attacker.level / 5 + 2) * move.power * attackStat / defenseStat) / 50 + 2);
    
    const variance = 0.85 + Math.random() * 0.15;
    damage = Math.floor(damage * variance);
    
    defender.currentHp = Math.max(0, defender.currentHp - damage);
    log = `${attacker.nickname || attacker.originalData?.name || 'Character'} used ${move.name} and dealt ${damage} damage!`;
  } else {
    log = `${attacker.nickname || attacker.originalData?.name || 'Character'} used ${move.name} but missed!`;
  }
  
  attacker.currentEnergy -= move.energy;
  
  battle.battleLog.push({
    turn: battle.turnNumber,
    attacker: userId,
    move: move.name,
    hit,
    damage,
    log
  });
  
  if (defender.currentHp <= 0) {
    const allFainted = defenderState.team.every(c => c.currentHp <= 0);
    
    if (allFainted) {
      return await endBattle(battleId, userId);
    } else {
      log += ` ${defender.nickname || defender.originalData?.name || 'Character'} fainted!`;
    }
  }
  
  battle.currentTurn = isChallenger ? battle.defenderId : battle.challengerId;
  battle.turnNumber++;
  
  return { success: true, battle, log, damage, hit };
}

async function switchCharacter(battleId, userId, characterIndex) {
  const battle = activeBattles.get(battleId);
  
  if (!battle || battle.status !== 'active') {
    return { success: false, error: 'Battle not active' };
  }
  
  const settings = await getServerSettings(battle.serverId);
  if (!settings.battleSettings?.rules?.allowSwitching) {
    return { success: false, error: 'Switching is not allowed in this server' };
  }
  
  const isChallenger = userId === battle.challengerId;
  const playerState = isChallenger ? battle.challengerState : battle.defenderState;
  
  if (characterIndex < 0 || characterIndex >= playerState.team.length) {
    return { success: false, error: 'Invalid character index' };
  }
  
  if (playerState.team[characterIndex].currentHp <= 0) {
    return { success: false, error: 'Cannot switch to a fainted character' };
  }
  
  playerState.activeIndex = characterIndex;
  
  battle.battleLog.push({
    turn: battle.turnNumber,
    attacker: userId,
    action: 'switch',
    log: `Switched to ${playerState.team[characterIndex].nickname || playerState.team[characterIndex].originalData?.name || 'Character'}!`
  });
  
  battle.currentTurn = isChallenger ? battle.defenderId : battle.challengerId;
  battle.turnNumber++;
  
  return { success: true, battle };
}

async function endBattle(battleId, winnerId) {
  const battle = activeBattles.get(battleId);
  
  if (!battle) {
    return { success: false, error: 'Battle not found' };
  }
  
  const settings = await getServerSettings(battle.serverId);
  const rewards = settings.battleSettings?.rewards || { winner: { coins: 50, xp: 25 }, loser: { coins: 10, xp: 10 } };
  
  const loserId = winnerId === battle.challengerId ? battle.defenderId : battle.challengerId;
  
  battle.status = 'completed';
  battle.winner = winnerId;
  battle.endedAt = new Date();
  battle.rewards = rewards;
  
  await updateServerBalance(winnerId, battle.serverId, 'primary', rewards.winner.coins, 'Battle victory');
  await updateServerBalance(loserId, battle.serverId, 'primary', rewards.loser.coins, 'Battle participation');
  
  await grantXP(winnerId, battle.serverId, rewards.winner.xp);
  await grantXP(loserId, battle.serverId, rewards.loser.xp);
  
  await updateServerProfile(winnerId, battle.serverId, {
    'cooldowns.battle': new Date(),
    $inc: { 'stats.battlesWon': 1 }
  });
  
  await updateServerProfile(loserId, battle.serverId, {
    'cooldowns.battle': new Date(),
    $inc: { 'stats.battlesLost': 1 }
  });
  
  const collection = await getCollection(COLLECTIONS.ECONOMY_TRANSACTIONS);
  await collection.insertOne({
    userId: userId,
    userId: userId,
    type: 'battle',
    result: winnerId === battle.challengerId ? 'win' : 'loss',
    opponent: loserId,
    rewards: winnerId === battle.challengerId ? rewards.winner : rewards.loser,
    battleLog: battle.battleLog,
    createdAt: new Date()
  });
  
  activeBattles.delete(battleId);
  
  return { success: true, battle, winner: winnerId, loser: loserId, rewards };
}

async function forfeitBattle(battleId, userId) {
  const battle = activeBattles.get(battleId);
  
  if (!battle) {
    return { success: false, error: 'Battle not found' };
  }
  
  if (userId !== battle.challengerId && userId !== battle.defenderId) {
    return { success: false, error: 'You are not in this battle' };
  }
  
  const winnerId = userId === battle.challengerId ? battle.defenderId : battle.challengerId;
  
  return await endBattle(battleId, winnerId);
}

function getActiveBattle(battleId) {
  return activeBattles.get(battleId);
}

function getPlayerActiveBattle(userId, serverId) {
  return Array.from(activeBattles.values()).find(
    b => (b.challengerId === userId || b.defenderId === userId) && b.serverId === serverId
  );
}

async function updateBattleSettings(serverId, updates) {
  const collection = await getCollection(COLLECTIONS.SERVER_SETTINGS);
  
  const updateFields = {};
  for (const [key, value] of Object.entries(updates)) {
    updateFields[`battleSettings.${key}`] = value;
  }
  
  await collection.updateOne(
    { serverId },
    { $set: updateFields }
  );
  
  return { success: true };
}

module.exports = {
  checkBattleEligibility,
  challengePlayer,
  acceptChallenge,
  selectTeam,
  executeMove,
  switchCharacter,
  endBattle,
  forfeitBattle,
  getActiveBattle,
  getPlayerActiveBattle,
  updateBattleSettings
};
