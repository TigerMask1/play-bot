const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { COLORS, EMOJIS, BOT_NAME } = require('../config/constants');

function createEmbed(options = {}) {
  const embed = new EmbedBuilder()
    .setColor(options.color || COLORS.PRIMARY)
    .setTimestamp();

  if (options.title) embed.setTitle(options.title);
  if (options.description) embed.setDescription(options.description);
  if (options.thumbnail) embed.setThumbnail(options.thumbnail);
  if (options.image) embed.setImage(options.image);
  if (options.footer) {
    embed.setFooter({ 
      text: typeof options.footer === 'string' ? options.footer : options.footer.text,
      iconURL: options.footer.iconURL
    });
  } else {
    embed.setFooter({ text: BOT_NAME });
  }
  if (options.author) embed.setAuthor(options.author);
  if (options.fields) embed.addFields(options.fields);
  if (options.url) embed.setURL(options.url);

  return embed;
}

function successEmbed(title, description) {
  return createEmbed({
    color: COLORS.SUCCESS,
    title: `${EMOJIS.SUCCESS} ${title}`,
    description
  });
}

function errorEmbed(title, description) {
  return createEmbed({
    color: COLORS.ERROR,
    title: `${EMOJIS.ERROR} ${title}`,
    description
  });
}

function warningEmbed(title, description) {
  return createEmbed({
    color: COLORS.WARNING,
    title: `${EMOJIS.WARNING} ${title}`,
    description
  });
}

function infoEmbed(title, description) {
  return createEmbed({
    color: COLORS.INFO,
    title: `${EMOJIS.INFO} ${title}`,
    description
  });
}

function loadingEmbed(message = 'Loading...') {
  return createEmbed({
    color: COLORS.INFO,
    description: `${EMOJIS.LOADING} ${message}`
  });
}

function profileEmbed(user, serverUser, globalUser, serverConfig) {
  const currencyEmoji = serverConfig?.economy?.currencyEmoji || EMOJIS.COINS;
  const premiumEmoji = serverConfig?.economy?.premiumEmoji || EMOJIS.GEMS;
  
  return createEmbed({
    color: COLORS.PRIMARY,
    title: `${user.username}'s Profile`,
    thumbnail: user.displayAvatarURL({ dynamic: true }),
    fields: [
      {
        name: '📊 Level',
        value: `**${serverUser.level}** (${serverUser.xp} XP)`,
        inline: true
      },
      {
        name: `${currencyEmoji} Balance`,
        value: `**${serverUser.balance.toLocaleString()}**`,
        inline: true
      },
      {
        name: `${premiumEmoji} Gems`,
        value: `**${serverUser.gems.toLocaleString()}**`,
        inline: true
      },
      {
        name: `${EMOJIS.PLAYCOINS} PlayCoins`,
        value: `**${globalUser.playCoins.toLocaleString()}**`,
        inline: true
      },
      {
        name: `${EMOJIS.PLAYGEMS} PlayGems`,
        value: `**${globalUser.playGems.toLocaleString()}**`,
        inline: true
      },
      {
        name: '🌍 Global Level',
        value: `**${globalUser.globalLevel}**`,
        inline: true
      },
      {
        name: '📦 Collection',
        value: `**${serverUser.characters.length}** characters`,
        inline: true
      },
      {
        name: `${EMOJIS.BATTLE} Battles`,
        value: `**${serverUser.stats.battlesWon}**W / **${serverUser.stats.battlesLost}**L`,
        inline: true
      },
      {
        name: `${EMOJIS.CLAN} Clan`,
        value: serverUser.clanId ? `In a clan` : 'No clan',
        inline: true
      }
    ]
  });
}

function characterEmbed(character, owned = false) {
  const rarityColor = COLORS.RARITY[character.rarity] || COLORS.PRIMARY;
  
  const embed = createEmbed({
    color: rarityColor,
    title: `${getRarityEmoji(character.rarity)} ${character.name}`,
    description: character.description || 'A collectible character.',
    fields: [
      {
        name: 'Rarity',
        value: formatRarity(character.rarity),
        inline: true
      },
      {
        name: '❤️ HP',
        value: `${character.baseStats.hp}`,
        inline: true
      },
      {
        name: '⚔️ Attack',
        value: `${character.baseStats.attack}`,
        inline: true
      },
      {
        name: '🛡️ Defense',
        value: `${character.baseStats.defense}`,
        inline: true
      },
      {
        name: '💨 Speed',
        value: `${character.baseStats.speed}`,
        inline: true
      }
    ]
  });

  if (character.imageUrl) {
    embed.setThumbnail(character.imageUrl);
  }

  if (owned && character.obtainedAt) {
    embed.addFields({
      name: '📅 Obtained',
      value: `<t:${Math.floor(new Date(character.obtainedAt).getTime() / 1000)}:R>`,
      inline: true
    });
  }

  return embed;
}

