const { EmbedBuilder } = require('discord.js');
const { COLORS, EMOJIS, CLANS } = require('../../config/constants');
const { getDefaultClan } = require('../../config/defaults');
const { sanitizeInput, formatNumber } = require('../../utils/helpers');
const db = require('../../database/MongoDB');

module.exports = {
  name: 'clan',
  description: 'Manage your clan',
  aliases: ['c', 'guild', 'team'],
  usage: '<action> [args]',
  cooldown: 5,
  requiresStart: true,
  module: 'clans',
  
  async execute({ message, args, serverUser, serverConfig, prefix }) {
    const action = args[0]?.toLowerCase() || 'view';
    
    switch (action) {
      case 'create':
        return createClan(message, args.slice(1), serverUser, serverConfig, prefix);
      case 'join':
        return joinClan(message, args.slice(1), serverUser, prefix);
      case 'leave':
        return leaveClan(message, serverUser, prefix);
      case 'info':
      case 'view':
        return viewClan(message, args.slice(1), serverUser, prefix);
      case 'members':
        return viewMembers(message, serverUser, prefix);
      case 'donate':
        return donateToClan(message, args.slice(1), serverUser, serverConfig, prefix);
      case 'list':
        return listClans(message, prefix);
      default:
        return showClanHelp(message, prefix);
    }
  }
};

async function showClanHelp(message, prefix) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle(`${EMOJIS.CLAN} Clan Commands`)
    .setDescription('Build your community within a clan!')
    .addFields(
      { name: `${prefix}clan create <name> <tag>`, value: 'Create a new clan', inline: false },
      { name: `${prefix}clan join <name>`, value: 'Join an existing clan', inline: false },
      { name: `${prefix}clan leave`, value: 'Leave your current clan', inline: false },
      { name: `${prefix}clan info [name]`, value: 'View clan information', inline: false },
      { name: `${prefix}clan members`, value: 'View clan members', inline: false },
      { name: `${prefix}clan donate <amount>`, value: 'Donate coins to clan treasury', inline: false },
      { name: `${prefix}clan list`, value: 'View all clans', inline: false }
    )
    .setFooter({ text: `Creating a clan costs ${CLANS.CREATE_COST.toLocaleString()} coins` });
  
  await message.reply({ embeds: [embed] });
}

async function createClan(message, args, serverUser, serverConfig, prefix) {
  if (serverUser.clanId) {
    return message.reply('❌ You are already in a clan! Leave first with `!clan leave`');
  }
  
  if (args.length < 2) {
    return message.reply(`❌ Usage: \`${prefix}clan create <name> <tag>\`\nExample: \`${prefix}clan create Dragon Warriors DW\``);
  }
  
  const tag = args.pop().toUpperCase();
  const name = args.join(' ');
  
  if (name.length < CLANS.NAME_MIN_LENGTH || name.length > CLANS.NAME_MAX_LENGTH) {
    return message.reply(`❌ Clan name must be ${CLANS.NAME_MIN_LENGTH}-${CLANS.NAME_MAX_LENGTH} characters!`);
  }
  
  if (tag.length !== CLANS.TAG_LENGTH) {
    return message.reply(`❌ Clan tag must be exactly ${CLANS.TAG_LENGTH} characters!`);
  }
  
  if (serverUser.balance < CLANS.CREATE_COST) {
    return message.reply(`❌ Creating a clan costs **${CLANS.CREATE_COST.toLocaleString()}** coins! You have **${serverUser.balance.toLocaleString()}**.`);
  }
  
  const existingClan = await db.getClanByName(message.guild.id, name);
  if (existingClan) {
    return message.reply('❌ A clan with that name already exists!');
  }
  
  const clan = getDefaultClan(message.guild.id, {
    name: sanitizeInput(name, 30),
    tag: sanitizeInput(tag, 4),
    leaderId: message.author.id
  });
  
  await db.createServerClan(clan);
  
  await db.incrementServerUser(message.guild.id, message.author.id, {
    balance: -CLANS.CREATE_COST
  });
  
  await db.updateServerUser(message.guild.id, message.author.id, {
    clanId: clan.clanId
  });
  
  const embed = new EmbedBuilder()
    .setColor(COLORS.SUCCESS)
    .setTitle(`${EMOJIS.CLAN} Clan Created!`)
    .setDescription(`**[${clan.tag}] ${clan.name}** has been founded!`)
    .addFields(
      { name: 'Leader', value: `<@${message.author.id}>`, inline: true },
      { name: 'Tag', value: `[${clan.tag}]`, inline: true },
      { name: 'Cost', value: `${CLANS.CREATE_COST.toLocaleString()} coins`, inline: true }
    )
    .setFooter({ text: `Invite members with: ${prefix}clan join ${clan.name}` })
    .setTimestamp();
  
  await message.reply({ embeds: [embed] });
}

