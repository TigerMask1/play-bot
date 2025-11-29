const { EmbedBuilder } = require('discord.js');
const { DROPS, COLORS, EMOJIS } = require('../config/constants');
const { selectRandomRarity, selectRandomCharacter, generateCatchCode } = require('../utils/helpers');
const { dropEmbed } = require('../utils/embeds');
const db = require('../database/MongoDB');

class DropModule {
  constructor(bot) {
    this.bot = bot;
    this.name = 'drops';
    this.activeDrops = new Map();
    this.dropIntervals = new Map();
    this.defaultCharacters = this.getDefaultCharacters();
  }

  getDefaultCharacters() {
    return [
      { characterId: 'default_1', name: 'Flame Fox', rarity: 'COMMON', baseStats: { hp: 80, attack: 12, defense: 8, speed: 15 }, description: 'A swift fox with fiery fur.' },
      { characterId: 'default_2', name: 'Stone Golem', rarity: 'COMMON', baseStats: { hp: 120, attack: 8, defense: 18, speed: 5 }, description: 'A slow but sturdy stone creature.' },
      { characterId: 'default_3', name: 'Wind Spirit', rarity: 'UNCOMMON', baseStats: { hp: 70, attack: 14, defense: 6, speed: 20 }, description: 'A spirit that rides the wind.' },
      { characterId: 'default_4', name: 'Shadow Cat', rarity: 'UNCOMMON', baseStats: { hp: 85, attack: 16, defense: 10, speed: 18 }, description: 'A mysterious feline from the shadows.' },
      { characterId: 'default_5', name: 'Crystal Dragon', rarity: 'RARE', baseStats: { hp: 100, attack: 20, defense: 15, speed: 12 }, description: 'A dragon made of pure crystal.' },
      { characterId: 'default_6', name: 'Thunder Wolf', rarity: 'RARE', baseStats: { hp: 95, attack: 22, defense: 12, speed: 16 }, description: 'A wolf that commands lightning.' },
      { characterId: 'default_7', name: 'Frost Phoenix', rarity: 'EPIC', baseStats: { hp: 110, attack: 25, defense: 18, speed: 14 }, description: 'A phoenix born from eternal ice.' },
      { characterId: 'default_8', name: 'Void Knight', rarity: 'EPIC', baseStats: { hp: 130, attack: 28, defense: 22, speed: 10 }, description: 'A knight from the void dimension.' },
      { characterId: 'default_9', name: 'Celestial Guardian', rarity: 'LEGENDARY', baseStats: { hp: 150, attack: 32, defense: 28, speed: 15 }, description: 'A divine protector from the heavens.' },
      { characterId: 'default_10', name: 'Chaos Emperor', rarity: 'MYTHIC', baseStats: { hp: 180, attack: 40, defense: 35, speed: 20 }, description: 'The ultimate being of chaos.' }
    ];
  }

  async onReady() {
    console.log('  📦 Drop module ready');
    
    for (const guild of this.bot.client.guilds.cache.values()) {
      await this.startDropsForServer(guild.id);
    }
  }

  async startDropsForServer(serverId) {
    if (this.dropIntervals.has(serverId)) {
      clearInterval(this.dropIntervals.get(serverId));
    }

    const config = await db.getServerConfig(serverId);
    if (!config) return;

    if (!config.drops?.enabled || !config.channels?.drops) {
      return;
    }

    const interval = (config.drops.interval || DROPS.DEFAULT_INTERVAL) * 1000;

    const dropInterval = setInterval(() => {
      this.spawnDrop(serverId);
    }, interval);

    this.dropIntervals.set(serverId, dropInterval);
    console.log(`  📦 Started drops for server ${serverId} (every ${interval/1000}s)`);
  }

  async stopDropsForServer(serverId) {
    if (this.dropIntervals.has(serverId)) {
      clearInterval(this.dropIntervals.get(serverId));
      this.dropIntervals.delete(serverId);
    }
  }

  async spawnDrop(serverId) {
    try {
      const config = await db.getServerConfig(serverId);
      if (!config || !config.drops?.enabled || !config.channels?.drops) {
        return;
      }

      if (this.activeDrops.has(serverId)) {
        const uncaught = (config.drops.uncaughtCount || 0) + 1;
        
        await db.updateServerConfig(serverId, {
          'drops.uncaughtCount': uncaught
        });

        if (uncaught >= DROPS.MAX_UNCAUGHT) {
          console.log(`  ⚠️ Too many uncaught drops for server ${serverId}, pausing...`);
          return;
        }
      }

      let characters = await db.getServerCharacters(serverId);
      
      if (characters.length === 0) {
        characters = this.defaultCharacters;
      }

      const rarity = selectRandomRarity();
      const character = selectRandomCharacter(characters, rarity) || selectRandomCharacter(characters);

      if (!character) {
        console.log(`  ⚠️ No characters available for server ${serverId}`);
        return;
      }

      const code = generateCatchCode();

      this.activeDrops.set(serverId, {
        character,
        code,
        timestamp: Date.now()
      });

      const guild = this.bot.client.guilds.cache.get(serverId);
      if (!guild) return;

      const channel = guild.channels.cache.get(config.channels.drops);
      if (!channel) return;

      const embed = dropEmbed(character, code, config);

      await channel.send({ embeds: [embed] });

      await db.updateServerConfig(serverId, {
        'stats.totalDrops': (config.stats?.totalDrops || 0) + 1,
        'drops.lastDrop': new Date()
      });

      setTimeout(() => {
        if (this.activeDrops.get(serverId)?.code === code) {
          this.activeDrops.delete(serverId);
        }
      }, DROPS.CATCH_TIMEOUT * 1000);

    } catch (error) {
      console.error(`Error spawning drop for ${serverId}:`, error);
    }
  }

  getActiveDrop(serverId) {
    return this.activeDrops.get(serverId);
  }

  clearDrop(serverId) {
    this.activeDrops.delete(serverId);
    
    db.updateServerConfig(serverId, {
      'drops.uncaughtCount': 0
    }).catch(console.error);
  }

  async forceDrop(serverId) {
    await this.spawnDrop(serverId);
  }
}

module.exports = DropModule;
