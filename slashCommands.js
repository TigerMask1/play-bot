const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ChannelType } = require('discord.js');

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

  const voiceChannel = interaction.member?.voice?.channel;
  
  if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
    return interaction.reply({
      content: '❌ You need to be in a voice channel to launch the arena!\n\nJoin a voice channel and try again.',
      ephemeral: true
    });
  }

  const applicationId = process.env.DISCORD_APPLICATION_ID;
  if (!applicationId) {
    return interaction.reply({
      content: '❌ Discord Activity is not configured. Please contact the bot owner.',
      ephemeral: true
    });
  }

  try {
    const invite = await voiceChannel.createInvite({
      targetType: 2,
      targetApplication: applicationId,
      maxAge: 3600,
      maxUses: 0
    });

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
          .setURL(invite.url)
      );

    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: false
    });
  } catch (error) {
    console.error('Error creating activity invite:', error);
    return interaction.reply({
      content: '❌ Failed to create activity invite. Make sure:\n1. Activities are enabled in Discord Developer Portal\n2. URL Mapping is configured correctly\n3. Bot has CREATE_INSTANT_INVITE permission',
      ephemeral: true
    });
  }
}

module.exports = {
  handleArenaCommand
};