async function joinClan(message, args, serverUser, prefix) {
  if (serverUser.clanId) {
    return message.reply('❌ You are already in a clan! Leave first with `!clan leave`');
  }
  
  if (args.length === 0) {
    return message.reply(`❌ Usage: \`${prefix}clan join <clan name>\``);
  }
  
  const clanName = args.join(' ');
  const clan = await db.getClanByName(message.guild.id, clanName);
  
  if (!clan) {
    return message.reply(`❌ Clan **${clanName}** not found! Use \`${prefix}clan list\` to see available clans.`);
  }
  
  if (clan.members.length >= CLANS.MAX_MEMBERS) {
    return message.reply('❌ This clan is full!');
  }
  
  await db.updateServerClan(message.guild.id, clan.clanId, {
    members: [...clan.members, message.author.id]
  });
  
  await db.updateServerUser(message.guild.id, message.author.id, {
    clanId: clan.clanId
  });
  
  const embed = new EmbedBuilder()
    .setColor(COLORS.SUCCESS)
    .setTitle(`${EMOJIS.SUCCESS} Joined Clan!`)
    .setDescription(`You are now a member of **[${clan.tag}] ${clan.name}**!`)
    .addFields(
      { name: 'Members', value: `${clan.members.length + 1}/${CLANS.MAX_MEMBERS}`, inline: true },
      { name: 'Level', value: `${clan.level}`, inline: true }
    )
    .setTimestamp();
  
  await message.reply({ embeds: [embed] });
}

async function leaveClan(message, serverUser, prefix) {
  if (!serverUser.clanId) {
    return message.reply('❌ You are not in a clan!');
  }
  
  const clan = await db.getServerClan(message.guild.id, serverUser.clanId);
  
  if (!clan) {
    await db.updateServerUser(message.guild.id, message.author.id, { clanId: null });
    return message.reply('❌ Your clan no longer exists.');
  }
  
  if (clan.leaderId === message.author.id) {
    if (clan.members.length > 1) {
      return message.reply('❌ You cannot leave as leader while the clan has other members! Transfer leadership first or disband.');
    }
    
    await db.deleteServerClan(message.guild.id, clan.clanId);
    await db.updateServerUser(message.guild.id, message.author.id, { clanId: null });
    
    return message.reply(`${EMOJIS.SUCCESS} Clan **[${clan.tag}] ${clan.name}** has been disbanded.`);
  }
  
  const newMembers = clan.members.filter(id => id !== message.author.id);
  await db.updateServerClan(message.guild.id, clan.clanId, { members: newMembers });
  await db.updateServerUser(message.guild.id, message.author.id, { clanId: null });
  
  await message.reply(`${EMOJIS.SUCCESS} You have left **[${clan.tag}] ${clan.name}**.`);
}

