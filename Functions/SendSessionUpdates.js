const fetch = require('node-fetch');
const { MessageEmbed } = require('discord.js');
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
    const activeSessions = sessions.filter(session => session.isValid && !session.hasEnded);

    console.log(`Fetched ${activeSessions.length} active sessions from API`);

    const channel = await client.channels.fetch(channelId);

    // Fetch previous session messages in the channel
    const messages = await channel.messages.fetch();
    const sessionMessages = messages.filter(message => message.author.id === client.user.id && message.embeds.length > 0);
    const sessionMessageIds = sessionMessages.map(message => message.id);

    // Delete previous session messages in the channel
    if (sessionMessageIds.length > 0) {
      await channel.bulkDelete(sessionMessageIds);
    }

    // Send updated session messages
    for (const [index, session] of activeSessions.entries()) {
      const cleanName = removeHtmlColorTags(session.name);
      const uptime = calculateUptime(session.sessionBeginTime);

      const embed = new MessageEmbed()
        .setTitle(`Session ${index + 1}: ${cleanName}`)
        .setColor('#0099ff')
        .addFields(
          { name: 'Host', value: session.hostUsername, inline: true },
          { name: 'Active Users', value: session.activeUsers.toString(), inline: true },
          { name: 'Total Joined Users', value: session.totalJoinedUsers.toString(), inline: true },
          { name: 'Uptime', value: uptime, inline: true },
          { name: 'App Version', value: session.appVersion, inline: true },
          { name: 'Headless Host', value: session.headlessHost.toString(), inline: true },
          { name: 'Mobile Friendly', value: session.mobileFriendly.toString(), inline: true }
        )
        .setImage(session.thumbnailUrl)
        .setTimestamp()
        .setFooter('Session information updated');

      await channel.send({ embeds: [embed] });
    }

  } catch (error) {
    console.error(`Error while fetching or sending session updates: ${error.message}`);
    console.error(error.stack);
  }
}

module.exports = sendSessionUpdates;
