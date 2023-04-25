const fetch = require('node-fetch');
const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');
const userstatapi = config.USERSTATAPI;
const channelId = config.CHANNEL_ID;
let userStatsMessage;

async function sendUserStatistics(client) {
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

module.exports = sendUserStatistics;