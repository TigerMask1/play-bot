const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { COLORS, EMOJIS, ECONOMY, BATTLES } = require('../../config/constants');
const { getRarityEmoji } = require('../../utils/embeds');
const { calculateBattleStats, calculateDamage, randomInt, createProgressBar } = require('../../utils/helpers');
const db = require('../../database/MongoDB');

module.exports = {
  name: 'battle',
  description: 'Battle another player',
  aliases: ['fight', 'duel', 'pvp'],
  usage: '@user',
  cooldown: 30,
  requiresStart: true,
  module: 'battles',
  
  async execute({ message, args, serverUser, serverConfig, prefix }) {
    const opponent = message.mentions.users.first();
    
    if (!opponent) {
      return message.reply(`❌ Please mention a user to battle! Usage: \`${prefix}battle @user\``);
    }
    
    if (opponent.id === message.author.id) {
      return message.reply('❌ You cannot battle yourself!');
    }
    
    if (opponent.bot) {
      return message.reply('❌ You cannot battle a bot!');
    }
    
    const opponentUser = await db.getServerUser(message.guild.id, opponent.id);
    
    if (!opponentUser || !opponentUser.started) {
      return message.reply(`❌ **${opponent.username}** hasn't started playing yet!`);
    }
    
    const playerChar = serverUser.characters.find(c => c.characterId === serverUser.selectedCharacter);
    const opponentChar = opponentUser.characters.find(c => c.characterId === opponentUser.selectedCharacter);
    
    if (!playerChar) {
      return message.reply(`❌ You don't have a character selected! Use \`${prefix}select <character>\` first.`);
    }
    
    if (!opponentChar) {
      return message.reply(`❌ **${opponent.username}** doesn't have a character selected!`);
    }
    
    const challengeEmbed = new EmbedBuilder()
      .setColor(COLORS.WARNING)
      .setTitle(`${EMOJIS.BATTLE} Battle Challenge!`)
      .setDescription(`**${message.author.username}** challenges **${opponent.username}** to a battle!`)
      .addFields(
        {
          name: `${message.author.username}'s Fighter`,
          value: `${getRarityEmoji(playerChar.rarity)} **${playerChar.name}** (Lv.${playerChar.level || 1})`,
          inline: true
        },
        {
          name: `${opponent.username}'s Fighter`,
          value: `${getRarityEmoji(opponentChar.rarity)} **${opponentChar.name}** (Lv.${opponentChar.level || 1})`,
          inline: true
        }
      )
      .setFooter({ text: 'Challenge expires in 60 seconds' });
    
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`battle_accept_${message.author.id}_${opponent.id}`)
        .setLabel('Accept')
        .setStyle(ButtonStyle.Success)
        .setEmoji('⚔️'),
      new ButtonBuilder()
        .setCustomId(`battle_decline_${message.author.id}_${opponent.id}`)
        .setLabel('Decline')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌')
    );
    
    const challengeMsg = await message.reply({ embeds: [challengeEmbed], components: [row] });
    
    const collector = challengeMsg.createMessageComponentCollector({
      filter: (i) => i.user.id === opponent.id,
      time: 60000,
      max: 1
    });
    
    collector.on('collect', async (interaction) => {
      if (interaction.customId.startsWith('battle_decline')) {
        await interaction.update({
          embeds: [
            new EmbedBuilder()
              .setColor(COLORS.ERROR)
              .setDescription(`${EMOJIS.ERROR} **${opponent.username}** declined the battle challenge.`)
          ],
          components: []
        });
        return;
      }
      
      await interaction.update({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.INFO)
            .setDescription(`${EMOJIS.LOADING} Battle starting...`)
        ],
        components: []
      });
      
      await runBattle(message, {
        player1: { user: message.author, serverUser, character: playerChar },
        player2: { user: opponent, serverUser: opponentUser, character: opponentChar },
        serverConfig
      });
    });
    
    collector.on('end', (collected) => {
      if (collected.size === 0) {
        challengeMsg.edit({
          embeds: [
            new EmbedBuilder()
              .setColor(COLORS.WARNING)
              .setDescription(`${EMOJIS.WARNING} Battle challenge expired.`)
          ],
          components: []
        }).catch(() => {});
      }
    });
  }
};

