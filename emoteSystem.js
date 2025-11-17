function initializeEmoteData(user) {
  if (!user.selectedEmote) {
    user.selectedEmote = null;
  }
  if (!user.ownedEmotes) {
    user.ownedEmotes = [];
  }
  return user;
}

function grantEmoteToUser(userId, emoteName, data) {
  if (!data.users[userId]) {
    return { success: false, message: '❌ User not found in database!' };
  }

  const user = data.users[userId];
  initializeEmoteData(user);

  const sanitizedName = emoteName.toLowerCase().trim();

  if (user.ownedEmotes.includes(sanitizedName)) {
    return { success: false, message: `❌ User already owns the emote **${sanitizedName}**!` };
  }

  user.ownedEmotes.push(sanitizedName);

  if (!user.selectedEmote) {
    user.selectedEmote = sanitizedName;
  }

  return {
    success: true,
    message: `✅ Granted emote **${sanitizedName}** to user!`,
    emoteName: sanitizedName
  };
}

function setUserEmote(userId, emoteName, data) {
  if (!data.users[userId]) {
    return { success: false, message: '❌ You need to start first! Use `!start`' };
  }

  const user = data.users[userId];
  initializeEmoteData(user);

  if (emoteName.toLowerCase() === 'none' || emoteName.toLowerCase() === 'clear') {
    user.selectedEmote = null;
    return {
      success: true,
      message: '✅ Profile emote cleared!'
    };
  }

  const sanitizedName = emoteName.toLowerCase().trim();

  if (!user.ownedEmotes || !user.ownedEmotes.includes(sanitizedName)) {
    return {
      success: false,
      message: `❌ You don't own the emote **${sanitizedName}**!\n\nUse \`!emotes\` to see your collection.`
    };
  }

  user.selectedEmote = sanitizedName;

  return {
    success: true,
    message: `✅ Profile emote set to **${sanitizedName}**!`,
    emoteName: sanitizedName
  };
}

function getUserEmotes(userId, data) {
  if (!data.users[userId]) {
    return { success: false, message: '❌ You need to start first! Use `!start`' };
  }

  const user = data.users[userId];
  initializeEmoteData(user);

  if (!user.ownedEmotes || user.ownedEmotes.length === 0) {
    return {
      success: true,
      emotes: [],
      selectedEmote: null,
      message: '❌ You don\'t have any emotes yet!\n\nEmotes are special profile decorations granted by admins for achievements and events.'
    };
  }

  return {
    success: true,
    emotes: user.ownedEmotes,
    selectedEmote: user.selectedEmote,
    message: `**Your Emotes (${user.ownedEmotes.length}):**\n${user.ownedEmotes.map(e => e === user.selectedEmote ? `✅ ${e} (active)` : `⚪ ${e}`).join('\n')}\n\nUse \`!setemote <name>\` to change your active emote!`
  };
}

function removeEmoteFromUser(userId, emoteName, data) {
  if (!data.users[userId]) {
    return { success: false, message: '❌ User not found!' };
  }

  const user = data.users[userId];
  initializeEmoteData(user);

  const sanitizedName = emoteName.toLowerCase().trim();

  if (!user.ownedEmotes.includes(sanitizedName)) {
    return { success: false, message: `❌ User doesn't own emote **${sanitizedName}**!` };
  }

  user.ownedEmotes = user.ownedEmotes.filter(e => e !== sanitizedName);

  if (user.selectedEmote === sanitizedName) {
    user.selectedEmote = null;
  }

  return {
    success: true,
    message: `✅ Removed emote **${sanitizedName}** from user!`
  };
}

function getEmoteDisplay(user) {
  if (!user || !user.selectedEmote) {
    return '';
  }
  return `[${user.selectedEmote}] `;
}

module.exports = {
  initializeEmoteData,
  grantEmoteToUser,
  setUserEmote,
  getUserEmotes,
  removeEmoteFromUser,
  getEmoteDisplay
};
