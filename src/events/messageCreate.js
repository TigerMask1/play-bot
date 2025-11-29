const { Events } = require('discord.js');

module.exports = {
  name: Events.MessageCreate,
  once: false,
  
  async execute(bot, message) {
    if (message.author.bot) return;
    if (!message.guild) return;
  }
};
