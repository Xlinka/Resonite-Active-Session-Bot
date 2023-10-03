# Resonite Active Session Bot

Resonite Active Session Bot is a Discord bot that periodically fetches information about active sessions from the Neos API and posts it to a designated channel on a Discord server.

## Usage

1. Clone this repository to your local machine.
2. Install the necessary dependencies with `npm install`.
3. Open `config.json` in a text editor and edit the following fields:
   - `DISCORD_TOKEN`: The token for your Discord bot account.
   - `CHANNEL_ID`: The ID of the Discord channel where you want the session updates to be posted.
   - `API_URL`: The URL of the Neos API to fetch session information from.
   - `REFRESH_INTERVAL`: The interval at which to fetch new session information, in milliseconds.
4. Run the bot with `node sessionbot.js`.

## Credits

This bot is a recreation of the bot used in the Main Neos Discord.
