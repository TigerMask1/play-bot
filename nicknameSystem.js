function setCharacterNickname(userId, characterName, nickname, data) {
  if (!data.users[userId]) {
    return { success: false, message: '❌ You need to start first! Use `!start`' };
  }

  const user = data.users[userId];
  const character = user.characters.find(c => c.name.toLowerCase() === characterName.toLowerCase());

  if (!character) {
    return { success: false, message: `❌ You don't own **${characterName}**!` };
  }

  const trimmedNickname = nickname.trim();
  
  if (trimmedNickname.length < 1 || trimmedNickname.length > 32) {
    return { success: false, message: '❌ Nickname must be between 1-32 characters!' };
  }

  if (trimmedNickname.length > 100) {
    return { success: false, message: '❌ Nickname is too long! Maximum 32 characters.' };
  }

  character.nickname = trimmedNickname;

  return {
    success: true,
    message: `✅ **${character.name}**'s nickname has been set to **${trimmedNickname}**!`,
    characterName: character.name,
    nickname: trimmedNickname
  };
}

function resetCharacterNickname(userId, characterName, data) {
  if (!data.users[userId]) {
    return { success: false, message: '❌ You need to start first! Use `!start`' };
  }

  const user = data.users[userId];
  const character = user.characters.find(c => c.name.toLowerCase() === characterName.toLowerCase());

  if (!character) {
    return { success: false, message: `❌ You don't own **${characterName}**!` };
  }

  if (!character.nickname) {
    return { success: false, message: `❌ **${character.name}** doesn't have a nickname set!` };
  }

  const oldNickname = character.nickname;
  character.nickname = null;

  return {
    success: true,
    message: `✅ **${character.name}**'s nickname has been reset! (was: **${oldNickname}**)`,
    characterName: character.name
  };
}

function getDisplayName(character) {
  if (character.nickname) {
    return `${character.nickname} (${character.name})`;
  }
  return character.name;
}

function getShortDisplayName(character) {
  return character.nickname || character.name;
}

function initializeNicknameData(character) {
  if (!character.nickname) {
    character.nickname = null;
  }
  return character;
}

module.exports = {
  setCharacterNickname,
  resetCharacterNickname,
  getDisplayName,
  getShortDisplayName,
  initializeNicknameData
};
