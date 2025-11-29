const { getCollection, COLLECTIONS } = require('../infrastructure/database');
const { 
  TRANSACTION_TYPES,
  createTransactionSchema,
  createUserProfileSchema,
  createUserServerProfileSchema,
  createCurrencyExchangeRateSchema
} = require('../models/schemas');
const logger = require('../core/logger');

const MODULE = 'EconomyService';

async function getOrCreateUserProfile(userId, username) {
  try {
    const collection = await getCollection(COLLECTIONS.USER_PROFILES);
    
    let profile = await collection.findOne({ userId });
    
    if (!profile) {
      profile = createUserProfileSchema(userId, username);
      await collection.insertOne(profile);
      logger.info(MODULE, 'Created new user profile', { userId });
    }
    
    return profile;
  } catch (error) {
    logger.error(MODULE, 'Failed to get/create user profile', { error: error.message });
    return null;
  }
}

async function getOrCreateServerProfile(userId, serverId, username) {
  try {
    const collection = await getCollection(COLLECTIONS.USER_SERVER_PROFILES);
    
    let profile = await collection.findOne({ userId, serverId });
    
    if (!profile) {
      await getOrCreateUserProfile(userId, username);
      
      profile = createUserServerProfileSchema(userId, serverId, username);
      await collection.insertOne(profile);
      logger.info(MODULE, 'Created new server profile', { userId, serverId });
    }
    
    return profile;
  } catch (error) {
    logger.error(MODULE, 'Failed to get/create server profile', { error: error.message });
    return null;
  }
}

async function updateOfficialBalance(userId, currency, amount, reason = null) {
  try {
    const collection = await getCollection(COLLECTIONS.USER_PROFILES);
    const field = currency === 'playGems' ? 'officialBalance.playGems' : 'officialBalance.playCoins';
    
    const profile = await collection.findOne({ userId });
    if (!profile) {
      return { success: false, error: 'User profile not found' };
    }
    
    const currentBalance = currency === 'playGems' 
      ? profile.officialBalance.playGems 
      : profile.officialBalance.playCoins;
    
    const newBalance = currentBalance + amount;
    
    if (newBalance < 0) {
      return { success: false, error: 'Insufficient balance' };
    }
    
    await collection.updateOne(
      { userId },
      { 
        $set: { 
          [field]: newBalance,
          updatedAt: new Date(),
          lastActiveAt: new Date()
        }
      }
    );
    
    await recordTransaction(userId, null, 
      amount > 0 ? TRANSACTION_TYPES.GRANT : TRANSACTION_TYPES.SPEND,
      currency, amount, { reason, balanceBefore: currentBalance, balanceAfter: newBalance }
    );
    
    logger.info(MODULE, 'Updated official balance', { userId, currency, amount, newBalance });
    return { success: true, newBalance };
  } catch (error) {
    logger.error(MODULE, 'Failed to update official balance', { error: error.message });
    return { success: false, error: error.message };
  }
}

async function updateServerBalance(userId, serverId, currency, amount, reason = null) {
  try {
    const collection = await getCollection(COLLECTIONS.USER_SERVER_PROFILES);
    const field = currency === 'premium' ? 'serverBalance.premium' : 'serverBalance.primary';
    
    const profile = await collection.findOne({ userId, serverId });
    if (!profile) {
      return { success: false, error: 'Server profile not found' };
    }
    
    const currentBalance = currency === 'premium' 
      ? profile.serverBalance.premium 
      : profile.serverBalance.primary;
    
    const newBalance = currentBalance + amount;
    
    if (newBalance < 0) {
      return { success: false, error: 'Insufficient balance' };
    }
    
    await collection.updateOne(
      { userId, serverId },
      { 
        $set: { 
          [field]: newBalance,
          updatedAt: new Date(),
          lastActivity: new Date()
        }
      }
    );
    
    await recordTransaction(userId, serverId,
      amount > 0 ? TRANSACTION_TYPES.GRANT : TRANSACTION_TYPES.SPEND,
      currency, amount, { reason, balanceBefore: currentBalance, balanceAfter: newBalance }
    );
    
    logger.info(MODULE, 'Updated server balance', { userId, serverId, currency, amount, newBalance });
    return { success: true, newBalance };
  } catch (error) {
    logger.error(MODULE, 'Failed to update server balance', { error: error.message });
    return { success: false, error: error.message };
  }
}

