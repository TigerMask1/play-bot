const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const express = require('express');
const http = require('http');

const { connect: connectDB, isConnected } = require('../infrastructure/database');
const { BOT_CONFIG, setSuperAdmins, setMainServer } = require('./config');
const logger = require('./logger');
const { getServerSettings, createServerSettings } = require('../services/serverSettingsService');
const { ensureServerProfile, recordActivity } = require('../services/profileService');
const { parseAndExecute } = require('../services/commandRegistry');

require('../commands/official');

const MODULE = 'PlayBot';

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
    
    this.data = {
      ready: false
    };
    
    this.setupEventHandlers();
  }
  
  setupEventHandlers() {
    this.client.on('ready', async () => {
      logger.info(MODULE, `Logged in as ${this.client.user.tag}`);
      logger.info(MODULE, `Serving ${this.client.guilds.cache.size} servers`);
      
      await this.initialize();
    });
    
    this.client.on('guildCreate', async (guild) => {
      logger.info(MODULE, `Joined new server: ${guild.name} (${guild.id})`);
      await this.handleGuildJoin(guild);
    });
    
    this.client.on('messageCreate', async (message) => {
      await this.handleMessage(message);
    });
    
    this.client.on('interactionCreate', async (interaction) => {
      await this.handleInteraction(interaction);
    });
  }
  
  async initialize() {
    try {
      await connectDB();
      logger.info(MODULE, 'Database connected');
      
      this.loadConfig();
      
      this.data.ready = true;
      logger.info(MODULE, 'PlayBot initialized successfully');
    } catch (error) {
      logger.error(MODULE, 'Failed to initialize PlayBot', { error: error.message });
    }
  }
  
  loadConfig() {
    const superAdminIds = process.env.SUPER_ADMIN_IDS?.split(',').filter(Boolean) || [];
    const mainServerId = process.env.MAIN_SERVER_ID || null;
    
    setSuperAdmins(superAdminIds);
    setMainServer(mainServerId);
    
    logger.info(MODULE, 'Config loaded', { 
      superAdmins: superAdminIds.length, 
      mainServer: mainServerId 
    });
  }
  
  async handleGuildJoin(guild) {
    try {
      let settings = await getServerSettings(guild.id);
      
      if (!settings) {
        const result = await createServerSettings(guild.id, guild.name);
        if (result.success) {
          logger.info(MODULE, 'Created settings for new server', { serverId: guild.id });
        }
      }
      
      const owner = await guild.fetchOwner();
      if (owner) {
        const welcomeEmbed = new EmbedBuilder()
          .setColor(BOT_CONFIG.officialCurrency.primary.symbol === '🪙' ? '#FFD700' : '#00D9FF')
          .setTitle(`Welcome to ${BOT_CONFIG.name}!`)
          .setDescription(
            `Thanks for adding ${BOT_CONFIG.name} to **${guild.name}**!\n\n` +
            `**Getting Started:**\n` +
            `1. Create a role called **"PlayAdmin"** for server managers\n` +
            `2. Use \`!setup\` to configure the bot\n` +
            `3. Set channels with \`!setdropchannel\`, \`!seteventschannel\`, \`!setupdateschannel\`\n\n` +
            `**Customization:**\n` +
            `- \`!setbotname <name>\` - Change bot display name\n` +
            `- \`!setprefix <prefix>\` - Change command prefix\n` +
            `- \`!setcurrency <type> <name> <symbol>\` - Customize currencies\n\n` +
            `Use \`!help\` for all commands!`
          )
          .setFooter({ text: `${BOT_CONFIG.name} v${BOT_CONFIG.version}` });
        
        await owner.send({ embeds: [welcomeEmbed] }).catch(() => {
          logger.warn(MODULE, 'Could not DM guild owner', { guildId: guild.id });
        });
      }
    } catch (error) {
      logger.error(MODULE, 'Error handling guild join', { error: error.message });
    }
  }
  
  async handleMessage(message) {
    if (message.author.bot) return;
    if (!message.guild) return;
    if (!this.data.ready) return;
    
    const userId = message.author.id;
    const serverId = message.guild.id;
    const username = message.author.username;
    
    await ensureServerProfile(userId, serverId, username);
    await recordActivity(userId, serverId);
    
    const result = await parseAndExecute(message, this.data);
    
    if (result && !result.success && result.error) {
      if (result.error === 'Command not found') return;
      
      if (result.error.startsWith('Cooldown:')) {
        await message.reply(` ${result.error}`).catch(() => {});
      } else if (result.error === 'Insufficient permissions') {
        await message.reply(' You don\'t have permission to use this command.').catch(() => {});
      }
    }
  }
  
  async handleInteraction(interaction) {
    if (!this.data.ready) return;
    
    if (interaction.isButton()) {
      await this.handleButtonInteraction(interaction);
    } else if (interaction.isStringSelectMenu()) {
      await this.handleSelectMenuInteraction(interaction);
    } else if (interaction.isModalSubmit()) {
      await this.handleModalSubmit(interaction);
    }
  }
  
  async handleButtonInteraction(interaction) {
    const customId = interaction.customId;
    
    logger.debug(MODULE, 'Button interaction', { customId, userId: interaction.user.id });
  }
  
  async handleSelectMenuInteraction(interaction) {
    const customId = interaction.customId;
    
    logger.debug(MODULE, 'Select menu interaction', { customId, userId: interaction.user.id });
  }
  
  async handleModalSubmit(interaction) {
    const customId = interaction.customId;
    
    logger.debug(MODULE, 'Modal submit', { customId, userId: interaction.user.id });
  }
  
  async start() {
    const PORT = process.env.PORT || 3000;
    
    const app = express();
    app.use(express.json());
    
    app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        bot: BOT_CONFIG.name,
        version: BOT_CONFIG.version,
        ready: this.data.ready,
        database: isConnected(),
        guilds: this.client.guilds?.cache?.size || 0
      });
    });
    
    app.get('/', (req, res) => {
      res.send(`${BOT_CONFIG.name} is running!`);
    });
    
    const server = http.createServer(app);
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.warn(MODULE, `Port ${PORT} in use, trying alternative`);
        server.listen(0, '0.0.0.0', () => {
          logger.info(MODULE, `Server running on port ${server.address().port}`);
        });
      } else {
        logger.error(MODULE, 'Server error', { error: err.message });
      }
    });
    
    server.listen(PORT, '0.0.0.0', () => {
      logger.info(MODULE, `Server running on port ${PORT}`);
    });
    
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) {
      logger.error(MODULE, 'DISCORD_BOT_TOKEN not found in environment variables!');
      console.error('Please add your Discord bot token to the Secrets.');
      process.exit(1);
    }
    
    try {
      await this.client.login(token);
    } catch (error) {
      logger.error(MODULE, 'Failed to login to Discord', { error: error.message });
      process.exit(1);
    }
  }
}

module.exports = PlayBot;
