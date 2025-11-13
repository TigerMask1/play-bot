const { REST, Routes, ApplicationCommandOptionType } = require('discord.js');

const commands = [
  {
    name: 'arena',
    description: 'Launch the interactive battle arena!',
    options: [],
    integration_types: [0, 1],
    contexts: [0, 1, 2]
  },
  {
    name: 'launch',
    description: 'Start a battle activity in voice channel',
    options: [],
    integration_types: [0, 1],
    contexts: [0, 1, 2]
  }
];

async function registerCommands() {
  const token = process.env.DISCORD_BOT_TOKEN;
  const clientId = process.env.DISCORD_APPLICATION_ID;

  if (!token) {
    const error = new Error('DISCORD_BOT_TOKEN is required to register commands');
    console.error('❌', error.message);
    throw error;
  }

  if (!clientId) {
    const error = new Error('DISCORD_APPLICATION_ID is required to register commands');
    console.error('❌', error.message);
    throw error;
  }

  const rest = new REST({ version: '10' }).setToken(token);

  try {
    console.log('🔄 Started refreshing application (/) commands...');

    // Fetch existing commands to preserve Entry Point commands
    const existingCommands = await rest.get(
      Routes.applicationCommands(clientId)
    );

    console.log(`📋 Found ${existingCommands.length} existing command(s)`);

    // Find any Entry Point commands (these have integration_types set)
    const entryPointCommands = existingCommands.filter(cmd => 
      cmd.integration_types && cmd.integration_types.length > 0
    );

    console.log(`🔍 Found ${entryPointCommands.length} Entry Point command(s)`);

    // Build a map of our new commands by name
    const newCommandsMap = new Map(commands.map(c => [c.name, c]));
    
    // Combine our commands with existing Entry Point commands
    const commandsToRegister = [...commands];
    
    for (const entryCmd of entryPointCommands) {
      // Only add if we don't already have a command with this name
      if (!newCommandsMap.has(entryCmd.name)) {
        console.log(`📌 Preserving Entry Point command: /${entryCmd.name}`);
        // Preserve the complete command structure
        const preservedCmd = {
          name: entryCmd.name,
          description: entryCmd.description,
          integration_types: entryCmd.integration_types,
          contexts: entryCmd.contexts
        };
        
        // Include options if they exist
        if (entryCmd.options && entryCmd.options.length > 0) {
          preservedCmd.options = entryCmd.options;
        }
        
        // Include type if it exists
        if (entryCmd.type) {
          preservedCmd.type = entryCmd.type;
        }
        
        commandsToRegister.push(preservedCmd);
      } else {
        console.log(`⚠️ Command /${entryCmd.name} exists in both lists - using new definition`);
      }
    }

    console.log(`📤 Registering ${commandsToRegister.length} total command(s)...`);

    await rest.put(
      Routes.applicationCommands(clientId),
      { body: commandsToRegister },
    );

    console.log('✅ Successfully registered application commands globally!');
    console.log('📝 Registered commands:', commandsToRegister.map(c => `/${c.name}`).join(', '));
    console.log('⏰ Commands may take up to 1 hour to appear globally.');
    console.log('💡 To test immediately, use guild-specific registration instead.');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
    throw error;
  }
}

if (require.main === module) {
  registerCommands()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { registerCommands, commands };
