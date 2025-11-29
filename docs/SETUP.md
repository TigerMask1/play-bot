# PlayBot Setup Guide

## Prerequisites

1. A Discord Bot Token from the [Discord Developer Portal](https://discord.com/developers/applications)
2. A MongoDB database (MongoDB Atlas free tier works great)
3. Node.js 18 or higher

## Environment Variables

Set the following environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_BOT_TOKEN` | Yes | Your Discord bot token |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `BOT_OWNERS` | No | Comma-separated Discord user IDs for bot owners |

## Quick Start

1. **Set up environment variables** in Replit Secrets:
   - `DISCORD_BOT_TOKEN`: Your bot token
   - `MONGODB_URI`: Your MongoDB connection string

2. **Run the bot**:
   ```bash
   npm start
   ```

3. **Invite the bot** to your server with the following permissions:
   - Send Messages
   - Embed Links
   - Use External Emojis
   - Add Reactions
   - Read Message History
   - Manage Messages (optional, for cleaning up)

## Server Setup

After adding the bot to your server:

### 1. Configure Channels

```
!setchannel drops #character-drops
!setchannel events #events
!setchannel announcements #announcements
```

### 2. Set Up Roles

```
!setrole admin @BotAdmin
!setrole moderator @BotMod
!setrole vip @VIP
```

### 3. Configure Economy (Optional)

```
!config currency name Gold
!config currency emoji 🪙
!config drops interval 60
```

### 4. Create Characters

```
!createcharacter Shadow Wolf | EPIC | 150 25 20 30 | A mysterious wolf | https://example.com/wolf.png
```

### 5. Enable/Disable Features

```
!module disable clans
!module enable battles
```

## Verification

Use `!setup` to check your server configuration status. All items should show ✅ when properly configured.

## Default Configuration

When a server first adds the bot, it receives:
- All modules enabled
- 60-second drop interval
- Default currency: "Coins" 🪙
- Starting balance: 100 coins

## Troubleshooting

### Bot not responding
- Check that the bot has proper permissions
- Verify the bot is online in your server member list
- Make sure you're using the correct prefix (default: `!`)

### Drops not appearing
- Set a drops channel: `!setchannel drops #channel`
- Make sure drops are enabled: `!config drops enabled true`
- Check if there are characters: `!createcharacter` to add some

### Permission errors
- Server owner always has admin access
- Users with Administrator permission have admin access
- Add roles with `!setrole admin @role`

## Support

For additional help, contact the bot developer or check the documentation.
