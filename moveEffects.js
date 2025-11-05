// Move Effects System
// Special status effects that can be applied during battle

const MOVE_EFFECTS = {
  BURN: {
    name: 'Burn',
    emoji: '🔥',
    description: 'Takes damage each turn',
    damagePerTurn: 5,
    type: 'damage_over_time'
  },
  FREEZE: {
    name: 'Freeze',
    emoji: '❄️',
    description: 'Skips next turn',
    type: 'skip_turn'
  },
  POISON: {
    name: 'Poison',
    emoji: '☠️',
    description: 'Takes increasing damage each turn',
    damagePerTurn: 3,
    damageIncrease: 2,
    type: 'damage_over_time'
  },
  PARALYZE: {
    name: 'Paralyze',
    emoji: '⚡',
    description: 'Skips next turn',
    type: 'skip_turn'
  },
  STUN: {
    name: 'Stun',
    emoji: '💫',
    description: 'Skips next turn',
    type: 'skip_turn'
  },
  REGEN: {
    name: 'Regeneration',
    emoji: '💚',
    description: 'Restores HP each turn',
    healPerTurn: 5,
    type: 'heal_over_time'
  }
};

function applyEffect(battle, playerId, effect, duration = 3) {
  if (!battle.effects) {
    battle.effects = {
      player1: [],
      player2: []
    };
  }
  
  const effectKey = playerId === battle.player1 ? 'player1' : 'player2';
  
  const existingEffect = battle.effects[effectKey].find(e => e.effectId === effect.name);
  if (existingEffect) {
    existingEffect.duration = Math.max(existingEffect.duration, duration);
    existingEffect.stacks = (existingEffect.stacks || 1) + 1;
  } else {
    battle.effects[effectKey].push({
      effectId: effect.name,
      ...effect,
      duration: duration,
      stacks: 1,
      damageDealt: 0
    });
  }
}

function removeEffect(battle, playerId, effectType) {
  if (!battle.effects) return;
  
  const effectKey = playerId === battle.player1 ? 'player1' : 'player2';
  battle.effects[effectKey] = battle.effects[effectKey].filter(e => e.effectId !== effectType);
}

function getActiveEffects(battle, playerId) {
  if (!battle.effects) {
    battle.effects = {
      player1: [],
      player2: []
    };
  }
  
  const effectKey = playerId === battle.player1 ? 'player1' : 'player2';
  return battle.effects[effectKey] || [];
}

function processEffects(battle, playerId) {
  const effects = getActiveEffects(battle, playerId);
  let totalDamage = 0;
  let totalHeal = 0;
  let skipTurn = false;
  const messages = [];
  
  const effectsToRemove = [];
  
  for (const effect of effects) {
    effect.duration--;
    
    if (effect.type === 'damage_over_time') {
      let damage = effect.damagePerTurn;
      if (effect.damageIncrease) {
        damage += effect.damageDealt * effect.damageIncrease;
        effect.damageDealt++;
      }
      totalDamage += damage;
      messages.push(`${effect.emoji} **${effect.name}** deals ${damage} damage!`);
    }
    
    if (effect.type === 'heal_over_time') {
      const heal = effect.healPerTurn;
      totalHeal += heal;
      messages.push(`${effect.emoji} **${effect.name}** restores ${heal} HP!`);
    }
    
    if (effect.type === 'skip_turn' && effect.duration > 0) {
      skipTurn = true;
      messages.push(`${effect.emoji} **${effect.name}** - turn skipped!`);
    }
    
    if (effect.duration <= 0) {
      effectsToRemove.push(effect.effectId);
      messages.push(`${effect.emoji} **${effect.name}** wore off!`);
    }
  }
  
  for (const effectType of effectsToRemove) {
    removeEffect(battle, playerId, effectType);
  }
  
  return {
    damage: totalDamage,
    heal: totalHeal,
    skipTurn: skipTurn,
    messages: messages
  };
}

function hasEffect(battle, playerId, effectType) {
  const effects = getActiveEffects(battle, playerId);
  return effects.some(e => e.effectId === effectType);
}

function clearAllEffects(battle, playerId) {
  if (!battle.effects) return;
  
  const effectKey = playerId === battle.player1 ? 'player1' : 'player2';
  battle.effects[effectKey] = [];
}

function getEffectsDisplay(battle, playerId) {
  const effects = getActiveEffects(battle, playerId);
  if (effects.length === 0) return '';
  
  return effects.map(e => `${e.emoji} ${e.name} (${e.duration})`).join(' ');
}

module.exports = {
  MOVE_EFFECTS,
  applyEffect,
  removeEffect,
  getActiveEffects,
  processEffects,
  hasEffect,
  clearAllEffects,
  getEffectsDisplay
};
