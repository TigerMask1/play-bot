const { EmbedBuilder } = require('discord.js');
const { COLORS, EMOJIS } = require('../../config/constants');
const { shopEmbed, createPaginationButtons } = require('../../utils/embeds');
const { chunk } = require('../../utils/helpers');
const db = require('../../database/MongoDB');

const DEFAULT_SHOP_ITEMS = [
  { id: 'bronze_crate', name: 'Bronze Crate', emoji: '🟫', price: 100, description: 'Contains a random common character' },
  { id: 'silver_crate', name: 'Silver Crate', emoji: '⚪', price: 300, description: 'Higher chance for uncommon characters' },
  { id: 'gold_crate', name: 'Gold Crate', emoji: '🟡', price: 750, description: 'Good chance for rare characters' },
  { id: 'legendary_crate', name: 'Legendary Crate', emoji: '🟣', price: 2000, description: 'Best odds for rare+ characters' },
  { id: 'xp_boost', name: 'XP Booster', emoji: '⭐', price: 500, description: '2x XP for 1 hour' },
  { id: 'coin_boost', name: 'Coin Booster', emoji: '💰', price: 500, description: '2x coins for 1 hour' }
];

module.exports = {
  name: 'shop',
  description: 'View the server shop',
  aliases: ['store', 'market'],
  usage: '[page]',
  cooldown: 3,
  requiresStart: true,
  module: 'shop',
  
  async execute({ message, args, serverConfig, prefix }) {
    const page = parseInt(args[0]) || 1;
    const itemsPerPage = 6;
    
    const items = DEFAULT_SHOP_ITEMS;
    const pages = chunk(items, itemsPerPage);
    const totalPages = Math.max(1, pages.length);
    const currentPage = Math.min(Math.max(1, page), totalPages);
    
    const embed = shopEmbed(pages[currentPage - 1] || [], serverConfig, currentPage, totalPages);
    embed.setFooter({ text: `Page ${currentPage}/${totalPages} | Use ${prefix}buy <item> to purchase` });
    
    const response = { embeds: [embed] };
    
    if (totalPages > 1) {
      response.components = [createPaginationButtons(currentPage, totalPages, 'shop_')];
    }
    
    await message.reply(response);
  }
};
