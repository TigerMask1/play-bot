const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

async function handleArenaCommand(interaction, data) {
  const userId = interaction.user.id;
  const userData = data.users[userId];

  if (!userData || !userData.started) {
    return interaction.reply({
      content: '❌ You need to use `!start` first before accessing the battle arena!',
      ephemeral: true
    });
  }

  if (!userData.selectedCharacter) {
    return interaction.reply({
      content: '❌ You need to select a character first! Use `!select <character>` to choose one.',
      ephemeral: true
    });
  }

  const activityUrl = `https://zoobot-zoki.onrender.com/activity/index.html`;

  const embed = new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle('🎮 Interactive Battle Arena')
    .setDescription(`**Get ready for real-time PvP action!**\n\n🕹️ **Controls:**\n• Joystick (bottom-left) - Move your character\n• Q, W, E, R - Use skills\n\n⚔️ **How to Play:**\n• Dodge enemy attacks with skill-based movement\n• Use your abilities strategically\n• Earn rewards based on your performance\n• Climb the leaderboard!\n\n💎 **Character:** ${userData.selectedCharacter}\n🏆 **Trophies:** ${userData.trophies || 200}\n\n*Click the button below to join the arena!*`)
    .setFooter({ text: 'Real-time battles • Skill-based combat' })
    .setTimestamp();

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setLabel('🚀 Launch Arena')
        .setStyle(ButtonStyle.Link)
        .setURL(activityUrl)
    );

  await interaction.reply({
    embeds: [embed],
    components: [row],
    ephemeral: false
  });
}

module.exports = {
  handleArenaCommand
};