async function viewClan(message, args, serverUser, prefix) {
  let clan;
  
  if (args.length > 0) {
    const clanName = args.join(' ');
    clan = await db.getClanByName(message.guild.id, clanName);
  } else if (serverUser.clanId) {
    clan = await db.getServerClan(message.guild.id, serverUser.clanId);
  }
  
  if (!clan) {
    return message.reply(`❌ Clan not found! ${serverUser.clanId ? '' : `Use \`${prefix}clan join\` to join one!`}`);
  }
  
  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle(`${EMOJIS.CLAN} [${clan.tag}] ${clan.name}`)
    .setDescription(clan.description || 'No description set.')
    .addFields(
      { name: 'Leader', value: `<@${clan.leaderId}>`, inline: true },
      { name: 'Level', value: `${clan.level}`, inline: true },
      { name: 'Members', value: `${clan.members.length}/${CLANS.MAX_MEMBERS}`, inline: true },
      { name: 'Treasury', value: `${formatNumber(clan.treasury)} coins`, inline: true },
      { name: 'Battles Won', value: `${clan.stats?.battlesWon || 0}`, inline: true },
      { name: 'War Wins', value: `${clan.stats?.warWins || 0}`, inline: true }
    )
    .setFooter({ text: `Created ${new Date(clan.createdAt).toLocaleDateString()}` })
    .setTimestamp();
  
  await message.reply({ embeds: [embed] });
}

async function viewMembers(message, serverUser, prefix) {
  if (!serverUser.clanId) {
    return message.reply('❌ You are not in a clan!');
  }
  
  const clan = await db.getServerClan(message.guild.id, serverUser.clanId);
  if (!clan) {
    return message.reply('❌ Clan not found!');
  }
  
  const memberList = clan.members.map((id, index) => {
    const isLeader = id === clan.leaderId;
    const isOfficer = clan.officers?.includes(id);
    const role = isLeader ? '👑' : isOfficer ? '⭐' : '';
    return `${index + 1}. <@${id}> ${role}`;
  }).join('\n');
  
  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle(`${EMOJIS.CLAN} [${clan.tag}] ${clan.name} - Members`)
    .setDescription(memberList || 'No members.')
    .setFooter({ text: `${clan.members.length}/${CLANS.MAX_MEMBERS} members | 👑 Leader | ⭐ Officer` });
  
  await message.reply({ embeds: [embed] });
}

async function donateToClan(message, args, serverUser, serverConfig, prefix) {
  if (!serverUser.clanId) {
    return message.reply('❌ You are not in a clan!');
  }
  
  const amount = parseInt(args[0]);
  
  if (isNaN(amount) || amount <= 0) {
    return message.reply(`❌ Please specify a valid amount! Usage: \`${prefix}clan donate <amount>\``);
  }
  
  if (amount > serverUser.balance) {
    return message.reply(`❌ You don't have enough coins! Your balance: **${serverUser.balance.toLocaleString()}**`);
  }
  
  const clan = await db.getServerClan(message.guild.id, serverUser.clanId);
  if (!clan) {
    return message.reply('❌ Clan not found!');
  }
  
  await db.incrementServerUser(message.guild.id, message.author.id, {
    balance: -amount
  });
  
  await db.updateServerClan(message.guild.id, clan.clanId, {
    treasury: clan.treasury + amount,
    'stats.totalDonations': (clan.stats?.totalDonations || 0) + amount
  });
  
  const currencyEmoji = serverConfig.economy?.currencyEmoji || EMOJIS.COINS;
  
  await message.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(COLORS.SUCCESS)
        .setDescription(`${EMOJIS.SUCCESS} Donated ${currencyEmoji} **${amount.toLocaleString()}** to **[${clan.tag}] ${clan.name}**!\nNew treasury: ${currencyEmoji} **${(clan.treasury + amount).toLocaleString()}**`)
    ]
  });
}

async function listClans(message, prefix) {
  const clans = await db.getServerClans(message.guild.id);
  
  if (clans.length === 0) {
    return message.reply(`${EMOJIS.WARNING} No clans exist yet! Create one with \`${prefix}clan create <name> <tag>\``);
  }
  
  const clanList = clans
    .sort((a, b) => b.level - a.level)
    .slice(0, 10)
    .map((clan, index) => {
      return `**${index + 1}.** [${clan.tag}] **${clan.name}** - Lv.${clan.level} (${clan.members.length} members)`;
    })
    .join('\n');
  
  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle(`${EMOJIS.CLAN} Server Clans`)
    .setDescription(clanList)
    .setFooter({ text: `Use ${prefix}clan join <name> to join a clan` })
    .setTimestamp();
  
  await message.reply({ embeds: [embed] });
}
