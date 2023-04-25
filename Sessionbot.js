const fetch = require('node-fetch');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const config = require('./config.json');
const { DISCORD_TOKEN, CHANNEL_ID, API_URL, REFRESH_INTERVAL, UserStat_API } = config;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageTyping,
  ]
})

const channelId = CHANNEL_ID;
const apiUrl = API_URL;
const refreshInterval = REFRESH_INTERVAL;
const userstatapi = UserStat_API;
let userStatsMessage; // Declare userStatsMessage variable here

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  console.log(`Sending session updates to channel ${channelId}`);
  setInterval(sendSessionUpdates, refreshInterval);
  setInterval(sendUserStatistics, refreshInterval);
});

function removeHtmlColorTags(text) {
  return text.replace(/<color=#[^>]+>/g, '').replace(/<\/color>/g, '');
}

function calculateUptime(sessionBeginTime) {
  const beginTime = new Date(sessionBeginTime);
  const currentTime = new Date();
  const uptimeMilliseconds = currentTime - beginTime;
  const seconds = Math.floor((uptimeMilliseconds / 1000) % 60);
  const minutes = Math.floor((uptimeMilliseconds / (1000 * 60)) % 60);
  const hours = Math.floor((uptimeMilliseconds / (1000 * 60 * 60)) % 24);
  const days = Math.floor(uptimeMilliseconds / (1000 * 60 * 60 * 24));

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

async function sendUserStatistics() {
  try {
    const response = await fetch(userstatapi);
    if (!response.ok) {
      throw new Error(`Received status ${response.status} ${response.statusText}`);
    }

    const stats = await response.json();
    console.log(`Stats:`, stats);

    const channel = await client.channels.fetch(channelId);

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('User Statistics')
      .addFields(
        { name: 'Registered Users', value: stats.registeredUserCount.toString(), inline: true  },
        { name: 'VR Users', value: stats.vrUserCount.toString(), inline: true  },
        { name: 'Screen Users', value: stats.screenUserCount.toString(), inline: true  },
        { name: 'Headless Users', value: stats.headlessUserCount.toString(), inline: true  },
        { name: 'Mobile Users', value: stats.mobileUserCount.toString(), inline: true  },
        { name: 'Instances', value: stats.instanceCount.toString(), inline: true  },
        { name: 'Public Sessions', value: `${stats.activePublicSessionCount.toString()} / ${stats.publicSessionCount.toString()}`, inline: true  },
      );

    if (userStatsMessage) {
      // Update existing user stats message
      userStatsMessage = await userStatsMessage.edit({ embeds: [embed] });
    } else {
      // Send new user stats message
      userStatsMessage = await channel.send({ embeds: [embed] });
    }

  } catch (error) {
    console.error(`Error while fetching or sending user statistics: ${error.message}`);
    console.error(error.stack);
  }
}




async function sendSessionUpdates() {
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Received status ${response.status} ${response.statusText}`);
    }
    const sessions = await response.json();
    const activeSessions = sessions.filter(session => !session.hasEnded && session.activeUsers > 0);

    console.log(`Fetched ${activeSessions.length} active sessions from Neos API`);

    const channel = await client.channels.fetch(channelId);

    // Fetch previous session messages in the channel
    const messages = await channel.messages.fetch();
    const sessionMessages = messages.filter(message => message.author.id === client.user.id && message.embeds.length > 0 && message.embeds[0].footer?.text === 'Session information updated');
    const sessionMessageIds = sessionMessages.map(message => message.id);

    // Delete previous session messages in the channel
    if (sessionMessageIds.length > 0) {
      await channel.bulkDelete(sessionMessageIds);
    }

    // Send updated session messages
    const newSessionMessageIds = [];
    for (const [index, session] of activeSessions.entries()) {
      let imageUrl = session.thumbnail;
      if (imageUrl && imageUrl.startsWith('neosdb:///')) {
        imageUrl = imageUrl.replace('neosdb:///', 'https://assets.neos.com/assets/').replace('.webp', '');
      }
      const cleanName = removeHtmlColorTags(session.name);
      const uptime = calculateUptime(session.sessionBeginTime);

      let sessionUrls = session.sessionURLs
      .filter(url => url != null)
      .map(url => {
        if (url.startsWith('lnl-nat://')) {
          return `\`${url}\``;
        } else if (url.startsWith('neos-steam://')) {
          return `\`${url}\``;
        } else {
          return '';
        }
      })
      .join('\n');
      
      let joinedUsers = session.sessionUsers.join(", ");

      const embed = new EmbedBuilder()
        .setTitle(`Session ${index + 1}: ${cleanName}`)
        .setColor('#0099ff')
        .setDescription(session.description || 'No description provided')
        .addFields(
          { name: 'Host', value: session.hostUsername, inline: true },
          { name: 'Users', value: `${session.activeUsers} (${session.totalActiveUsers})`, inline: true },
          { name: 'Uptime', value: uptime, inline: true },
          { name: 'Neos Version', value: session.neosVersion, inline: true },
          { name: 'Headless Server', value: session.headlessHost.toString(), inline: true },
          { name: 'Mobile Friendly', value: session.mobileFriendly.toString(), inline: true },
          { name: 'Users', value: joinedUsers },
          { name: 'Session URLs', value: sessionUrls },
          { name: 'Join Session', value: `http://cloudx.azurewebsites.net/open/session/${session.sessionId}` },
        )
        .setImage(imageUrl)
        .setTimestamp()
        .setFooter({ text: 'Session information updated' });

      const message = await channel.send({ embeds: [embed] });
      newSessionMessageIds.push(message.id);
    }

    // Store new session message IDs for future updates
    sessionMessageIds.push(...newSessionMessageIds);

  } catch (error) {
    console.error(`Error while fetching or sending session updates: ${error.message}`);
    console.error(error.stack);
  }
}

client.login(DISCORD_TOKEN);
