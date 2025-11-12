// Real-time arena combat properties for moves
// Extends the existing turn-based moves with visual and gameplay properties

const MOVE_ARENA_PROPERTIES = {
  // Low ST Moves
  'Punch': {
    shape: 'circle',
    radius: 25,
    speed: 8,
    range: 150,
    cooldown: 1000,
    color: '#FFA500',
    description: 'Quick melee punch'
  },
  'Kick': {
    shape: 'circle',
    radius: 30,
    speed: 9,
    range: 180,
    cooldown: 1200,
    color: '#FF6347',
    description: 'Strong kick attack'
  },
  'Block': {
    shape: 'shield',
    radius: 40,
    speed: 0,
    range: 0,
    cooldown: 3000,
    color: '#4169E1',
    description: 'Defensive block - reduces incoming damage'
  },
  'Swipe': {
    shape: 'arc',
    radius: 35,
    angle: 90,
    speed: 10,
    range: 200,
    cooldown: 1100,
    color: '#FF4500',
    description: 'Wide sweeping attack'
  },
  'Charge': {
    shape: 'dash',
    radius: 20,
    speed: 15,
    range: 250,
    cooldown: 2500,
    color: '#FFD700',
    description: 'Dash forward attack'
  },
  'Heal': {
    shape: 'pulse',
    radius: 50,
    speed: 0,
    range: 0,
    cooldown: 5000,
    color: '#00FF00',
    description: 'Heal yourself'
  },
  'Taunt': {
    shape: 'wave',
    radius: 30,
    speed: 0,
    range: 0,
    cooldown: 3000,
    color: '#9370DB',
    description: 'Taunt opponent'
  },
  'Smack': {
    shape: 'circle',
    radius: 28,
    speed: 10,
    range: 160,
    cooldown: 1000,
    color: '#DC143C',
    description: 'Hard smack'
  },
  'Focus': {
    shape: 'aura',
    radius: 40,
    speed: 0,
    range: 0,
    cooldown: 4000,
    color: '#00CED1',
    description: 'Focus for next attack'
  },
  'Jab': {
    shape: 'circle',
    radius: 22,
    speed: 12,
    range: 140,
    cooldown: 800,
    color: '#FF8C00',
    description: 'Quick jab'
  },
  
  // Mid ST Moves
  'Strike': {
    shape: 'circle',
    radius: 35,
    speed: 11,
    range: 250,
    cooldown: 1500,
    color: '#FF0000',
    description: 'Powerful strike'
  },
  'Double Hit': {
    shape: 'double',
    radius: 30,
    speed: 9,
    range: 220,
    cooldown: 1800,
    color: '#FF1493',
    description: 'Two consecutive hits'
  },
  'Wind Cut': {
    shape: 'beam',
    width: 40,
    height: 15,
    speed: 14,
    range: 400,
    cooldown: 2000,
    color: '#87CEEB',
    description: 'Wind blade projectile'
  },
  'Guard': {
    shape: 'shield',
    radius: 50,
    speed: 0,
    range: 0,
    cooldown: 4000,
    color: '#4682B4',
    description: 'Strong defense'
  },
  'Power Up': {
    shape: 'aura',
    radius: 45,
    speed: 0,
    range: 0,
    cooldown: 6000,
    color: '#FFD700',
    description: 'Power boost'
  },
  'Recover': {
    shape: 'pulse',
    radius: 60,
    speed: 0,
    range: 0,
    cooldown: 7000,
    color: '#32CD32',
    description: 'Recover health'
  },
  'Flame Hit': {
    shape: 'circle',
    radius: 38,
    speed: 10,
    range: 280,
    cooldown: 2200,
    color: '#FF4500',
    description: 'Burning attack'
  },
  'Frost Hit': {
    shape: 'circle',
    radius: 36,
    speed: 9,
    range: 270,
    cooldown: 2100,
    color: '#00BFFF',
    description: 'Freezing attack'
  },
  'Shock Hit': {
    shape: 'circle',
    radius: 40,
    speed: 11,
    range: 290,
    cooldown: 2300,
    color: '#FFFF00',
    description: 'Electric attack'
  },
  'Counter': {
    shape: 'reflect',
    radius: 35,
    speed: 13,
    range: 200,
    cooldown: 2500,
    color: '#9932CC',
    description: 'Counter attack'
  },
  
  // High ST Moves
  'Smash': {
    shape: 'circle',
    radius: 50,
    speed: 8,
    range: 220,
    cooldown: 3000,
    color: '#8B0000',
    description: 'Devastating smash'
  },
  'Meteor': {
    shape: 'circle',
    radius: 60,
    speed: 6,
    range: 500,
    cooldown: 4000,
    color: '#FF6347',
    description: 'Meteor strike'
  },
  'Flash': {
    shape: 'beam',
    width: 50,
    height: 20,
    speed: 18,
    range: 600,
    cooldown: 3500,
    color: '#FFD700',
    description: 'Lightning fast beam'
  },
  'Slice': {
    shape: 'beam',
    width: 45,
    height: 15,
    speed: 16,
    range: 450,
    cooldown: 3000,
    color: '#C0C0C0',
    description: 'Sharp slice attack'
  },
  'Flame Burst': {
    shape: 'explosion',
    radius: 70,
    speed: 9,
    range: 350,
    cooldown: 3800,
    color: '#FF4500',
    description: 'Explosive flames'
  },
  'Wave': {
    shape: 'wave',
    width: 100,
    height: 30,
    speed: 12,
    range: 500,
    cooldown: 3200,
    color: '#1E90FF',
    description: 'Tidal wave'
  },
  'Thunder': {
    shape: 'beam',
    width: 35,
    height: 25,
    speed: 20,
    range: 700,
    cooldown: 3500,
    color: '#FFFF00',
    description: 'Thunder bolt'
  },
  'Quake': {
    shape: 'shockwave',
    radius: 80,
    speed: 10,
    range: 400,
    cooldown: 4000,
    color: '#8B4513',
    description: 'Ground quake'
  },
  'Revive': {
    shape: 'pulse',
    radius: 70,
    speed: 0,
    range: 0,
    cooldown: 10000,
    color: '#00FF7F',
    description: 'Major heal'
  },
  'Boost': {
    shape: 'aura',
    radius: 55,
    speed: 0,
    range: 0,
    cooldown: 8000,
    color: '#FFD700',
    description: 'Major power boost'
  }
};

