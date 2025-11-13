const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { getSkinUrl } = require('./skinSystem.js');
const { enhanceMovesForArena } = require('./arenaMovesData.js');
const { createMatch } = require('./arenaSocketHandler.js');

// Session storage for Discord-authenticated users
const activeSessions = new Map(); // sessionToken -> { userId, username, created }

function setupArenaRoutes(app, data) {
  // Serve arena activity files
  app.use('/activity/arena', express.static(path.join(__dirname, 'activity', 'arena')));
  
  // API: Get Discord client configuration for frontend
  app.get('/api/arena/config', (req, res) => {
    res.json({
      clientId: process.env.DISCORD_CLIENT_ID || '',
      baseUrl: process.env.RENDER_EXTERNAL_URL || 'https://zoobot-zoki.onrender.com'
    });
  });
  
  // API: Get user's characters for selection
  app.get('/api/arena/characters/:userId', async (req, res) => {
    try {
      const userId = req.params.userId;
      const userData = data.users[userId];
      
      if (!userData || !userData.characters) {
        return res.json([]);
      }
      
      // Format characters with skin URLs and enhanced moves for arena
      const characters = await Promise.all(
        userData.characters.map(async (char) => {
          const skinUrl = await getSkinUrl(char.name, char.currentSkin || 'default');
          
          // Enhance moves with arena combat properties
          const enhancedMoves = char.moves ? enhanceMovesForArena(char.moves, char.name) : null;
          
          // Create flat array of all moves for arena UI
          const movesArray = [];
          if (enhancedMoves) {
            if (enhancedMoves.special) {
              movesArray.push(enhancedMoves.special);
            }
            if (enhancedMoves.tierMoves) {
              movesArray.push(...enhancedMoves.tierMoves);
            }
          }
          
          return {
            name: char.name,
            emoji: char.emoji,
            level: char.level,
            st: char.st,
            moves: movesArray.slice(0, 4), // Only take first 4 moves for arena
            skinUrl,
            baseHp: char.baseHp
          };
        })
      );
      
      res.json(characters);
    } catch (error) {
      console.error('Error fetching characters:', error);
      res.status(500).json({ error: 'Failed to fetch characters' });
    }
  });
  
  // API: OAuth token exchange for Discord Activity
  app.post('/api/token', async (req, res) => {
    try {
      const { code } = req.body;
      
      // Exchange code for access token
      const response = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.DISCORD_CLIENT_ID,
          client_secret: process.env.DISCORD_CLIENT_SECRET,
          grant_type: 'authorization_code',
          code: code,
        }),
      });
      
      const tokenData = await response.json();
      res.json(tokenData);
    } catch (error) {
      console.error('Token exchange error:', error);
      res.status(500).json({ error: 'Failed to exchange token' });
    }
  });

  // API: Create session token for Discord-authenticated user
  app.post('/api/arena/session', async (req, res) => {
    try {
      const { userId, username, access_token } = req.body;

      if (!userId || !access_token) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Validate the Discord access token by fetching user info
      const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });

      if (!userResponse.ok) {
        return res.status(401).json({ error: 'Invalid Discord access token' });
      }

      const discordUser = await userResponse.json();

      // Verify the user ID matches
      if (discordUser.id !== userId) {
        return res.status(403).json({ error: 'User ID mismatch' });
      }

      // Generate secure session token
      const sessionToken = crypto.randomBytes(32).toString('hex');

      // Store session (expires in 1 hour)
      activeSessions.set(sessionToken, {
        userId: userId,
        username: username || discordUser.username,
        created: Date.now(),
        expiresAt: Date.now() + (60 * 60 * 1000) // 1 hour
      });

      console.log(`✅ Created session for Discord user: ${username} (${userId})`);

      res.json({ sessionToken });
    } catch (error) {
      console.error('Session creation error:', error);
      res.status(500).json({ error: 'Failed to create session' });
    }
  });
  
  // API: Create arena match
  app.post('/api/arena/create', (req, res) => {
    const { player1Id, player2Id } = req.body;
    
    if (!player1Id || !player2Id) {
      return res.status(400).json({ error: 'Both player IDs required' });
    }
    
    const matchId = generateMatchId();
    const created = createMatch(matchId, player1Id, player2Id);
    
    if (!created) {
      return res.status(500).json({ error: 'Failed to create match' });
    }
    
    res.json({ matchId });
  });
}

function generateMatchId() {
  return 'match_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Validate session token
function validateSessionToken(token) {
  const session = activeSessions.get(token);
  
  if (!session) {
    return null;
  }

  // Check if expired
  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return null;
  }

  return session;
}

// Clean up expired sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of activeSessions.entries()) {
    if (now > session.expiresAt) {
      activeSessions.delete(token);
    }
  }
}, 5 * 60 * 1000); // Every 5 minutes

module.exports = {
  setupArenaRoutes,
  generateMatchId,
  validateSessionToken
};
