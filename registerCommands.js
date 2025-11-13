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
    
    // Log existing command details for debugging
    existingCommands.forEach(cmd => {
      console.log(`   - /${cmd.name} (ID: ${cmd.id}, Entry Point: ${!!(cmd.integration_types?.length)})`);
    });

    // Build a map of existing commands by name (including their IDs)
    const existingCommandsMap = new Map(existingCommands.map(c => [c.name, c]));

    // Build the final command list
    const commandsToRegister = [];
    
    for (const newCmd of commands) {
      const existingCmd = existingCommandsMap.get(newCmd.name);
      
      if (existingCmd) {
        // Command exists - merge new definition with existing ID
        console.log(`🔄 Updating existing command: /${newCmd.name} (ID: ${existingCmd.id})`);
        
        const updatedCmd = {
          ...newCmd,
          id: existingCmd.id
        };
        
        commandsToRegister.push(updatedCmd);
        existingCommandsMap.delete(newCmd.name);
      } else {
        // New command - add as-is
        console.log(`➕ Adding new command: /${newCmd.name}`);
        commandsToRegister.push(newCmd);
      }
    }
    
    // Preserve any remaining Entry Point commands that aren't in our new list
    for (const [name, existingCmd] of existingCommandsMap) {
      if (existingCmd.integration_types && existingCmd.integration_types.length > 0) {
        console.log(`📌 Preserving Entry Point command: /${name} (ID: ${existingCmd.id})`);
        
        // Strip read-only fields but keep essential data including ID
        const preservedCmd = {
          id: existingCmd.id,
          name: existingCmd.name,
          description: existingCmd.description,
          integration_types: existingCmd.integration_types,
          contexts: existingCmd.contexts
        };
        
        if (existingCmd.options && existingCmd.options.length > 0) {
          preservedCmd.options = existingCmd.options;
        }
        
        if (existingCmd.type !== undefined) {
          preservedCmd.type = existingCmd.type;
        }
        
        commandsToRegister.push(preservedCmd);
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
