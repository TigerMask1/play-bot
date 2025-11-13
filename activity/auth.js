// Discord SDK Authentication Module
// This module handles Discord Embedded App SDK authentication

import { DiscordSDK } from 'https://esm.sh/@discord/embedded-app-sdk@1.3.0';

let discordSdk = null;
let auth = null;

export async function initializeDiscordAuth() {
  // Fetch client ID from server (secure - no secrets exposed)
  const configResponse = await fetch('/api/arena/config');
  const config = await configResponse.json();
  const clientId = config.clientId;
  
  // Initialize SDK
  discordSdk = new DiscordSDK(clientId);

  try {
    // Wait for Discord client ready
    await discordSdk.ready();
    console.log('Discord SDK ready!');

    // Authorize and get code
    const { code } = await discordSdk.commands.authorize({
      client_id: clientId,
      response_type: 'code',
      state: '',
      prompt: 'none',
      scope: ['identify', 'guilds'],
    });

    console.log('Authorization code received');

    // Exchange code for access token via backend
    const response = await fetch('/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    const { access_token } = await response.json();
    console.log('Access token received');

    // Authenticate SDK with access token
    auth = await discordSdk.commands.authenticate({
      access_token,
    });

    if (!auth) {
      throw new Error('Authentication failed - no auth object returned');
    }

    console.log('✅ Discord authentication successful!', {
      userId: auth.user.id,
      username: auth.user.username
    });

    // Generate a server-validated token for socket authentication
    const tokenResponse = await fetch('/api/arena/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userId: auth.user.id,
        username: auth.user.username,
        access_token: access_token  // Include Discord access token for server validation
      }),
    });

    const { sessionToken } = await tokenResponse.json();

    return {
      userId: auth.user.id,
      username: auth.user.username,
      discriminator: auth.user.discriminator,
      avatar: auth.user.avatar,
      sessionToken: sessionToken  // Server-issued session token for socket auth
    };

  } catch (error) {
    console.error('Discord authentication failed:', error);
    throw error;
  }
}

export function getDiscordSdk() {
  return discordSdk;
}

export function getAuth() {
  return auth;
}

export async function getChannelInfo() {
  if (!discordSdk) {
    throw new Error('Discord SDK not initialized');
  }
  
  return {
    channelId: discordSdk.channelId,
    guildId: discordSdk.guildId,
    instanceId: discordSdk.instanceId
  };
}
