const { EmbedBuilder } = require('discord.js');
const { isMainServer, getServerConfig } = require('./serverConfigManager.js');

const PROMOTION_INTERVAL = 30 * 60 * 1000; // 30 minutes
// TODO: IMPORTANT - Update this with your actual main server invite link before deployment!
// This link is shown in promotional messages on non-main servers
const MAIN_SERVER_INVITE = 'https://discord.gg/yourinvitelink';

let promotionIntervals = new Map();
let client = null;

function startPromotionSystem(discordClient) {
  client = discordClient;

  client.guilds.cache.forEach(guild => {
    if (!isMainServer(guild.id)) {
      startPromotionsForServer(guild.id);
    }
  });

  console.log(`✅ Promotion system initialized for ${promotionIntervals.size} servers`);
}

function startPromotionsForServer(serverId) {
  if (isMainServer(serverId)) return;
  if (promotionIntervals.has(serverId)) {
    clearInterval(promotionIntervals.get(serverId));
  }

  const intervalId = setInterval(async () => {
    await sendPromotion(serverId);
  }, PROMOTION_INTERVAL);

  promotionIntervals.set(serverId, intervalId);
  console.log(`✅ Promotions started for server ${serverId}`);
}

function stopPromotionsForServer(serverId) {
  if (promotionIntervals.has(serverId)) {
    clearInterval(promotionIntervals.get(serverId));
    promotionIntervals.delete(serverId);
    console.log(`⏹️ Promotions stopped for server ${serverId}`);
  }
}

function stopPromotionSystem() {
  promotionIntervals.forEach((intervalId, serverId) => {
    clearInterval(intervalId);
  });
  promotionIntervals.clear();
  console.log('⏹️ Promotion system stopped for all servers!');
}

async function sendPromotion(serverId) {
  if (!client) return;

  try {
    const config = getServerConfig(serverId);
    if (!config || !config.dropChannelId) {
      console.log(`⚠️ No drop channel configured for server ${serverId}, skipping promotion`);
      return;
    }

    const channel = await client.channels.fetch(config.dropChannelId).catch(() => null);
    if (!channel) {
      console.error(`❌ Drop channel not found for server ${serverId}`);
      return;
    }

    const promoEmbed = new EmbedBuilder()
      .setColor('#FF6B35')
      .setTitle('🎉 Want More Features?')
      .setDescription(`**Join our main server for exclusive perks:**\n\n⚡ **Faster Drops** - Every 20 seconds (instead of 30s)\n🦁 **Zoo Raids** - Cooperative boss battles every hour\n🤖 **AI Battles** - Practice against AI opponents\n🎯 **Priority Events** - More events and rewards\n🏆 **Leaderboards** - Compete with the best players\n\n[Click here to join!](${MAIN_SERVER_INVITE})`)
      .setFooter({ text: 'This message appears every 30 minutes' })
      .setTimestamp();

    await channel.send({ embeds: [promoEmbed] });
  } catch (error) {
    console.error(`❌ Promotion error for server ${serverId}:`, error);
  }
}

module.exports = {
  startPromotionSystem,
  startPromotionsForServer,
  stopPromotionsForServer,
  stopPromotionSystem
};
