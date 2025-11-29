const { MongoClient } = require('mongodb');

class MongoDB {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) return this.db;

    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    try {
      this.client = new MongoClient(uri);
      await this.client.connect();
      this.db = this.client.db('playbot');
      this.isConnected = true;
      
      await this.createIndexes();
      console.log('✅ Connected to MongoDB');
      
      return this.db;
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      throw error;
    }
  }

  async createIndexes() {
    try {
      await this.db.collection('global_users').createIndex({ odiscrdId: 1 }, { unique: true });
      await this.db.collection('global_users').createIndex({ playCoins: -1 });
      await this.db.collection('global_users').createIndex({ globalLevel: -1 });
      
      await this.db.collection('server_config').createIndex({ serverId: 1 }, { unique: true });
      
      await this.db.collection('server_users').createIndex({ serverId: 1, odiscrdId: 1 }, { unique: true });
      await this.db.collection('server_users').createIndex({ serverId: 1, balance: -1 });
      await this.db.collection('server_users').createIndex({ serverId: 1, level: -1 });
      
      await this.db.collection('server_characters').createIndex({ serverId: 1 });
      await this.db.collection('server_characters').createIndex({ serverId: 1, characterId: 1 }, { unique: true });
      
      await this.db.collection('server_clans').createIndex({ serverId: 1 });
      await this.db.collection('server_clans').createIndex({ serverId: 1, clanId: 1 }, { unique: true });
      await this.db.collection('server_clans').createIndex({ serverId: 1, name: 1 });
      
      await this.db.collection('global_marketplace').createIndex({ sellerId: 1 });
      await this.db.collection('global_marketplace').createIndex({ itemType: 1, price: 1 });
      await this.db.collection('global_marketplace').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
      
      console.log('✅ Database indexes created');
    } catch (error) {
      console.error('⚠️ Error creating indexes:', error);
    }
  }

  async ensureGlobalUser(discordId, username) {
    const existing = await this.getGlobalUser(discordId);
    if (existing) return existing;
    
    const { getDefaultGlobalUser } = require('../config/defaults');
    const newUser = getDefaultGlobalUser(discordId, username);
    return await this.createGlobalUser(newUser);
  }

  async ensureServerUser(serverId, discordId, username) {
    const existing = await this.getServerUser(serverId, discordId);
    if (existing) return existing;
    
    const { getDefaultServerUser } = require('../config/defaults');
    const newUser = getDefaultServerUser(serverId, discordId, username);
    return await this.createServerUser(newUser);
  }

  async ensureServerConfig(serverId, serverName) {
    const existing = await this.getServerConfig(serverId);
    if (existing) return existing;
    
    const { getDefaultServerConfig } = require('../config/defaults');
    const newConfig = getDefaultServerConfig(serverId, serverName);
    return await this.createServerConfig(newConfig);
  }

  collection(name) {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }
    return this.db.collection(name);
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      console.log('📤 Disconnected from MongoDB');
    }
  }

  async getGlobalUser(discordId) {
    return await this.collection('global_users').findOne({ odiscrdId: discordId });
  }

  async createGlobalUser(userData) {
    const result = await this.collection('global_users').insertOne(userData);
    return { ...userData, _id: result.insertedId };
  }

  async updateGlobalUser(discordId, updates) {
    if (updates.$inc) {
      return await this.collection('global_users').updateOne(
        { odiscrdId: discordId },
        { 
          $inc: updates.$inc,
          $set: { lastActive: new Date() }
        },
        { upsert: false }
      );
    }
    return await this.collection('global_users').updateOne(
      { odiscrdId: discordId },
      { $set: { ...updates, lastActive: new Date() } },
      { upsert: false }
    );
  }

  async incrementGlobalUser(discordId, increments) {
    return await this.collection('global_users').updateOne(
      { odiscrdId: discordId },
      { 
        $inc: increments,
        $set: { lastActive: new Date() }
      }
    );
  }

  async getServerConfig(serverId) {
    return await this.collection('server_config').findOne({ serverId });
  }

  async createServerConfig(config) {
    try {
      const result = await this.collection('server_config').insertOne(config);
      return { ...config, _id: result.insertedId };
    } catch (error) {
      if (error.code === 11000) {
        return await this.getServerConfig(config.serverId);
      }
      throw error;
    }
  }

  async updateServerConfig(serverId, updates) {
    return await this.collection('server_config').updateOne(
      { serverId },
      { $set: { ...updates, updatedAt: new Date() } },
      { upsert: false }
    );
  }

  async getServerUser(serverId, discordId) {
    return await this.collection('server_users').findOne({ serverId, odiscrdId: discordId });
  }

  async createServerUser(userData) {
    try {
      const result = await this.collection('server_users').insertOne(userData);
      return { ...userData, _id: result.insertedId };
    } catch (error) {
      if (error.code === 11000) {
        return await this.getServerUser(userData.serverId, userData.odiscrdId);
      }
      throw error;
    }
  }

  async updateServerUser(serverId, discordId, updates) {
    return await this.collection('server_users').updateOne(
      { serverId, odiscrdId: discordId },
      { $set: { ...updates, lastActivity: new Date() } },
      { upsert: false }
    );
  }

  async incrementServerUser(serverId, discordId, increments) {
    if (Object.keys(increments).length === 0) {
      return await this.updateServerUser(serverId, discordId, {});
    }
    return await this.collection('server_users').updateOne(
      { serverId, odiscrdId: discordId },
      { 
        $inc: increments,
        $set: { lastActivity: new Date() }
      }
    );
  }

  async getServerCharacters(serverId) {
    return await this.collection('server_characters').find({ serverId }).toArray();
  }

  async getServerCharacter(serverId, characterId) {
    return await this.collection('server_characters').findOne({ serverId, characterId });
  }

  async createServerCharacter(character) {
    const result = await this.collection('server_characters').insertOne(character);
    return { ...character, _id: result.insertedId };
  }

  async updateServerCharacter(serverId, characterId, updates) {
    return await this.collection('server_characters').updateOne(
      { serverId, characterId },
      { $set: updates }
    );
  }

  async deleteServerCharacter(serverId, characterId) {
    return await this.collection('server_characters').deleteOne({ serverId, characterId });
  }

  async getServerClans(serverId) {
    return await this.collection('server_clans').find({ serverId }).toArray();
  }

  async getServerClan(serverId, clanId) {
    return await this.collection('server_clans').findOne({ serverId, clanId });
  }

  async getClanByName(serverId, name) {
    return await this.collection('server_clans').findOne({ 
      serverId, 
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });
  }

  async createServerClan(clan) {
    const result = await this.collection('server_clans').insertOne(clan);
    return { ...clan, _id: result.insertedId };
  }

  async updateServerClan(serverId, clanId, updates) {
    return await this.collection('server_clans').updateOne(
      { serverId, clanId },
      { $set: updates }
    );
  }

  async deleteServerClan(serverId, clanId) {
    return await this.collection('server_clans').deleteOne({ serverId, clanId });
  }

  async getLeaderboard(serverId, field, limit = 10) {
    return await this.collection('server_users')
      .find({ serverId, started: true })
      .sort({ [field]: -1 })
      .limit(limit)
      .toArray();
  }

  async getGlobalLeaderboard(field, limit = 10) {
    return await this.collection('global_users')
      .find({})
      .sort({ [field]: -1 })
      .limit(limit)
      .toArray();
  }

  async addMarketplaceListing(listing) {
    const result = await this.collection('global_marketplace').insertOne(listing);
    return { ...listing, _id: result.insertedId };
  }

  async getMarketplaceListings(filters = {}, limit = 20) {
    return await this.collection('global_marketplace')
      .find(filters)
      .sort({ listedAt: -1 })
      .limit(limit)
      .toArray();
  }

  async removeMarketplaceListing(listingId) {
    return await this.collection('global_marketplace').deleteOne({ _id: listingId });
  }

  async countServerUsers(serverId) {
    return await this.collection('server_users').countDocuments({ serverId, started: true });
  }

  async countServerCharacters(serverId) {
    return await this.collection('server_characters').countDocuments({ serverId });
  }

  async countServerClans(serverId) {
    return await this.collection('server_clans').countDocuments({ serverId });
  }
}

module.exports = new MongoDB();