function dropEmbed(character, code, serverConfig) {
  const rarityColor = COLORS.RARITY[character.rarity] || COLORS.PRIMARY;
  
  const embed = createEmbed({
    color: rarityColor,
    title: `${EMOJIS.DROP} A wild character appeared!`,
    description: `**${getRarityEmoji(character.rarity)} ${character.name}** (${formatRarity(character.rarity)})\n\nType \`!catch ${code}\` to claim!`,
    footer: { text: 'Be quick! This drop expires soon.' }
  });

  if (character.imageUrl) {
    embed.setImage(character.imageUrl);
  }

  return embed;
}

function leaderboardEmbed(title, entries, field, emoji = '🏆') {
  const description = entries.length > 0
    ? entries.map((entry, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `**${index + 1}.**`;
        const value = typeof entry[field] === 'number' ? entry[field].toLocaleString() : entry[field];
        return `${medal} **${entry.username}** - ${value}`;
      }).join('\n')
    : 'No entries yet.';

  return createEmbed({
    color: COLORS.PRIMARY,
    title: `${emoji} ${title}`,
    description
  });
}

function shopEmbed(items, serverConfig, page = 1, totalPages = 1) {
  const currencyEmoji = serverConfig?.economy?.currencyEmoji || EMOJIS.COINS;
  
  const description = items.length > 0
    ? items.map((item, index) => {
        return `**${index + 1}.** ${item.emoji || '📦'} **${item.name}**\n   └ ${currencyEmoji} ${item.price.toLocaleString()} - ${item.description}`;
      }).join('\n\n')
    : 'The shop is empty.';

  return createEmbed({
    color: COLORS.PRIMARY,
    title: '🛒 Shop',
    description,
    footer: { text: `Page ${page}/${totalPages} | Use !buy <item> to purchase` }
  });
}

function getRarityEmoji(rarity) {
  const emojis = {
    COMMON: '⚪',
    UNCOMMON: '🟢',
    RARE: '🔵',
    EPIC: '🟣',
    LEGENDARY: '🟠',
    MYTHIC: '🔴'
  };
  return emojis[rarity] || '⚪';
}

function formatRarity(rarity) {
  return rarity.charAt(0) + rarity.slice(1).toLowerCase();
}

function createButton(options) {
  const button = new ButtonBuilder()
    .setCustomId(options.customId)
    .setLabel(options.label)
    .setStyle(options.style || ButtonStyle.Primary);
  
  if (options.emoji) button.setEmoji(options.emoji);
  if (options.disabled) button.setDisabled(true);
  if (options.url) button.setURL(options.url);
  
  return button;
}

function createButtonRow(...buttons) {
  return new ActionRowBuilder().addComponents(...buttons);
}

function createPaginationButtons(page, totalPages, prefix = '') {
  return createButtonRow(
    createButton({
      customId: `${prefix}first`,
      label: '<<',
      style: ButtonStyle.Secondary,
      disabled: page === 1
    }),
    createButton({
      customId: `${prefix}prev`,
      label: '<',
      style: ButtonStyle.Secondary,
      disabled: page === 1
    }),
    createButton({
      customId: `${prefix}page`,
      label: `${page}/${totalPages}`,
      style: ButtonStyle.Primary,
      disabled: true
    }),
    createButton({
      customId: `${prefix}next`,
      label: '>',
      style: ButtonStyle.Secondary,
      disabled: page === totalPages
    }),
    createButton({
      customId: `${prefix}last`,
      label: '>>',
      style: ButtonStyle.Secondary,
      disabled: page === totalPages
    })
  );
}

module.exports = {
  createEmbed,
  successEmbed,
  errorEmbed,
  warningEmbed,
  infoEmbed,
  loadingEmbed,
  profileEmbed,
  characterEmbed,
  dropEmbed,
  leaderboardEmbed,
  shopEmbed,
  getRarityEmoji,
  formatRarity,
  createButton,
  createButtonRow,
  createPaginationButtons
};