async function runBattle(message, { player1, player2, serverConfig }) {
  const p1Stats = calculateBattleStats(player1.character.baseStats, player1.character.level || 1);
  const p2Stats = calculateBattleStats(player2.character.baseStats, player2.character.level || 1);
  
  let p1HP = p1Stats.hp;
  let p2HP = p2Stats.hp;
  const p1MaxHP = p1Stats.hp;
  const p2MaxHP = p2Stats.hp;
  
  const battleLog = [];
  let turn = 1;
  
  let first = p1Stats.speed >= p2Stats.speed ? 'p1' : 'p2';
  if (p1Stats.speed === p2Stats.speed) {
    first = Math.random() > 0.5 ? 'p1' : 'p2';
  }
  
  while (p1HP > 0 && p2HP > 0 && turn <= 20) {
    const attacker = first === 'p1' ? player1 : player2;
    const defender = first === 'p1' ? player2 : player1;
    const attackerStats = first === 'p1' ? p1Stats : p2Stats;
    const defenderStats = first === 'p1' ? p2Stats : p1Stats;
    
    const damage = calculateDamage(attackerStats.attack, defenderStats.defense);
    
    if (first === 'p1') {
      p2HP = Math.max(0, p2HP - damage);
      battleLog.push(`**${attacker.character.name}** deals **${damage}** damage!`);
    } else {
      p1HP = Math.max(0, p1HP - damage);
      battleLog.push(`**${attacker.character.name}** deals **${damage}** damage!`);
    }
    
    first = first === 'p1' ? 'p2' : 'p1';
    
    if (first === 'p1') turn++;
  }
  
  const winner = p1HP > 0 ? player1 : player2;
  const loser = p1HP > 0 ? player2 : player1;
  const winnerHP = p1HP > 0 ? p1HP : p2HP;
  const winnerMaxHP = p1HP > 0 ? p1MaxHP : p2MaxHP;
  
  const coinsWon = randomInt(ECONOMY.BATTLE_WIN_COINS_MIN, ECONOMY.BATTLE_WIN_COINS_MAX);
  const playCoinsWon = randomInt(ECONOMY.BATTLE_WIN_PLAYCOINS_MIN, ECONOMY.BATTLE_WIN_PLAYCOINS_MAX);
  const xpWon = randomInt(20, 50);
  
  await db.incrementServerUser(message.guild.id, winner.user.id, {
    balance: coinsWon,
    'stats.battlesWon': 1
  });
  
  await db.incrementServerUser(message.guild.id, loser.user.id, {
    'stats.battlesLost': 1
  });
  
  await db.incrementGlobalUser(winner.user.id, {
    playCoins: playCoinsWon,
    'globalStats.totalBattles': 1
  });
  
  await db.incrementGlobalUser(loser.user.id, {
    'globalStats.totalBattles': 1
  });
  
  const currencyEmoji = serverConfig.economy?.currencyEmoji || EMOJIS.COINS;
  
  const resultEmbed = new EmbedBuilder()
    .setColor(COLORS.SUCCESS)
    .setTitle(`${EMOJIS.BATTLE} Battle Complete!`)
    .setDescription(`**${winner.user.username}** wins the battle!`)
    .addFields(
      {
        name: `${winner.user.username} - ${getRarityEmoji(winner.character.rarity)} ${winner.character.name}`,
        value: `${createProgressBar(winnerHP, winnerMaxHP)} ${winnerHP}/${winnerMaxHP} HP`,
        inline: false
      },
      {
        name: `${loser.user.username} - ${getRarityEmoji(loser.character.rarity)} ${loser.character.name}`,
        value: `${createProgressBar(0, 100)} 0 HP - **DEFEATED**`,
        inline: false
      },
      {
        name: '🎁 Winner Rewards',
        value: `${currencyEmoji} **${coinsWon}** Coins\n${EMOJIS.PLAYCOINS} **${playCoinsWon}** PlayCoins\n⭐ **${xpWon}** XP`,
        inline: true
      }
    )
    .setFooter({ text: `Battle lasted ${turn} turns` })
    .setTimestamp();
  
  await message.channel.send({ embeds: [resultEmbed] });
}
