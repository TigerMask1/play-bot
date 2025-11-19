const ORES = {
  aurelite: { name: 'Aurelite', emoji: '🟡', rarity: 'common', value: 10 },
  kryonite: { name: 'Kryonite', emoji: '🔵', rarity: 'uncommon', value: 25 },
  zyronite: { name: 'Zyronite', emoji: '🟣', rarity: 'rare', value: 50 },
  rubinite: { name: 'Rubinite', emoji: '🔴', rarity: 'epic', value: 100 },
  voidinite: { name: 'Voidinite', emoji: '⚫', rarity: 'legendary', value: 250 }
};

const WOOD_TYPES = {
  oak: { name: 'Oak Wood', emoji: '🟤', rarity: 'common', value: 8 },
  maple: { name: 'Maple Wood', emoji: '🟠', rarity: 'uncommon', value: 20 },
  ebony: { name: 'Ebony Wood', emoji: '⚫', rarity: 'rare', value: 45 },
  celestial: { name: 'Celestial Wood', emoji: '✨', rarity: 'epic', value: 120 }
};

function getOreByRarity(rarity) {
  return Object.entries(ORES).find(([_, ore]) => ore.rarity === rarity)?.[0];
}

function getWoodByRarity(rarity) {
  return Object.entries(WOOD_TYPES).find(([_, wood]) => wood.rarity === rarity)?.[0];
}

function formatOreInventory(ores) {
  if (!ores || Object.keys(ores).length === 0) return 'No ores';
  return Object.entries(ores)
    .filter(([_, amount]) => amount > 0)
    .map(([ore, amount]) => `${ORES[ore].emoji} ${amount}`)
    .join(' ');
}

function formatWoodInventory(wood) {
  if (!wood || Object.keys(wood).length === 0) return 'No wood';
  return Object.entries(wood)
    .filter(([_, amount]) => amount > 0)
    .map(([type, amount]) => `${WOOD_TYPES[type].emoji} ${amount}`)
    .join(' ');
}

module.exports = {
  ORES,
  WOOD_TYPES,
  getOreByRarity,
  getWoodByRarity,
  formatOreInventory,
  formatWoodInventory
};
