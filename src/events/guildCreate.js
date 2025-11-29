const { Events, EmbedBuilder } = require('discord.js');
const { COLORS, BOT_NAME } = require('../config/constants');

module.exports = {
  name: Events.GuildCreate,
  once: false,
  
  async execute(bot, guild) {
    console.log(`✅ Joined new server: ${guild.name} (${guild.id})`);
    
    await bot.ensureServerConfig(guild.id, guild.name);
    
    try {
      const owner = await guild.fetchOwner();
      
      const welcomeEmbed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle(`👋 Thanks for adding ${BOT_NAME}!`)
        .setDescription(`**${BOT_NAME}** is a modular community platform where you can create your own character collection game!

**🚀 Quick Setup:**

**1. Set Channels**
\`!setchannel drops #channel\` - Where drops appear
\`!setchannel events #channel\` - Event announcements
\`!setchannel announcements #channel\` - Bot announcements

**2. Configure Roles**
\`!setrole admin @role\` - Server bot admins
\`!setrole moderator @role\` - Moderators
\`!setrole vip @role\` - VIP members

**3. Customize**
\`!config currency name Coins\` - Set currency name
\`!config currency emoji 🪙\` - Set currency emoji
\`!config prefix !\` - Change command prefix

**4. Add Characters**
\`!character create\` - Create custom characters

**📚 Commands**
\`!help\` - View all commands
\`!modules\` - View/toggle features

**🌍 Global Economy**
Your server has its own economy, but players also earn PlayCoins and PlayGems that work across all servers!

Need help? Use \`!help\` or check the documentation.`)
        .setFooter({ text: `${BOT_NAME} - Community Collection Platform` })
        .setTimestamp();
      
      await owner.send({ embeds: [welcomeEmbed] }).catch(() => {
        console.log(`Could not DM owner of ${guild.name}`);
      });
    } catch (error) {
      console.error('Error sending welcome message:', error);
    }
  }
};
