const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const db = require('./database/MongoDB');
const { getDefaultServerConfig, getDefaultServerUser, getDefaultGlobalUser } = require('./config/defaults');
const { MODULES } = require('./config/constants');

class PlayBot {
  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
      ]
    });
    
    this.commands = new Collection();
    this.aliases = new Collection();
    this.cooldowns = new Collection();
    this.activeDrops = new Map();
    this.modules = new Map();
  }

  async initialize() {
    console.log('🚀 Initializing PlayBot...');
    
    await db.connect();
    
    await this.loadCommands();
    await this.loadEvents();
    await this.loadModules();
    
    console.log('✅ PlayBot initialized successfully!');
  }

  async loadCommands() {
    const commandFolders = fs.readdirSync(path.join(__dirname, 'commands'));
    
    for (const folder of commandFolders) {
      const commandPath = path.join(__dirname, 'commands', folder);
      const stat = fs.statSync(commandPath);
      
      if (stat.isDirectory()) {
        const commandFiles = fs.readdirSync(commandPath).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
          const command = require(path.join(commandPath, file));
          
          if (command.name) {
            this.commands.set(command.name, command);
            
            if (command.aliases) {
              for (const alias of command.aliases) {
                this.aliases.set(alias, command.name);
              }
            }
            
            console.log(`  📦 Loaded command: ${command.name}`);
          }
        }
      }
    }
    
    console.log(`✅ Loaded ${this.commands.size} commands`);
  }

  async loadEvents() {
    const eventPath = path.join(__dirname, 'events');
    
    if (!fs.existsSync(eventPath)) {
      console.log('⚠️ No events folder found');
      return;
    }
    
    const eventFiles = fs.readdirSync(eventPath).filter(file => file.endsWith('.js'));
    
    for (const file of eventFiles) {
      const event = require(path.join(eventPath, file));
      
      if (event.once) {
        this.client.once(event.name, (...args) => event.execute(this, ...args));
      } else {
        this.client.on(event.name, (...args) => event.execute(this, ...args));
      }
      
      console.log(`  🎯 Loaded event: ${event.name}`);
    }
    
    console.log(`✅ Loaded ${eventFiles.length} events`);
  }

  async loadModules() {
    const modulePath = path.join(__dirname, 'modules');
    
    if (!fs.existsSync(modulePath)) {
      console.log('⚠️ No modules folder found');
      return;
    }
    
    const moduleFiles = fs.readdirSync(modulePath).filter(file => file.endsWith('.js'));
    
    for (const file of moduleFiles) {
      const ModuleClass = require(path.join(modulePath, file));
      const moduleInstance = new ModuleClass(this);
      
      this.modules.set(moduleInstance.name, moduleInstance);
      console.log(`  🔌 Loaded module: ${moduleInstance.name}`);
    }
    
    console.log(`✅ Loaded ${this.modules.size} modules`);
  }

  getModule(name) {
    return this.modules.get(name);
  }

  async ensureServerConfig(serverId, serverName) {
    return await db.ensureServerConfig(serverId, serverName);
  }

  async ensureUser(serverId, discordId, username) {
    const serverUser = await db.ensureServerUser(serverId, discordId, username);
    const globalUser = await db.ensureGlobalUser(discordId, username);
    return { serverUser, globalUser };
  }

  isModuleEnabled(serverConfig, moduleName) {
    if (!serverConfig || !serverConfig.modules) return true;
    return serverConfig.modules[moduleName] !== false;
  }

  async handleCommand(message) {
    if (message.author.bot || !message.guild) return;
    
    const serverConfig = await this.ensureServerConfig(message.guild.id, message.guild.name);
    const prefix = serverConfig.prefix || '!';
    
    let commandContent = message.content;
    let usedMention = false;
    
    if (message.content.startsWith(`<@${this.client.user.id}>`) || 
        message.content.startsWith(`<@!${this.client.user.id}>`)) {
      commandContent = message.content.replace(/<@!?\d+>\s*/, '');
      usedMention = true;
    } else if (!message.content.startsWith(prefix)) {
      return;
    } else {
      commandContent = message.content.slice(prefix.length);
    }
    
    const args = commandContent.trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();
    
    if (!commandName) return;
    
    let command = this.commands.get(commandName);
    if (!command) {
      const aliasCommand = this.aliases.get(commandName);
      if (aliasCommand) {
        command = this.commands.get(aliasCommand);
      }
    }
    
    if (!command) return;
    
    if (command.module) {
      const moduleEnabled = serverConfig.modules?.[command.module];
      if (moduleEnabled === false) {
        return message.reply(`❌ The **${command.module}** module is disabled on this server.`);
      }
    }
    
    if (command.cooldown) {
      const cooldownKey = `${message.author.id}-${command.name}`;
      const now = Date.now();
      const cooldownAmount = command.cooldown * 1000;
      
      if (this.cooldowns.has(cooldownKey)) {
        const expirationTime = this.cooldowns.get(cooldownKey) + cooldownAmount;
        
        if (now < expirationTime) {
          const timeLeft = (expirationTime - now) / 1000;
          return message.reply(`⏳ Please wait **${timeLeft.toFixed(1)}s** before using \`${command.name}\` again.`);
        }
      }
      
      this.cooldowns.set(cooldownKey, now);
      setTimeout(() => this.cooldowns.delete(cooldownKey), cooldownAmount);
    }
    
    const { serverUser, globalUser } = await this.ensureUser(
      message.guild.id, 
      message.author.id, 
      message.author.username
    );
    
    if (command.requiresStart && !serverUser.started) {
      return message.reply(`❌ You haven't started yet! Use \`${prefix}start\` to begin your journey.`);
    }
    
    const context = {
      bot: this,
      client: this.client,
      message,
      args,
      serverConfig,
      serverUser,
      globalUser,
      prefix,
      db
    };
    
    try {
      await command.execute(context);
    } catch (error) {
      console.error(`Error executing command ${command.name}:`, error);
      await message.reply('❌ An error occurred while executing this command.');
    }
  }

  async start(token) {
    await this.initialize();
    
    this.client.on(Events.MessageCreate, (message) => this.handleCommand(message));
    
    await this.client.login(token);
  }
}

module.exports = PlayBot;
