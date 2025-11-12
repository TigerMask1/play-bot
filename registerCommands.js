const { REST, Routes, ApplicationCommandOptionType } = require('discord.js');

const commands = [
  {
    name: 'arena',
    description: 'Launch the interactive battle arena!',
    options: []
  },
  {
    name: 'launch',
    description: 'Start a battle activity in voice channel',
    options: []
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

    await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands },
    );

    console.log('✅ Successfully registered application commands globally!');
    console.log('📝 Registered commands:', commands.map(c => `/${c.name}`).join(', '));
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
