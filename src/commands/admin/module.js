const { EmbedBuilder } = require('discord.js');
const { COLORS, EMOJIS, PERMISSIONS, MODULES } = require('../../config/constants');
const { hasPermission } = require('../../utils/permissions');
const db = require('../../database/MongoDB');

module.exports = {
  name: 'module',
  description: 'Enable or disable bot modules',
  aliases: ['modules', 'features'],
  usage: '<enable|disable> <module>',
  cooldown: 5,
  
  async execute({ message, args, serverConfig, prefix }) {
    if (!hasPermission(message.member, PERMISSIONS.ADMIN, serverConfig)) {
      return message.reply('❌ You need Admin permissions to use this command!');
    }
    
    if (args.length === 0) {
      return showModuleStatus(message, serverConfig, prefix);
    }
    
    const action = args[0].toLowerCase();
    const moduleName = args[1]?.toLowerCase();
    
    if (!['enable', 'disable', 'on', 'off'].includes(action)) {
      return message.reply(`❌ Invalid action! Use \`enable\` or \`disable\`.`);
    }
    
    const moduleKeys = Object.values(MODULES);
    
    if (!moduleName || !moduleKeys.includes(moduleName)) {
      return message.reply(`❌ Invalid module! Available modules: ${moduleKeys.join(', ')}`);
    }
    
    const enable = action === 'enable' || action === 'on';
    
    await db.updateServerConfig(message.guild.id, {
      [`modules.${moduleName}`]: enable
    });
    
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(enable ? COLORS.SUCCESS : COLORS.WARNING)
          .setDescription(`${enable ? EMOJIS.SUCCESS : EMOJIS.WARNING} Module **${moduleName}** has been ${enable ? 'enabled' : 'disabled'}`)
      ]
    });
  }
};

async function showModuleStatus(message, serverConfig, prefix) {
  const modules = serverConfig.modules || {};
  
  const moduleList = Object.values(MODULES).map(mod => {
    const enabled = modules[mod] !== false;
    return `${enabled ? '✅' : '❌'} **${mod}** - ${enabled ? 'Enabled' : 'Disabled'}`;
  }).join('\n');
  
  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle('🔌 Bot Modules')
    .setDescription(`Toggle features with \`${prefix}module <enable|disable> <module>\`\n\n${moduleList}`)
    .addFields({
      name: 'Module Descriptions',
      value: `**collection** - Character collection system
**battles** - PvP/PvE battle system
**clans** - Clan creation and wars
**trading** - Player-to-player trading
**drops** - Automatic character drops
**events** - Server events and competitions
**quests** - Daily/weekly quests
**shop** - In-game shop
**leaderboards** - Rankings and statistics`,
      inline: false
    })
    .setFooter({ text: 'Disabled modules hide their commands' })
    .setTimestamp();
  
  await message.reply({ embeds: [embed] });
}
