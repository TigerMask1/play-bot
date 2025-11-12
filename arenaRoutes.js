const express = require('express');
const path = require('path');
const { getSkinUrl } = require('./skinSystem.js');
const { enhanceMovesForArena } = require('./arenaMovesData.js');
const { createMatch } = require('./arenaSocketHandler.js');

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
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Token exchange error:', error);
      res.status(500).json({ error: 'Failed to exchange token' });
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

module.exports = {
  setupArenaRoutes,
  generateMatchId
};
