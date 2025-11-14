function getCharacterDisplayEmoji(character, useCustomEmoji = false) {
  if (useCustomEmoji && character.customEmojiId) {
    return `<:${character.name.toLowerCase()}:${character.customEmojiId}>`;
  }
  
  return character.emoji;
}

function getCharacterEmojiUrl(character, size = 64) {
  if (character.customEmojiId) {
    return `https://cdn.discordapp.com/emojis/${character.customEmojiId}.png?size=${size}`;
  }
  
  return null;
}

function setCustomEmojiForCharacter(characterName, emojiId, data) {
  const char = data.customEmojis = data.customEmojis || {};
  char[characterName.toLowerCase()] = emojiId;
  return true;
}

function getCustomEmojiId(characterName, data) {
  if (!data.customEmojis) return null;
  return data.customEmojis[characterName.toLowerCase()] || null;
}

module.exports = {
  getCharacterDisplayEmoji,
  getCharacterEmojiUrl,
  setCustomEmojiForCharacter,
  getCustomEmojiId
};
