const { LOW_ST_MOVES, MID_ST_MOVES, HIGH_ST_MOVES, SPECIAL_MOVES, getMovesForST } = require('./moves.js');

function calculateBaseHP(st) {
  const minHP = 250;
  const maxHP = 400;
  const hpRange = maxHP - minHP;
  return Math.round(minHP + (st / 100) * hpRange);
}

function calculateDamage(move, level, st, isSpecial = false) {
  const baseDamage = move.damage;
  
  if (baseDamage === 0) {
    return 0;
  }
  
  if (baseDamage < 0) {
    const healAmount = Math.abs(baseDamage);
    const levelMultiplier = 1 + (level - 1) * 0.08;
    const stMultiplier = 0.6 + (st / 100) * 0.4;
    return -Math.round(healAmount * levelMultiplier * stMultiplier);
  }
  
  if (isSpecial) {
    const levelMultiplier = 1 + (level - 1) * 0.08;
    const stMultiplier = 0.8 + (st / 100) * 0.6;
    return Math.max(1, Math.round(baseDamage * levelMultiplier * stMultiplier));
  }
  
  const levelMultiplier = 1 + (level - 1) * 0.08;
  const stMultiplier = 0.6 + (st / 100) * 0.4;
  return Math.max(1, Math.round(baseDamage * levelMultiplier * stMultiplier));
}

function assignMovesToCharacter(characterName, st) {
  const specialMove = SPECIAL_MOVES[characterName];
  
  if (!specialMove) {
    console.error(`No special move found for character: ${characterName}`);
    return null;
  }
  
  const tierMoves = getMovesForST(st);
  
  const shuffled = [...tierMoves].sort(() => Math.random() - 0.5);
  const selectedMoves = shuffled.slice(0, 2);
  
  return {
    special: specialMove,
    tierMoves: selectedMoves
  };
}

function getMoveDisplay(move, level, st, isSpecial = false) {
  const damage = calculateDamage(move, level, st, isSpecial);
  
  if (damage === 0) {
    return `${move.name} (Support)`;
  } else if (damage < 0) {
    return `${move.name} (Heal ${Math.abs(damage)} HP)`;
  } else {
    return `${move.name} (${damage} DMG)`;
  }
}

module.exports = {
  calculateBaseHP,
  calculateDamage,
  assignMovesToCharacter,
  getMoveDisplay
};
