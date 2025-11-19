const TOOL_TYPES = {
  drill: { emoji: '⛏️', maxLevel: 5, durabilityPerLevel: [20, 35, 50, 75, 100] },
  axe: { emoji: '🪓', maxLevel: 5, durabilityPerLevel: [20, 35, 50, 75, 100] },
  whistle: { emoji: '📢', maxLevel: 5, durabilityPerLevel: [25, 40, 60, 85, 120] },
  binoculars: { emoji: '🔭', maxLevel: 5, durabilityPerLevel: [25, 40, 60, 85, 120] }
};

const CRAFTING_RECIPES = {
  drill: {
    1: { aurelite: 3, oak: 2 },
    2: { kryonite: 3, aurelite: 5, maple: 3 },
    3: { zyronite: 4, kryonite: 6, maple: 4 },
    4: { rubinite: 5, zyronite: 8, ebony: 5 },
    5: { voidinite: 6, rubinite: 10, celestial: 6 }
  },
  axe: {
    1: { aurelite: 2, oak: 3 },
    2: { kryonite: 4, maple: 4 },
    3: { zyronite: 5, maple: 6 },
    4: { rubinite: 6, ebony: 7 },
    5: { voidinite: 7, celestial: 8 }
  },
  whistle: {
    1: { aurelite: 4, oak: 1 },
    2: { kryonite: 5, aurelite: 3 },
    3: { zyronite: 6, kryonite: 4 },
    4: { rubinite: 8, zyronite: 5 },
    5: { voidinite: 10, rubinite: 6 }
  },
  binoculars: {
    1: { aurelite: 3, oak: 2 },
    2: { kryonite: 4, maple: 3 },
    3: { zyronite: 5, ebony: 4 },
    4: { rubinite: 7, ebony: 6 },
    5: { voidinite: 9, celestial: 7 }
  }
};

function initializeTools(userData) {
  if (!userData.tools) {
    userData.tools = {
      drill: { level: 0, durability: 0 },
      axe: { level: 0, durability: 0 },
      whistle: { level: 0, durability: 0 },
      binoculars: { level: 0, durability: 0 }
    };
  }
  return userData.tools;
}

function useTool(userData, toolType) {
  const tools = initializeTools(userData);
  const tool = tools[toolType];
  
  if (tool.level === 0) return { success: false, message: `You don't have a ${toolType}! Craft one with \`!craft ${toolType}\`` };
  if (tool.durability <= 0) return { success: false, message: `Your ${TOOL_TYPES[toolType].emoji} ${toolType} broke! Craft a new one with \`!craft ${toolType}\`` };
  
  tool.durability--;
  
  return { success: true, level: tool.level, remaining: tool.durability };
}

function canCraftTool(userData, toolType, level) {
  const recipe = CRAFTING_RECIPES[toolType][level];
  if (!recipe) return { canCraft: false, reason: 'Invalid level' };
  
  const ores = userData.ores || {};
  const wood = userData.wood || {};
  
  for (const [resource, amount] of Object.entries(recipe)) {
    const hasAmount = ores[resource] || wood[resource] || 0;
    if (hasAmount < amount) {
      return { canCraft: false, missing: resource, need: amount, have: hasAmount };
    }
  }
  
  return { canCraft: true };
}

function craftTool(userData, toolType, level) {
  const check = canCraftTool(userData, toolType, level);
  if (!check.canCraft) return { success: false, ...check };
  
  const recipe = CRAFTING_RECIPES[toolType][level];
  const ores = userData.ores || {};
  const wood = userData.wood || {};
  
  for (const [resource, amount] of Object.entries(recipe)) {
    if (ores[resource]) ores[resource] -= amount;
    if (wood[resource]) wood[resource] -= amount;
  }
  
  const tools = initializeTools(userData);
  tools[toolType].level = level;
  tools[toolType].durability = TOOL_TYPES[toolType].durabilityPerLevel[level - 1];
  
  return { success: true, level, durability: tools[toolType].durability };
}

function getToolInfo(userData, toolType) {
  const tools = initializeTools(userData);
  const tool = tools[toolType];
  return {
    emoji: TOOL_TYPES[toolType].emoji,
    level: tool.level,
    durability: tool.durability,
    maxDurability: tool.level > 0 ? TOOL_TYPES[toolType].durabilityPerLevel[tool.level - 1] : 0
  };
}

module.exports = {
  TOOL_TYPES,
  CRAFTING_RECIPES,
  initializeTools,
  useTool,
  canCraftTool,
  craftTool,
  getToolInfo
};
