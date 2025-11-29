const { Events } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  
  async execute(bot, client) {
    console.log(`✅ Logged in as ${client.user.tag}!`);
    console.log(`🎮 Serving ${client.guilds.cache.size} servers`);
    
    client.user.setActivity('!help | PlayBot', { type: 0 });
    
    for (const [name, module] of bot.modules) {
      if (module.onReady) {
        try {
          await module.onReady();
          console.log(`  ✅ Module ${name} ready`);
        } catch (error) {
          console.error(`  ❌ Module ${name} failed to start:`, error);
        }
      }
    }
    
    console.log('✅ All systems ready!');
  }
};
