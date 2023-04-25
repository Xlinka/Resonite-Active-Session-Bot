const { SlashCommandBuilder } = require('@discordjs/builders');
const fetch = require('node-fetch');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Neos\'s latency'),
  async execute(interaction) {
    const response = await fetch('https://cloudxstorage.blob.core.windows.net/install/ServerResponse');
    const data = await response.json();
    
    const pingEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('Ping to Neos Servers')
      .setDescription(`Latency is ${data.responseTimeMilliseconds.toString()}ms.`)

    await interaction.reply({ embeds: [pingEmbed] });
  },
};
