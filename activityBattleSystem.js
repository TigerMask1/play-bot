const ACTIVITY_CONFIG = require('./activityConfig');

let activityModule = null;

function initializeActivitySystem(httpServer, app, data) {
  if (!ACTIVITY_CONFIG.ENABLED) {
    console.log('📴 Discord Activity Battle System is DISABLED');
    return false;
  }

  try {
    activityModule = require('./activity/server');
    activityModule.attachToServer(httpServer, app, data);
    console.log('🎮 Discord Activity Battle System initialized successfully!');
    console.log('✨ Players can now use !battleactivity to launch the interactive arena!');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Activity Battle System:', error.message);
    return false;
  }
}

async function handleBattleActivityCommand(message, data) {
  if (!ACTIVITY_CONFIG.ENABLED) {
    return message.reply('⚠️ The interactive battle arena is currently disabled.');
  }

  const userData = data.users[message.author.id];
  if (!userData || !userData.started) {
    return message.reply('❌ You need to use `!start` first before accessing the battle arena!');
  }

  if (!userData.selectedCharacter) {
    return message.reply('❌ You need to select a character first! Use `!select <character>` to choose one.');
  }

  const { generateToken } = require('./activityAuth');
  const token = generateToken(message.author.id);
  
  let domain;
  if (process.env.REPLIT_DEV_DOMAIN) {
    domain = process.env.REPLIT_DEV_DOMAIN;
  } else if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
    domain = `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
  } else {
    domain = `localhost:${process.env.PORT || 5000}`;
  }
  
  const protocol = domain.includes('localhost') ? 'http' : 'https';
  const activityURL = `${protocol}://${domain}/activity/index.html#userId=${message.author.id}&token=${token}`;

  const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

  const embed = new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle('🎮 Interactive Battle Arena')
    .setDescription(`**Get ready for real-time PvP action!**\n\n🕹️ **Controls:**\n• Joystick (bottom-left) - Move your character\n• Q, W, E, R - Use skills\n\n⚔️ **How to Play:**\n• Dodge enemy attacks with skill-based movement\n• Use your abilities strategically\n• Earn rewards based on your performance\n• Climb the leaderboard!\n\n💎 **Character:** ${userData.selectedCharacter}\n🏆 **Level:** ${userData.level || 1}\n\n*Click the button below to join the arena!*`)
    .setThumbnail('https://cdn.discordapp.com/emojis/1234567890.png')
    .setFooter({ text: 'Real-time battles • Skill-based combat • Dopamine rush!' })
    .setTimestamp();

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setLabel('🚀 Launch Battle Arena')
        .setStyle(ButtonStyle.Link)
        .setURL(activityURL),
      new ButtonBuilder()
        .setCustomId('activity_info')
        .setLabel('ℹ️ Info')
        .setStyle(ButtonStyle.Secondary)
    );

  const replyMessage = await message.reply({ 
    embeds: [embed], 
    components: [row] 
  });

  const collector = replyMessage.createMessageComponentCollector({ time: 60000 });

  collector.on('collect', async (interaction) => {
    if (interaction.customId === 'activity_info') {
      const infoEmbed = new EmbedBuilder()
        .setColor('#00BFFF')
        .setTitle('📖 Battle Arena Info')
        .setDescription(`
**Skills Breakdown:**

🔴 **Q - Quick Shot** (20 energy)
• Fast projectile attack
• 2 second cooldown
• 25 damage

🔵 **W - Triple Shot** (30 energy)
• Fires 3 projectiles in spread
• 3 second cooldown
• 15 damage per projectile

🟢 **E - Area Blast** (40 energy)
• Damages all enemies in range
• 5 second cooldown
• 35 damage

🟡 **R - Ultimate** (50 energy)
• Massive 360° attack
• 10 second cooldown
• 60 damage

**Tips:**
• Energy regenerates over time
• Move strategically to dodge attacks
• Combo your skills for maximum damage
• Watch your health bar!
        `)
        .setFooter({ text: 'Master these skills to dominate!' });

      await interaction.reply({ embeds: [infoEmbed], ephemeral: true });
    }
  });

  collector.on('end', () => {
    row.components[1].setDisabled(true);
    replyMessage.edit({ components: [row] }).catch(() => {});
  });
}

async function recordBattleRewards(userId, data, kills, damage, survivalTime) {
  if (!ACTIVITY_CONFIG.ENABLED) return;

  const userData = data.users[userId];
  if (!userData) return;

  const baseReward = 50;
  const killBonus = kills * 25;
  const damageBonus = Math.floor(damage / 10);
  const survivalBonus = Math.floor(survivalTime / 60) * 10;

  const totalCoins = baseReward + killBonus + damageBonus + survivalBonus;
  const totalGems = Math.floor(kills * 2 + Math.floor(damage / 100));

  userData.coins = (userData.coins || 0) + totalCoins;
  userData.gems = (userData.gems || 0) + totalGems;

  if (!userData.battleStats) {
    userData.battleStats = {
      arenaKills: 0,
      arenaDamage: 0,
      arenaMatches: 0,
      arenaWins: 0
    };
  }

  userData.battleStats.arenaKills += kills;
  userData.battleStats.arenaDamage += damage;
  userData.battleStats.arenaMatches += 1;

  if (kills >= 5) {
    userData.battleStats.arenaWins += 1;
  }

  return {
    coins: totalCoins,
    gems: totalGems,
    kills,
    damage,
    survivalTime
  };
}

module.exports = {
  initializeActivitySystem,
  handleBattleActivityCommand,
  recordBattleRewards,
  isEnabled: () => ACTIVITY_CONFIG.ENABLED
};
