const logger = require('../core/logger');
const { isSuperAdmin, isPlayAdmin, getPermissionLevel, PERMISSION_LEVELS } = require('./permissionService');
const { getPrefix } = require('./serverSettingsService');

const MODULE = 'CommandRegistry';

const officialCommands = new Map();
const serverCommands = new Map();

const COMMAND_SCOPES = {
  OFFICIAL: 'official',
  SERVER: 'server',
  BOTH: 'both'
};

const COMMAND_CATEGORIES = {
  GENERAL: 'general',
  ECONOMY: 'economy',
  GAMEPLAY: 'gameplay',
  SOCIAL: 'social',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
};

function registerOfficialCommand(name, options) {
  const command = {
    name: name.toLowerCase(),
    aliases: options.aliases || [],
    description: options.description || 'No description',
    category: options.category || COMMAND_CATEGORIES.GENERAL,
    usage: options.usage || `!${name}`,
    examples: options.examples || [],
    cooldown: options.cooldown || 0,
    requiredPermission: options.requiredPermission || PERMISSION_LEVELS.USER,
    execute: options.execute,
    scope: COMMAND_SCOPES.OFFICIAL
  };
  
  officialCommands.set(name.toLowerCase(), command);
  
  for (const alias of command.aliases) {
    officialCommands.set(alias.toLowerCase(), { ...command, isAlias: true, originalName: name });
  }
  
  logger.info(MODULE, `Registered official command: ${name}`);
}

function registerServerCommand(serverId, name, options) {
  if (!serverCommands.has(serverId)) {
    serverCommands.set(serverId, new Map());
  }
  
  const serverCmds = serverCommands.get(serverId);
  
  const command = {
    name: name.toLowerCase(),
    aliases: options.aliases || [],
    description: options.description || 'No description',
    category: options.category || COMMAND_CATEGORIES.GENERAL,
    usage: options.usage || `!${name}`,
    examples: options.examples || [],
    cooldown: options.cooldown || 0,
    requiredPermission: options.requiredPermission || PERMISSION_LEVELS.USER,
    execute: options.execute,
    scope: COMMAND_SCOPES.SERVER,
    serverId
  };
  
  serverCmds.set(name.toLowerCase(), command);
  
  for (const alias of command.aliases) {
    serverCmds.set(alias.toLowerCase(), { ...command, isAlias: true, originalName: name });
  }
  
  logger.info(MODULE, `Registered server command: ${name} for server ${serverId}`);
}

function unregisterServerCommand(serverId, name) {
  if (!serverCommands.has(serverId)) return false;
  
  const serverCmds = serverCommands.get(serverId);
  const command = serverCmds.get(name.toLowerCase());
  
  if (!command) return false;
  
  serverCmds.delete(name.toLowerCase());
  
  for (const alias of command.aliases || []) {
    serverCmds.delete(alias.toLowerCase());
  }
  
  logger.info(MODULE, `Unregistered server command: ${name} from server ${serverId}`);
  return true;
}

function getCommand(name, serverId = null) {
  const cmdName = name.toLowerCase();
  
  if (serverId && serverCommands.has(serverId)) {
    const serverCmd = serverCommands.get(serverId).get(cmdName);
    if (serverCmd) return serverCmd;
  }
  
  return officialCommands.get(cmdName) || null;
}

function getAllOfficialCommands() {
  const commands = [];
  const seen = new Set();
  
  for (const [name, cmd] of officialCommands) {
    if (!cmd.isAlias && !seen.has(name)) {
      commands.push(cmd);
      seen.add(name);
    }
  }
  
  return commands;
}

function getServerCommands(serverId) {
  if (!serverCommands.has(serverId)) return [];
  
  const commands = [];
  const seen = new Set();
  
  for (const [name, cmd] of serverCommands.get(serverId)) {
    if (!cmd.isAlias && !seen.has(name)) {
      commands.push(cmd);
      seen.add(name);
    }
  }
  
  return commands;
}

