# Wick Studio Protection Bot

The Wick Studio Protection Bot is a powerful Discord bot designed to safeguard your community with a suite of moderation tools. It provides real-time protection against spam, unauthorized links, bot addition, and other potential disruptions, ensuring your Discord experience remains enjoyable and secure.

## Key Features

- **Customizable Protection**: Each event, such as antispam, antilinks, or role monitoring, can be finely tuned to the server's needs through our interactive dashboard panel.
- **Dashboard Panel**: A user-friendly web interface for managing bot settings and configurations without the need to edit code directly.
- **Whitelist Roles**: Specific roles can be whitelisted to bypass protection actions, granting flexibility to trusted users.
- **Detailed Logs**: All protection alerts are sent to a designated log channel in embeds for easy tracking and oversight.
- **Comprehensive Event Handling**: From antiban to antispam, each script is dedicated to safeguarding a particular aspect of server life.

## Features

**Event Handlers:**

- `antibanmembers.js`: Monitors and takes action against users who ban members excessively.
- `antibots.js`: Prevents unauthorized bots from joining the server and takes action against the inviter.
- `antieditrole.js`: Tracks and restricts excessive editing of role permissions and details.
- `antieditserver.js`: Guards against and mitigates rapid server setting changes.
- `antikickmembers.js`: Detects and responds to users who kick members excessively.
- `antilinks.js`: Filters out unwanted links posted in the server and takes appropriate measures.
- `antispam.js`: Keeps channels clean by managing and removing spam messages.
- `channels.js`: Supervises channel creation and deletion, preventing channel spam.
- `roles.js`: Oversees the creation and deletion of roles within the server.

Each event handler is fine-tuned to respond effectively to various moderation challenges, configured to respect server-specific settings such as whitelisted roles and action thresholds through the dashboard panel.

## Installation

1. Clone this repository.
2. Navigate to the bot's directory and run `npm install`.
3. Set up your `config.js` with the necessary Discord bot token and server settings.
4. Access the dashboard panel to customize your settings through a web interface.
5. Start the bot with `node index.js`.

## Dashboard Access

To access the dashboard, simply navigate to the URL provided upon starting the bot. Here you can adjust settings, monitor events, and customize protection measures with ease.

## Contributing

Contributions to the Wick Studio Protection Bot are welcome. Please feel free to fork the repository, make your changes, and submit a pull request for review.

## Support

If you encounter any issues or require support, join our Discord community: [Wick Studio Discord](https://discord.gg/wicks).

## Acknowledgments

- [Discord.js](https://discord.js.org/) for providing the framework to build this bot.
- [Express.js](https://ejs.co/) for providing the framework to build this Dashbord.
- The Wick Studio community for continuous support and feedback.

## Contact

- Email: info@wickdev.xyz
- Website: https://wickdev.xyz
- Discord: https://discord.gg/wicks
- Youtube: https://www.youtube.com/@wick_studio

---

Powered by creativity and coffee, crafted with ❤️ by Wick Studio.