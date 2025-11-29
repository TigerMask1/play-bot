const { getCollection, COLLECTIONS } = require('../infrastructure/database');
const { 
  CONTENT_TYPES,
  createGlobalContentSchema,
  createServerContentSchema
} = require('../models/schemas');
const logger = require('../core/logger');

const MODULE = 'ContentService';

async function createOfficialContent(type, slug, data, createdBy) {
  try {
    const collection = await getCollection(COLLECTIONS.GLOBAL_CONTENT);
    
    const existing = await collection.findOne({ type, slug });
    if (existing) {
      return { success: false, error: 'Content with this slug already exists' };
    }
    
    const content = createGlobalContentSchema(type, slug, data);
    content.createdBy = createdBy;
    content.updatedBy = createdBy;
    
    await collection.insertOne(content);
    
    logger.info(MODULE, 'Created official content', { type, slug, createdBy });
    return { success: true, content };
  } catch (error) {
    logger.error(MODULE, 'Failed to create official content', { error: error.message });
    return { success: false, error: error.message };
  }
}

async function updateOfficialContent(type, slug, updates, updatedBy) {
  try {
    const collection = await getCollection(COLLECTIONS.GLOBAL_CONTENT);
    
    const result = await collection.findOneAndUpdate(
      { type, slug },
      { 
        $set: { 
          data: updates,
          updatedBy,
          updatedAt: new Date()
        },
        $inc: { version: 1 }
      },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      return { success: false, error: 'Content not found' };
    }
    
    logger.info(MODULE, 'Updated official content', { type, slug, updatedBy });
    return { success: true, content: result };
  } catch (error) {
    logger.error(MODULE, 'Failed to update official content', { error: error.message });
    return { success: false, error: error.message };
  }
}

async function deleteOfficialContent(type, slug, deletedBy) {
  try {
    const collection = await getCollection(COLLECTIONS.GLOBAL_CONTENT);
    
    const result = await collection.updateOne(
      { type, slug },
      { 
        $set: { 
          isActive: false,
          deletedBy,
          deletedAt: new Date()
        }
      }
    );
    
    if (result.modifiedCount === 0) {
      return { success: false, error: 'Content not found' };
    }
    
    logger.info(MODULE, 'Deleted official content', { type, slug, deletedBy });
    return { success: true };
  } catch (error) {
    logger.error(MODULE, 'Failed to delete official content', { error: error.message });
    return { success: false, error: error.message };
  }
}

async function getOfficialContent(type, slug = null) {
  try {
    const collection = await getCollection(COLLECTIONS.GLOBAL_CONTENT);
    
    if (slug) {
      return await collection.findOne({ type, slug, isActive: true });
    }
    
    return await collection.find({ type, isActive: true }).toArray();
  } catch (error) {
    logger.error(MODULE, 'Failed to get official content', { error: error.message });
    return slug ? null : [];
  }
}

async function getAllOfficialContentByType(type) {
  try {
    const collection = await getCollection(COLLECTIONS.GLOBAL_CONTENT);
    return await collection.find({ type, isActive: true }).toArray();
  } catch (error) {
    logger.error(MODULE, 'Failed to get all official content', { error: error.message });
    return [];
  }
}

async function createServerContent(serverId, type, slug, data, createdBy, baseGlobalSlug = null) {
  try {
    const collection = await getCollection(COLLECTIONS.SERVER_CONTENT);
    
    const existing = await collection.findOne({ serverId, type, slug });
    if (existing) {
      return { success: false, error: 'Content with this slug already exists in this server' };
    }
    
    const content = createServerContentSchema(serverId, type, slug, data, baseGlobalSlug);
    content.createdBy = createdBy;
    content.updatedBy = createdBy;
    
    await collection.insertOne(content);
    
    logger.info(MODULE, 'Created server content', { serverId, type, slug, createdBy });
    return { success: true, content };
  } catch (error) {
    logger.error(MODULE, 'Failed to create server content', { error: error.message });
    return { success: false, error: error.message };
  }
}

