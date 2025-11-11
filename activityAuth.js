const crypto = require('crypto');

const SECRET = process.env.ACTIVITY_SECRET || crypto.randomBytes(32).toString('hex');
const pendingTokens = new Map();
const TOKEN_EXPIRY = 5 * 60 * 1000;

function generateToken(userId) {
  const timestamp = Date.now();
  const data = `${userId}:${timestamp}`;
  const token = crypto.createHmac('sha256', SECRET).update(data).digest('hex');
  
  pendingTokens.set(userId, {
    token,
    timestamp,
    used: false
  });
  
  setTimeout(() => {
    pendingTokens.delete(userId);
  }, TOKEN_EXPIRY);
  
  return token;
}

function verifyToken(userId, token) {
  const pending = pendingTokens.get(userId);
  
  if (!pending) {
    return { valid: false, error: 'Token not found or expired' };
  }
  
  if (pending.used) {
    return { valid: false, error: 'Token already used' };
  }
  
  if (Date.now() - pending.timestamp > TOKEN_EXPIRY) {
    pendingTokens.delete(userId);
    return { valid: false, error: 'Token expired' };
  }
  
  if (pending.token !== token) {
    return { valid: false, error: 'Invalid token' };
  }
  
  pending.used = true;
  
  setTimeout(() => pendingTokens.delete(userId), 60000);
  
  return { valid: true };
}

function cleanup() {
  const now = Date.now();
  for (const [userId, data] of pendingTokens.entries()) {
    if (now - data.timestamp > TOKEN_EXPIRY) {
      pendingTokens.delete(userId);
    }
  }
}

setInterval(cleanup, 60000);

module.exports = {
  generateToken,
  verifyToken,
  SECRET
};
