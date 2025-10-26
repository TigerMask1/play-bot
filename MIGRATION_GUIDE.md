# MongoDB Migration Guide

This guide explains how to migrate your Discord bot data from JSON (test bot) to MongoDB (production bot).

## Overview

The bot supports two data storage modes:
- **JSON Mode** (default): Stores data in `data.json` file - ideal for testing
- **MongoDB Mode**: Stores data in MongoDB database - ideal for production

## Test Bot Setup (Current Default)

Your bot is currently running in JSON mode. No additional configuration needed!

The bot will:
- Store all data in `data.json`
- Automatically backfill missing fields
- Work perfectly for testing and development

## Production Bot Setup

When you're ready to deploy to production:

### Step 1: Get MongoDB Connection String

1. Create a free MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster (free tier is fine)
3. Create a database user with read/write permissions
4. Whitelist your IP address (or use 0.0.0.0/0 for all IPs)
5. Get your connection string (it looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)

### Step 2: Set Environment Variables

In your production Replit project, add these secrets:

1. `MONGODB_URI` - Your MongoDB connection string
2. `USE_MONGODB` - Set to `true`

### Step 3: Migrate Data (One-Time Only)

**Important**: Only do this ONCE when moving from test to production!

1. Copy your `data.json` file from your test bot to your production bot
2. In your production bot terminal, run:
   ```bash
   npm run migrate
   ```
3. The script will:
   - Connect to MongoDB
   - Clear any existing data in MongoDB
   - Transfer all user data from `data.json` to MongoDB
   - Transfer config data (drop channel, battle channel)
   - Show a success message

### Step 4: Start Production Bot

1. Make sure `USE_MONGODB=true` is set in your environment variables
2. Start your bot normally
3. The bot will now use MongoDB instead of JSON

### Step 5: Cleanup (Optional)

Once you've verified everything works:
- Backup your `data.json` file somewhere safe
- You can delete `data.json` from your production bot (it won't be used anymore)

## Switching Between Modes

### Test Mode (JSON)
- Remove `USE_MONGODB` environment variable OR set it to `false`
- Bot will use `data.json`

### Production Mode (MongoDB)
- Set `USE_MONGODB=true`
- Set `MONGODB_URI` to your connection string
- Bot will use MongoDB

## Migration Script Details

The migration script (`migrate.js`) will:
✅ Read all data from `data.json`
✅ Connect to MongoDB
✅ Clear existing MongoDB data (prevents duplicates)
✅ Insert all user data with proper structure
✅ Insert config data (channels)
✅ Show detailed progress and success messages

## Troubleshooting

### "MONGODB_URI environment variable is not set"
- Make sure you've added `MONGODB_URI` as a secret in your Replit project

### "No data.json file found to migrate"
- Make sure you've copied `data.json` from your test bot first

### Migration fails with connection error
- Check your MongoDB connection string is correct
- Verify your IP is whitelisted in MongoDB Atlas
- Make sure your database user has correct permissions

### Bot doesn't start after migration
- Check that `USE_MONGODB=true` is set correctly
- Verify `MONGODB_URI` is a valid connection string
- Check the bot logs for specific error messages

## Data Structure

Both modes maintain identical data structures:
- **Users**: All player data (coins, gems, characters, etc.)
- **Config**: Bot settings (drop channel, battle channel)

MongoDB stores each user as a separate document with `userId` as the key field.

## Best Practices

1. **Always backup** your `data.json` before migration
2. **Test the migration** on a separate test MongoDB database first
3. **Don't run migration multiple times** - it will overwrite your MongoDB data
4. **Keep test and production separate** - use different MongoDB databases or different Replit projects
5. **Monitor the first few days** after migration to ensure everything works

## Support

If you encounter issues:
1. Check the bot logs for error messages
2. Verify your environment variables are set correctly
3. Make sure your MongoDB connection string is valid
4. Try testing with a fresh MongoDB database
