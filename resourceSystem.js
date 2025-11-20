const ORES = {
  aurelite: { name: 'Aurelite', emoji: '<:emoji_15:1440870514179571712>', rarity: 'common', value: 10 },
  kryonite: { name: 'Kryonite', emoji: '<:emoji_18:1440870637622132838>', rarity: 'uncommon', value: 25 },
  zyronite: { name: 'Zyronite', emoji: '<:emoji_18:1440870612875870208>', rarity: 'rare', value: 50 },
  rubinite: { name: 'Rubinite', emoji: '<:emoji_16:1440870557355872287>', rarity: 'epic', value: 100 },
  voidinite: { name: 'Voidinite', emoji: '<:emoji_16:1440870583729655839>', rarity: 'legendary', value: 250 }
};

const WOOD_TYPES = {
  oak: { name: 'Oak Wood', emoji: '<:emoji_19:1440870663509508146>', rarity: 'common', value: 8 },
  maple: { name: 'Maple Wood', emoji: '<:emoji_20:1440870689065271420>', rarity: 'uncommon', value: 20 },
  ebony: { name: 'Ebony Wood', emoji: '<:emoji_21:1440870715787313162>', rarity: 'rare', value: 45 },
  celestial: { name: 'Celestial Wood', emoji: '<:emoji_23:1440870753472872630>', rarity: 'epic', value: 120 }
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