function getAllCommands(serverId) {
  const official = getAllOfficialCommands();
  const server = getServerCommands(serverId);
  return [...official, ...server];
}

function getCommandsByCategory(category, serverId = null) {
  return getAllCommands(serverId).filter(cmd => cmd.category === category);
}

async function canExecute(command, member, serverId) {
  if (!command) return false;
  
  const userLevel = await getPermissionLevel(member, serverId);
  return userLevel >= command.requiredPermission;
}

const cooldowns = new Map();

function isOnCooldown(userId, commandName) {
  const key = `${userId}:${commandName}`;
  const cooldownEnd = cooldowns.get(key);
  
  if (!cooldownEnd) return false;
  if (Date.now() > cooldownEnd) {
    cooldowns.delete(key);
    return false;
  }
  
  return true;
}

function getRemainingCooldown(userId, commandName) {
  const key = `${userId}:${commandName}`;
  const cooldownEnd = cooldowns.get(key);
  
  if (!cooldownEnd) return 0;
  const remaining = cooldownEnd - Date.now();
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

function setCooldown(userId, commandName, cooldownSeconds) {
  if (cooldownSeconds <= 0) return;
  
  const key = `${userId}:${commandName}`;
  cooldowns.set(key, Date.now() + (cooldownSeconds * 1000));
}

async function executeCommand(commandName, message, args, data) {
  const serverId = message.guild?.id;
  const command = getCommand(commandName, serverId);
  
  if (!command) {
    return { success: false, error: 'Command not found' };
  }
  
  const canRun = await canExecute(command, message.member, serverId);
  if (!canRun) {
    return { success: false, error: 'Insufficient permissions' };
  }
  
  const userId = message.author.id;
  if (command.cooldown > 0 && isOnCooldown(userId, command.name)) {
    const remaining = getRemainingCooldown(userId, command.name);
    return { success: false, error: `Cooldown: ${remaining}s remaining` };
  }
  
  try {
    await command.execute(message, args, data);
    
    if (command.cooldown > 0) {
      setCooldown(userId, command.name, command.cooldown);
    }
    
    return { success: true };
  } catch (error) {
    logger.error(MODULE, `Error executing command ${commandName}`, { error: error.message });
    return { success: false, error: error.message };
  }
}

async function parseAndExecute(message, data) {
  const serverId = message.guild?.id;
  const prefix = await getPrefix(serverId);
  
  if (!message.content.startsWith(prefix)) return null;
  
  const withoutPrefix = message.content.slice(prefix.length).trim();
  const args = withoutPrefix.split(/\s+/);
  const commandName = args.shift()?.toLowerCase();
  
  if (!commandName) return null;
  
  return executeCommand(commandName, message, args, data);
}

function formatCommandHelp(command) {
  let help = `**${command.name}**\n`;
  help += `${command.description}\n`;
  help += `Usage: \`${command.usage}\`\n`;
  
  if (command.aliases?.length > 0) {
    help += `Aliases: ${command.aliases.map(a => `\`${a}\``).join(', ')}\n`;
  }
  
  if (command.examples?.length > 0) {
    help += `Examples:\n${command.examples.map(e => `  \`${e}\``).join('\n')}\n`;
  }
  
  if (command.cooldown > 0) {
    help += `Cooldown: ${command.cooldown}s\n`;
  }
  
  return help;
}

module.exports = {
  COMMAND_SCOPES,
  COMMAND_CATEGORIES,
  registerOfficialCommand,
  registerServerCommand,
  unregisterServerCommand,
  getCommand,
  getAllOfficialCommands,
  getServerCommands,
  getAllCommands,
  getCommandsByCategory,
  canExecute,
  isOnCooldown,
  getRemainingCooldown,
  setCooldown,
  executeCommand,
  parseAndExecute,
  formatCommandHelp
};
