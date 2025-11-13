const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ChannelType } = require('discord.js');

async function handleArenaCommand(interaction, data) {
  const userId = interaction.user.id;
  const opponent = interaction.options.getUser('opponent');
  const userData = data.users[userId];

  // Check if user is challenging themselves
  if (opponent.id === userId) {
    return interaction.reply({
      content: '❌ You cannot challenge yourself! Pick a real opponent.',
      ephemeral: true
    });
  }

  // Check if opponent is a bot
  if (opponent.bot) {
    return interaction.reply({
      content: '❌ You cannot challenge bots! Challenge a real player instead.',
      ephemeral: true
    });
  }

  // Check challenger's data
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

  // Check opponent's data
  const opponentData = data.users[opponent.id];
  if (!opponentData || !opponentData.started) {
    return interaction.reply({
      content: `❌ ${opponent.username} hasn't started playing yet! They need to use \`!start\` first.`,
      ephemeral: true
    });
  }

  if (!opponentData.selectedCharacter) {
    return interaction.reply({
      content: `❌ ${opponent.username} hasn't selected a character yet!`,
      ephemeral: true
    });
  }

  // Check if user is in a voice channel, if not, offer to create one
  let voiceChannel = interaction.member?.voice?.channel;
  
  if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
    return interaction.reply({
      content: '❌ You need to be in a voice channel to launch the arena!\n\n**Quick Steps:**\n1. Join any voice channel in this server\n2. Run this command again\n\n**Note:** You can mute yourself - you don\'t need voice chat, just need to be in a voice channel for Discord Activities to work!',
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
    // Create voice channel activity invite
    const invite = await voiceChannel.createInvite({
      targetType: 2,
      targetApplication: applicationId,
      maxAge: 3600,
      maxUses: 0
    });

    console.log(`✅ ${interaction.user.tag} challenged ${opponent.tag} to arena battle`);

    const embed = new EmbedBuilder()
      .setColor('#FF4500')
      .setTitle('⚔️ Arena Battle Challenge!')
      .setDescription(`**${interaction.user.username}** has challenged **${opponent.username}** to a 1v1 battle!\n\n🎮 **Game Mode:** Real-time Arena Combat\n🏆 **Stakes:** Honor and Glory!\n\n**${interaction.user.username}'s Character:** ${userData.selectedCharacter}\n**${opponent.username}'s Character:** ${opponentData.selectedCharacter}\n\n💡 **How to Join:**\n1. Join voice channel: **${voiceChannel.name}**\n2. Click "🚀 Join Arena" button below\n3. The game will launch automatically inside Discord!\n\n🕹️ **Controls:**\n• Joystick (bottom-left) - Move your character\n• 4 Attack Buttons (bottom-right) - Use abilities\n\n**Note:** You can mute yourself! Voice chat is optional, you just need to be in the voice channel for the activity to work.\n\n*First to defeat their opponent wins!*`)
      .setFooter({ text: '1v1 Arena Battle • Real-time Combat • Mobile & Desktop Supported' })
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setLabel('🚀 Join Arena')
          .setStyle(ButtonStyle.Link)
          .setURL(invite.url)
      );

    await interaction.reply({
      content: `🎮 ${opponent}, you've been challenged to an arena battle by ${interaction.user}!\n\n**👉 Join ${voiceChannel} and click "🚀 Join Arena" to play!**`,
      embeds: [embed],
      components: [row],
      ephemeral: false
    });
  } catch (error) {
    console.error('❌ Error creating activity invite:', error);
    return interaction.reply({
      content: '❌ Failed to create activity invite. Make sure:\n1. Activities are enabled in Discord Developer Portal\n2. URL Mapping is configured correctly\n3. Bot has CREATE_INSTANT_INVITE permission',
      ephemeral: true
    });
  }
}

module.exports = {
  handleArenaCommand
};