async function getExchangeRates(serverId) {
  try {
    const collection = await getCollection(COLLECTIONS.CURRENCY_EXCHANGE_RATES);
    let rates = await collection.findOne({ serverId });
    
    if (!rates) {
      rates = createCurrencyExchangeRateSchema(serverId);
      await collection.insertOne(rates);
    }
    
    return rates;
  } catch (error) {
    logger.error(MODULE, 'Failed to get exchange rates', { error: error.message });
    return null;
  }
}

async function setExchangeRates(serverId, newRates, updatedBy) {
  try {
    const collection = await getCollection(COLLECTIONS.CURRENCY_EXCHANGE_RATES);
    
    await collection.updateOne(
      { serverId },
      { 
        $set: { 
          rates: newRates,
          lastUpdatedBy: updatedBy,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    
    logger.info(MODULE, 'Updated exchange rates', { serverId, updatedBy });
    return { success: true };
  } catch (error) {
    logger.error(MODULE, 'Failed to set exchange rates', { error: error.message });
    return { success: false, error: error.message };
  }
}

async function exchangeCurrency(userId, serverId, fromCurrency, toCurrency, amount) {
  try {
    const rates = await getExchangeRates(serverId);
    if (!rates || !rates.isActive) {
      return { success: false, error: 'Exchange is not available for this server' };
    }
    
    if (amount <= 0) {
      return { success: false, error: 'Amount must be positive' };
    }
    
    if (amount > rates.limits.perTransactionMax) {
      return { success: false, error: `Maximum exchange per transaction is ${rates.limits.perTransactionMax}` };
    }
    
    let exchangeRate;
    let sourceIsOfficial = false;
    let targetIsOfficial = false;
    
    if (fromCurrency === 'playCoins' && toCurrency === 'primary') {
      exchangeRate = rates.rates.officialToServer.playCoinstoPrimary;
      sourceIsOfficial = true;
    } else if (fromCurrency === 'primary' && toCurrency === 'playCoins') {
      exchangeRate = rates.rates.serverToOfficial.primaryToPlayCoins;
      targetIsOfficial = true;
    } else if (fromCurrency === 'playGems' && toCurrency === 'premium') {
      exchangeRate = rates.rates.officialToServer.playGemsToPremium;
      sourceIsOfficial = true;
    } else if (fromCurrency === 'premium' && toCurrency === 'playGems') {
      exchangeRate = rates.rates.serverToOfficial.premiumToPlayGems;
      targetIsOfficial = true;
    } else {
      return { success: false, error: 'Invalid currency pair' };
    }
    
    const fee = Math.min(
      Math.max(Math.floor(amount * (rates.fees.exchangeFeePercent / 100)), rates.fees.minFee),
      rates.fees.maxFee
    );
    
    const amountAfterFee = amount - fee;
    const convertedAmount = Math.floor(amountAfterFee * exchangeRate);
    
    if (sourceIsOfficial) {
      const deductResult = await updateOfficialBalance(userId, fromCurrency, -amount, 'Currency exchange');
      if (!deductResult.success) {
        return deductResult;
      }
      
      const addResult = await updateServerBalance(userId, serverId, toCurrency, convertedAmount, 'Currency exchange');
      if (!addResult.success) {
        await updateOfficialBalance(userId, fromCurrency, amount, 'Exchange refund');
        return addResult;
      }
    } else {
      const deductResult = await updateServerBalance(userId, serverId, fromCurrency, -amount, 'Currency exchange');
      if (!deductResult.success) {
        return deductResult;
      }
      
      const addResult = await updateOfficialBalance(userId, toCurrency, convertedAmount, 'Currency exchange');
      if (!addResult.success) {
        await updateServerBalance(userId, serverId, fromCurrency, amount, 'Exchange refund');
        return addResult;
      }
    }
    
    await recordTransaction(userId, serverId, TRANSACTION_TYPES.EXCHANGE, 
      `${fromCurrency}->${toCurrency}`, amount, {
        fromCurrency,
        toCurrency,
        originalAmount: amount,
        fee,
        exchangeRate,
        convertedAmount
      }
    );
    
    logger.info(MODULE, 'Currency exchanged', { 
      userId, serverId, fromCurrency, toCurrency, amount, convertedAmount, fee 
    });
    
    return { 
      success: true, 
      originalAmount: amount,
      fee,
      convertedAmount,
      exchangeRate
    };
  } catch (error) {
    logger.error(MODULE, 'Failed to exchange currency', { error: error.message });
    return { success: false, error: error.message };
  }
}

async function recordTransaction(userId, serverId, type, currency, amount, details) {
  try {
    const collection = await getCollection(COLLECTIONS.ECONOMY_TRANSACTIONS);
    const transaction = createTransactionSchema(userId, serverId, type, currency, amount, details);
    await collection.insertOne(transaction);
  } catch (error) {
    logger.error(MODULE, 'Failed to record transaction', { error: error.message });
  }
}

async function getTransactionHistory(userId, serverId = null, limit = 50) {
  try {
    const collection = await getCollection(COLLECTIONS.ECONOMY_TRANSACTIONS);
    
    const query = { odiserId: userId };
    if (serverId) {
      query.serverId = serverId;
    }
    
    return await collection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  } catch (error) {
    logger.error(MODULE, 'Failed to get transaction history', { error: error.message });
    return [];
  }
}

async function grantStarterPack(userId, serverId, username, settings = null) {
  try {
    const profile = await getOrCreateServerProfile(userId, serverId, username);
    
    if (profile.started) {
      return { success: false, error: 'User has already started' };
    }
    
    const startingPrimary = settings?.currencies?.primary?.startingAmount || 100;
    const startingPremium = settings?.currencies?.premium?.startingAmount || 0;
    
    const collection = await getCollection(COLLECTIONS.USER_SERVER_PROFILES);
    await collection.updateOne(
      { userId, serverId },
      { 
        $set: { 
          'serverBalance.primary': startingPrimary,
          'serverBalance.premium': startingPremium,
          started: true,
          updatedAt: new Date()
        }
      }
    );
    
    logger.info(MODULE, 'Granted starter pack', { userId, serverId, startingPrimary, startingPremium });
    return { success: true, primary: startingPrimary, premium: startingPremium };
  } catch (error) {
    logger.error(MODULE, 'Failed to grant starter pack', { error: error.message });
    return { success: false, error: error.message };
  }
}

async function getBalance(userId, serverId) {
  try {
    const userProfile = await getOrCreateUserProfile(userId, 'Unknown');
    const serverProfile = await getOrCreateServerProfile(userId, serverId, 'Unknown');
    
    return {
      official: userProfile?.officialBalance || { playCoins: 0, playGems: 0 },
      server: serverProfile?.serverBalance || { primary: 0, premium: 0 }
    };
  } catch (error) {
    logger.error(MODULE, 'Failed to get balance', { error: error.message });
    return {
      official: { playCoins: 0, playGems: 0 },
      server: { primary: 0, premium: 0 }
    };
  }
}

module.exports = {
  TRANSACTION_TYPES,
  getOrCreateUserProfile,
  getOrCreateServerProfile,
  updateOfficialBalance,
  updateServerBalance,
  getExchangeRates,
  setExchangeRates,
  exchangeCurrency,
  recordTransaction,
  getTransactionHistory,
  grantStarterPack,
  getBalance
};
