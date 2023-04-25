const { Client, GatewayIntentBits, Collection  } = require('discord.js');
const config = require('./config.json');
const { DISCORD_TOKEN, CHANNEL_ID, API_URL, REFRESH_INTERVAL, USERSTATAPI } = config;
const sendSessionUpdates = require('./Functions/SendSessionUpdates.js');
const sendUserStatistics = require('./Functions/SendUserStatistics.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageTyping,
  ]
});

const refreshInterval = REFRESH_INTERVAL;
const channelId = CHANNEL_ID;
const apiUrl = API_URL;
const userstatapi = USERSTATAPI;

client.commands = new Collection();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  console.log(`Sending session updates to channel ${channelId}`);
  setInterval(() => sendSessionUpdates(client, channelId, apiUrl), refreshInterval);
  setInterval(() => sendUserStatistics(client, channelId, userstatapi), refreshInterval);
});


// create collection to store slash commands
client.commands = new Collection();

// import slash commands
const commandFiles = fs
  .readdirSync('./Commands')
  .filter((file) => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./Commands/${file}`);
  client.commands.set(command.data.name, command);
}

// handle Discord ready event
client.once('ready', async () => {

  // create REST API client
  const rest = new REST({ version: '9' }).setToken(config.DISCORD_TOKEN);

  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands(config.APPLICATION_ID),
      { body: client.commands.map((command) => command.data.toJSON()) }
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
});
// handle Discord interaction create event (for slash commands)
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
  }
});

client.login(DISCORD_TOKEN);