async function updateServerContent(serverId, type, slug, updates, updatedBy) {
  try {
    const collection = await getCollection(COLLECTIONS.SERVER_CONTENT);
    
    const result = await collection.findOneAndUpdate(
      { serverId, type, slug },
      { 
        $set: { 
          data: updates,
          updatedBy,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      return { success: false, error: 'Content not found' };
    }
    
    logger.info(MODULE, 'Updated server content', { serverId, type, slug, updatedBy });
    return { success: true, content: result };
  } catch (error) {
    logger.error(MODULE, 'Failed to update server content', { error: error.message });
    return { success: false, error: error.message };
  }
}

async function deleteServerContent(serverId, type, slug, deletedBy) {
  try {
    const collection = await getCollection(COLLECTIONS.SERVER_CONTENT);
    
    const result = await collection.updateOne(
      { serverId, type, slug },
      { 
        $set: { 
          isActive: false,
          deletedBy,
          deletedAt: new Date()
        }
      }
    );
    
    if (result.modifiedCount === 0) {
      return { success: false, error: 'Content not found' };
    }
    
    logger.info(MODULE, 'Deleted server content', { serverId, type, slug, deletedBy });
    return { success: true };
  } catch (error) {
    logger.error(MODULE, 'Failed to delete server content', { error: error.message });
    return { success: false, error: error.message };
  }
}

async function getServerContent(serverId, type, slug = null) {
  try {
    const collection = await getCollection(COLLECTIONS.SERVER_CONTENT);
    
    if (slug) {
      return await collection.findOne({ serverId, type, slug, isActive: true });
    }
    
    return await collection.find({ serverId, type, isActive: true }).toArray();
  } catch (error) {
    logger.error(MODULE, 'Failed to get server content', { error: error.message });
    return slug ? null : [];
  }
}

async function publishServerContent(serverId, type, slug, publishedBy) {
  try {
    const collection = await getCollection(COLLECTIONS.SERVER_CONTENT);
    
    const result = await collection.updateOne(
      { serverId, type, slug, isActive: true },
      { 
        $set: { 
          isPublished: true,
          publishedBy,
          publishedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );
    
    if (result.modifiedCount === 0) {
      return { success: false, error: 'Content not found' };
    }
    
    logger.info(MODULE, 'Published server content', { serverId, type, slug, publishedBy });
    return { success: true };
  } catch (error) {
    logger.error(MODULE, 'Failed to publish server content', { error: error.message });
    return { success: false, error: error.message };
  }
}

async function getMergedContent(serverId, type, settings = null) {
  try {
    const useOfficial = settings?.customization?.useOfficialContent !== false;
    const useServer = settings?.customization?.useServerContent !== false;
    
    let content = [];
    
    if (useOfficial) {
      const officialContent = await getAllOfficialContentByType(type);
      content = officialContent.map(c => ({
        ...c.data,
        _source: 'official',
        _slug: c.slug
      }));
    }
    
    if (useServer) {
      const serverContent = await getServerContent(serverId, type);
      const publishedContent = serverContent
        .filter(c => c.isPublished)
        .map(c => ({
          ...c.data,
          _source: 'server',
          _slug: c.slug,
          _extendsGlobal: c.baseGlobalSlug
        }));
      
      for (const serverItem of publishedContent) {
        if (serverItem._extendsGlobal) {
          const index = content.findIndex(c => c._slug === serverItem._extendsGlobal);
          if (index !== -1) {
            content[index] = { ...content[index], ...serverItem };
          } else {
            content.push(serverItem);
          }
        } else {
          content.push(serverItem);
        }
      }
    }
    
    return content;
  } catch (error) {
    logger.error(MODULE, 'Failed to get merged content', { error: error.message });
    return [];
  }
}

module.exports = {
  CONTENT_TYPES,
  createOfficialContent,
  updateOfficialContent,
  deleteOfficialContent,
  getOfficialContent,
  getAllOfficialContentByType,
  createServerContent,
  updateServerContent,
  deleteServerContent,
  getServerContent,
  publishServerContent,
  getMergedContent
};
