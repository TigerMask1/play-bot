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
    console.error('❌ DISCORD_BOT_TOKEN is required to register commands');
    process.exit(1);
  }

  if (!clientId) {
    console.error('❌ DISCORD_APPLICATION_ID is required to register commands');
    process.exit(1);
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
    process.exit(1);
  }
}

if (require.main === module) {
  registerCommands();
}

module.exports = { registerCommands, commands };
