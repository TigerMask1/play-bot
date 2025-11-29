const { profileEmbed } = require('../../utils/embeds');

module.exports = {
  name: 'profile',
  description: 'View your profile and stats',
  aliases: ['p', 'me', 'stats'],
  cooldown: 3,
  requiresStart: true,
  
  async execute({ message, args, serverUser, globalUser, serverConfig }) {
    let targetUser = message.author;
    let targetServerUser = serverUser;
    let targetGlobalUser = globalUser;
    
    if (args.length > 0) {
      const mentioned = message.mentions.users.first();
      if (mentioned) {
        targetUser = mentioned;
        
        const db = require('../../database/MongoDB');
        targetServerUser = await db.getServerUser(message.guild.id, mentioned.id);
        targetGlobalUser = await db.getGlobalUser(mentioned.id);
        
        if (!targetServerUser || !targetServerUser.started) {
          return message.reply(`❌ **${mentioned.username}** hasn't started playing yet!`);
        }
      }
    }
    
    const embed = profileEmbed(targetUser, targetServerUser, targetGlobalUser, serverConfig);
    await message.reply({ embeds: [embed] });
  }
};
