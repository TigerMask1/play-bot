const USE_MONGODB = process.env.USE_MONGODB === 'true';

let mongoManager = null;
if (USE_MONGODB) {
  mongoManager = require('./mongoManager.js');
}

const MAX_EMOTE_SIZE_BYTES = 5 * 1024 * 1024;

async function uploadEmote(emoteName, imageData, uploaderId) {
  if (!emoteName || !imageData) {
    return { success: false, message: '❌ Emote name and image data are required!' };
  }

  const sanitizedName = emoteName.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
  
  if (sanitizedName.length < 2 || sanitizedName.length > 32) {
    return { success: false, message: '❌ Emote name must be 2-32 characters (letters, numbers, -, _)!' };
  }

  const estimatedSizeBytes = Buffer.byteLength(imageData, 'utf8');
  if (estimatedSizeBytes > MAX_EMOTE_SIZE_BYTES) {
    const sizeMB = (estimatedSizeBytes / (1024 * 1024)).toFixed(2);
    return { 
      success: false, 
      message: `❌ Emote file is too large (${sizeMB}MB)! Maximum size is 5MB.` 
    };
  }

  if (USE_MONGODB) {
    try {
      const db = await mongoManager.getDb();
      const emotesCollection = db.collection('emotes');
      
      const existingEmote = await emotesCollection.findOne({ name: sanitizedName });
      if (existingEmote) {
        return { success: false, message: `❌ An emote with the name **${sanitizedName}** already exists!` };
      }

      const emoteDoc = {
        name: sanitizedName,
        imageData: imageData,
        uploadedBy: uploaderId,
        uploadedAt: new Date(),
        type: 'custom'
      };

      await emotesCollection.insertOne(emoteDoc);
      return { 
        success: true, 
        message: `✅ Emote **${sanitizedName}** uploaded successfully!`,
        emoteName: sanitizedName
      };
    } catch (error) {
      console.error('Error uploading emote to MongoDB:', error);
      return { success: false, message: '❌ Failed to upload emote to database!' };
    }
  } else {
    return { success: false, message: '❌ Emote uploads require MongoDB to be enabled!' };
  }
}

async function getEmote(emoteName) {
  if (!emoteName) return null;

  const sanitizedName = emoteName.toLowerCase().trim();

  if (USE_MONGODB) {
    try {
      const db = await mongoManager.getDb();
      const emotesCollection = db.collection('emotes');
      
      const emote = await emotesCollection.findOne({ name: sanitizedName });
      return emote;
    } catch (error) {
      console.error('Error fetching emote from MongoDB:', error);
      return null;
    }
  }
  
  return null;
}

async function getAllEmotes() {
  if (USE_MONGODB) {
    try {
      const db = await mongoManager.getDb();
      const emotesCollection = db.collection('emotes');
      
      const emotes = await emotesCollection.find({}).toArray();
      return emotes;
    } catch (error) {
      console.error('Error fetching all emotes from MongoDB:', error);
      return [];
    }
  }
  
  return [];
}

async function grantEmoteToUser(userId, emoteName, data) {
  if (!data.users[userId]) {
    return { success: false, message: '❌ User not found in database!' };
  }

  const sanitizedName = emoteName.toLowerCase().trim();
  
  const emote = await getEmote(sanitizedName);
  if (!emote) {
    return { success: false, message: `❌ Emote **${sanitizedName}** does not exist!` };
  }

  if (!data.users[userId].ownedEmotes) {
    data.users[userId].ownedEmotes = [];
  }

  if (data.users[userId].ownedEmotes.includes(sanitizedName)) {
    return { success: false, message: `❌ User already owns the emote **${sanitizedName}**!` };
  }

  data.users[userId].ownedEmotes.push(sanitizedName);

  if (!data.users[userId].selectedEmote) {
    data.users[userId].selectedEmote = sanitizedName;
  }

  return { 
    success: true, 
    message: `✅ Successfully granted emote **${sanitizedName}** to user!`,
    emoteName: sanitizedName
  };
}

async function setUserEmote(userId, emoteName, data) {
  if (!data.users[userId]) {
    return { success: false, message: '❌ You need to start first! Use `!start`' };
  }

  if (!emoteName || emoteName === 'none' || emoteName === 'clear') {
    data.users[userId].selectedEmote = null;
    return { 
      success: true, 
      message: '✅ Your profile emote has been cleared!'
    };
  }

  const sanitizedName = emoteName.toLowerCase().trim();
  
  if (!data.users[userId].ownedEmotes) {
    data.users[userId].ownedEmotes = [];
  }

  if (!data.users[userId].ownedEmotes.includes(sanitizedName)) {
    return { success: false, message: `❌ You don't own the emote **${sanitizedName}**! Use \`!emotes\` to see your collection.` };
  }

  const emote = await getEmote(sanitizedName);
  if (!emote) {
    return { success: false, message: `❌ Emote **${sanitizedName}** no longer exists!` };
  }

  data.users[userId].selectedEmote = sanitizedName;

  return { 
    success: true, 
    message: `✅ Your profile emote has been set to **${sanitizedName}**!`,
    emoteName: sanitizedName
  };
}

async function getUserEmotes(userId, data) {
  if (!data.users[userId]) {
    return { success: false, ownedEmotes: [], selectedEmote: null };
  }

  const ownedEmotes = data.users[userId].ownedEmotes || [];
  const selectedEmote = data.users[userId].selectedEmote || null;

  return {
    success: true,
    ownedEmotes,
    selectedEmote
  };
}

async function deleteEmote(emoteName, data) {
  const sanitizedName = emoteName.toLowerCase().trim();

  if (USE_MONGODB) {
    try {
      const db = await mongoManager.getDb();
      const emotesCollection = db.collection('emotes');
      
      const result = await emotesCollection.deleteOne({ name: sanitizedName });
      
      if (result.deletedCount === 0) {
        return { success: false, message: `❌ Emote **${sanitizedName}** not found!` };
      }

      let cleanedUsers = 0;
      for (const userId in data.users) {
        const user = data.users[userId];
        
        if (user.ownedEmotes) {
          const index = user.ownedEmotes.indexOf(sanitizedName);
          if (index > -1) {
            user.ownedEmotes.splice(index, 1);
            cleanedUsers++;
          }
        }
        
        if (user.selectedEmote === sanitizedName) {
          user.selectedEmote = null;
          cleanedUsers++;
        }
      }

      return { 
        success: true, 
        message: `✅ Emote **${sanitizedName}** has been deleted! Cleaned up ${cleanedUsers} user references.`
      };
    } catch (error) {
      console.error('Error deleting emote from MongoDB:', error);
      return { success: false, message: '❌ Failed to delete emote from database!' };
    }
  } else {
    return { success: false, message: '❌ Emote deletion requires MongoDB to be enabled!' };
  }
}

function initializeEmoteData(user) {
  if (!user.ownedEmotes) {
    user.ownedEmotes = [];
  }
  if (!user.selectedEmote) {
    user.selectedEmote = null;
  }
  return user;
}

module.exports = {
  uploadEmote,
  getEmote,
  getAllEmotes,
  grantEmoteToUser,
  setUserEmote,
  getUserEmotes,
  deleteEmote,
  initializeEmoteData
};
