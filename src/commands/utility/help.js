const { EmbedBuilder } = require('discord.js');
const { COLORS, EMOJIS, BOT_NAME } = require('../../config/constants');

module.exports = {
  name: 'help',
  description: 'View available commands',
  aliases: ['h', 'commands', 'cmds'],
  cooldown: 3,
  
  async execute({ bot, message, args, prefix }) {
    if (args.length > 0) {
      const commandName = args[0].toLowerCase();
      let command = bot.commands.get(commandName);
      
      if (!command) {
        const alias = bot.aliases.get(commandName);
        if (alias) command = bot.commands.get(alias);
      }
      
      if (command) {
        const commandEmbed = new EmbedBuilder()
          .setColor(COLORS.INFO)
          .setTitle(`${EMOJIS.INFO} Command: ${prefix}${command.name}`)
          .setDescription(command.description || 'No description available.')
          .addFields(
            { name: 'Usage', value: `\`${prefix}${command.name}${command.usage ? ' ' + command.usage : ''}\``, inline: true },
            { name: 'Cooldown', value: `${command.cooldown || 0}s`, inline: true }
          );
        
        if (command.aliases?.length > 0) {
          commandEmbed.addFields({ 
            name: 'Aliases', 
            value: command.aliases.map(a => `\`${a}\``).join(', '), 
            inline: true 
          });
        }
        
        if (command.examples) {
          commandEmbed.addFields({
            name: 'Examples',
            value: command.examples.map(e => `\`${prefix}${e}\``).join('\n')
          });
        }
        
        return message.reply({ embeds: [commandEmbed] });
      }
      
      return message.reply(`❌ Command \`${commandName}\` not found. Use \`${prefix}help\` to see all commands.`);
    }
    
    const categories = {
      '🎮 Getting Started': ['start', 'help', 'profile', 'daily'],
      '📦 Collection': ['catch', 'collection', 'character', 'select'],
      '💰 Economy': ['balance', 'shop', 'buy', 'gift'],
      '⚔️ Battles': ['battle', 'stats'],
      '🏰 Clans': ['clan'],
      '🤝 Social': ['trade', 'leaderboard'],
      '🔧 Admin': ['setup', 'config', 'module', 'setchannel', 'setrole']
    };
    
    const helpEmbed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle(`${EMOJIS.INFO} ${BOT_NAME} Commands`)
      .setDescription(`Use \`${prefix}help <command>\` for detailed info on a command.`)
      .setFooter({ text: `${BOT_NAME} | Prefix: ${prefix}` })
      .setTimestamp();
    
    for (const [category, commands] of Object.entries(categories)) {
      const availableCommands = commands.filter(cmd => bot.commands.has(cmd));
      if (availableCommands.length > 0) {
        helpEmbed.addFields({
          name: category,
          value: availableCommands.map(cmd => `\`${cmd}\``).join(' '),
          inline: false
        });
      }
    }
    
    await message.reply({ embeds: [helpEmbed] });
  }
};
