const fetch = require('node-fetch');
const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');
const channelId = config.CHANNEL_ID;

const apiUrl = config.API_URL;

function removeHtmlColorTags(text) {
  const regex = /<color=[^>]+>|<\/color>|<b>|<\/b>|<u>|<\/u>/g;
  return text.replace(regex, '');
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

async function sendSessionUpdates(client) {
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

      const userList = session.sessionUsers.map(user => user.username).join(', ');

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
          { name: 'Session URLs', value: sessionUrls },
          { name: 'Join Session', value: `http://cloudx.azurewebsites.net/open/session/${session.sessionId}` },
          { name: 'Users', value: userList },
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


module.exports = sendSessionUpdates;