// Special move properties for each character
const SPECIAL_MOVE_ARENA_PROPERTIES = {
  'Claw Rush': { shape: 'multi', radius: 45, speed: 13, range: 300, cooldown: 3500, color: '#FF6347' },
  'Sonic Peck': { shape: 'beam', width: 30, height: 10, speed: 22, range: 700, cooldown: 3000, color: '#87CEEB' },
  'Power Slam': { shape: 'circle', radius: 70, speed: 7, range: 250, cooldown: 4000, color: '#8B4513' },
  'Horn Charge': { shape: 'dash', radius: 40, speed: 17, range: 400, cooldown: 3500, color: '#A0522D' },
  'Happy Howl': { shape: 'wave', width: 120, height: 40, speed: 11, range: 450, cooldown: 3000, color: '#FFB6C1' },
  'Leaf Shot': { shape: 'multi', radius: 30, speed: 14, range: 500, cooldown: 3200, color: '#228B22' },
  'Shell Roll': { shape: 'dash', radius: 50, speed: 15, range: 450, cooldown: 3500, color: '#8B7355' },
  'Charm Spin': { shape: 'spiral', radius: 40, speed: 12, range: 350, cooldown: 3200, color: '#FF69B4' },
  'Royal Cut': { shape: 'beam', width: 55, height: 18, speed: 17, range: 550, cooldown: 3800, color: '#FFD700' },
  'Hot Punch': { shape: 'circle', radius: 45, speed: 12, range: 300, cooldown: 3500, color: '#FF4500' },
  'Web Strike': { shape: 'net', radius: 55, speed: 10, range: 400, cooldown: 3700, color: '#FFFFFF' },
  'Petal Wave': { shape: 'wave', width: 110, height: 35, speed: 13, range: 500, cooldown: 3300, color: '#FFB6C1' },
  'Sparkle Beam': { shape: 'beam', width: 40, height: 15, speed: 19, range: 650, cooldown: 3200, color: '#FFD700' },
  'Tidal Wave': { shape: 'wave', width: 130, height: 45, speed: 10, range: 550, cooldown: 3800, color: '#00BFFF' },
  'Head Smash': { shape: 'circle', radius: 75, speed: 8, range: 280, cooldown: 4200, color: '#696969' },
  'Wild Leap': { shape: 'dash', radius: 42, speed: 16, range: 420, cooldown: 3400, color: '#DEB887' },
  'Volt Bite': { shape: 'circle', radius: 48, speed: 14, range: 320, cooldown: 3600, color: '#FFFF00' },
  'Healing Ray': { shape: 'beam', width: 35, height: 12, speed: 15, range: 450, cooldown: 5000, color: '#00FF00' },
  'Sneak Cut': { shape: 'beam', width: 42, height: 14, speed: 18, range: 500, cooldown: 3200, color: '#2F4F4F' },
  'Stone Punch': { shape: 'circle', radius: 52, speed: 9, range: 290, cooldown: 3700, color: '#808080' },
  'Light Shot': { shape: 'beam', width: 38, height: 13, speed: 20, range: 600, cooldown: 3000, color: '#FFFFE0' },
  'Sneaky Swipe': { shape: 'arc', radius: 40, angle: 100, speed: 13, range: 320, cooldown: 3200, color: '#8B4513' },
  'Sound Blast': { shape: 'shockwave', radius: 65, speed: 14, range: 450, cooldown: 3500, color: '#9370DB' },
  'Fire Breath': { shape: 'cone', radius: 60, angle: 60, speed: 11, range: 400, cooldown: 3800, color: '#FF4500' },
  'Laser Beam': { shape: 'beam', width: 25, height: 10, speed: 25, range: 800, cooldown: 4000, color: '#FF0000' },
  'Fist Storm': { shape: 'multi', radius: 40, speed: 12, range: 350, cooldown: 3600, color: '#B22222' },
  'Vine Wrap': { shape: 'net', radius: 50, speed: 9, range: 380, cooldown: 3700, color: '#228B22' },
  'Bubble Shot': { shape: 'circle', radius: 42, speed: 11, range: 360, cooldown: 3000, color: '#ADD8E6' },
  'Spin Dash': { shape: 'dash', radius: 38, speed: 18, range: 460, cooldown: 3300, color: '#4169E1' },
  'Moon Strike': { shape: 'circle', radius: 46, speed: 13, range: 370, cooldown: 3200, color: '#E6E6FA' },
  'Frost Bite': { shape: 'circle', radius: 50, speed: 14, range: 340, cooldown: 3800, color: '#00CED1' },
  'Fire Burst': { shape: 'explosion', radius: 68, speed: 10, range: 380, cooldown: 3700, color: '#FF6347' },
  'Wind Kick': { shape: 'circle', radius: 44, speed: 15, range: 350, cooldown: 3300, color: '#87CEEB' },
  'Gear Spin': { shape: 'spiral', radius: 48, speed: 13, range: 390, cooldown: 3800, color: '#708090' },
  'Spice Bomb': { shape: 'explosion', radius: 62, speed: 9, range: 360, cooldown: 3500, color: '#FF4500' },
  'Mind Push': { shape: 'wave', width: 100, height: 35, speed: 12, range: 480, cooldown: 3400, color: '#9370DB' },
  'Night Grip': { shape: 'circle', radius: 45, speed: 13, range: 350, cooldown: 3500, color: '#191970' },
  'Speed Cut': { shape: 'beam', width: 40, height: 12, speed: 21, range: 620, cooldown: 3000, color: '#00FF00' },
  'Storm Jab': { shape: 'circle', radius: 47, speed: 15, range: 360, cooldown: 3600, color: '#4682B4' },
  'Rock Toss': { shape: 'circle', radius: 45, speed: 11, range: 400, cooldown: 3500, color: '#A9A9A9' },
  'Heart Blast': { shape: 'circle', radius: 42, speed: 12, range: 340, cooldown: 3000, color: '#FF1493' },
  'Gem Strike': { shape: 'multi', radius: 35, speed: 16, range: 450, cooldown: 3200, color: '#FF00FF' },
  'Shell Guard': { shape: 'shield', radius: 60, speed: 0, range: 0, cooldown: 5000, color: '#8B7355' },
  'Hop Smash': { shape: 'circle', radius: 48, speed: 13, range: 340, cooldown: 3500, color: '#DEB887' },
  'Hammer Hit': { shape: 'circle', radius: 65, speed: 8, range: 270, cooldown: 3900, color: '#696969' },
  'Star Beam': { shape: 'beam', width: 42, height: 16, speed: 18, range: 600, cooldown: 3200, color: '#FFD700' },
  'Twin Spin': { shape: 'double', radius: 50, speed: 14, range: 380, cooldown: 3800, color: '#8B4513' },
  'Tide Crash': { shape: 'wave', width: 125, height: 42, speed: 11, range: 520, cooldown: 3800, color: '#1E90FF' },
  'Floral Blast': { shape: 'multi', radius: 38, speed: 13, range: 420, cooldown: 3300, color: '#FFB6C1' },
  'Sand Rush': { shape: 'wave', width: 90, height: 30, speed: 12, range: 450, cooldown: 3500, color: '#F4A460' },
  'Steel Slam': { shape: 'circle', radius: 70, speed: 7, range: 260, cooldown: 4100, color: '#708090' }
};

// Get arena properties for a move
function getArenaProperties(moveName) {
  return MOVE_ARENA_PROPERTIES[moveName] || SPECIAL_MOVE_ARENA_PROPERTIES[moveName] || {
    shape: 'circle',
    radius: 30,
    speed: 10,
    range: 250,
    cooldown: 2000,
    color: '#FFFFFF'
  };
}

// Enhance character moves with arena properties
function enhanceMovesForArena(characterMoves, characterName) {
  const enhanced = {
    special: null,
    tierMoves: []
  };
  
  if (characterMoves.special) {
    const specialMove = SPECIAL_MOVE_ARENA_PROPERTIES[characterMoves.special.name];
    enhanced.special = {
      ...characterMoves.special,
      ...specialMove,
      isSpecial: true
    };
  }
  
  if (characterMoves.tierMoves) {
    enhanced.tierMoves = characterMoves.tierMoves.map(move => {
      const arenaProps = getArenaProperties(move.name);
      return {
        ...move,
        ...arenaProps
      };
    });
  }
  
  return enhanced;
}

module.exports = {
  MOVE_ARENA_PROPERTIES,
  SPECIAL_MOVE_ARENA_PROPERTIES,
  getArenaProperties,
  enhanceMovesForArena
};
