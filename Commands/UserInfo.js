const { SlashCommandBuilder } = require('@discordjs/builders');
const fetch = require('node-fetch');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('neosuser')
    .setDescription('Get user info')
    .addStringOption(option =>
      option.setName('username')
      .setDescription('The username')
      .setRequired(true)),
  async execute(interaction) {
    const username = interaction.options.getString('username');
    const url = `https://api.resonite.com/users/U-${username}`;
    const response = await fetch(url);
    const data = await response.json();

    const registrationDate = new Date(data.registrationDate);
    const currentDate = new Date();
    
    const nextBreadDay = new Date();
    nextBreadDay.setFullYear(currentDate.getFullYear());
    nextBreadDay.setMonth(registrationDate.getMonth());
    nextBreadDay.setDate(registrationDate.getDate());
    
    if (nextBreadDay.getTime() < currentDate.getTime()) {
      nextBreadDay.setFullYear(currentDate.getFullYear() + 1);
    }
    
    const timeUntilBreadDay = nextBreadDay.getTime() - currentDate.getTime();
    const daysUntilBreadDay = Math.ceil(timeUntilBreadDay / (1000 * 3600 * 24));
    const breadDay = daysUntilBreadDay === 0 ? 'Today!' : `in ${daysUntilBreadDay} day${daysUntilBreadDay === 1 ? '' : 's'}`;
    
    let imageUrl = data.profile.iconUrl;
    if (imageUrl && imageUrl.startsWith('resdb:///')) {
      imageUrl = imageUrl.replace('resdb:///', 'https://assets.resonite.com/').replace('.webp', '');
    }
    
    const userEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`User info for ${data.username}`)
      .setThumbnail(imageUrl)
      .addFields(
        { name: 'Registration Date', value: registrationDate.toDateString() },
        { name: 'Is Verified', value: data.isVerified.toString() },
        { name: 'Public Ban Type', value: data.publicBanType || 'None' },
        { name: 'Time till Bread Day', value: breadDay },
      )
    
    await interaction.reply({ embeds: [userEmbed] });
  },
};
