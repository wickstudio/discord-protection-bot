const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'messageCreate',
  execute(message, client, config) {
    if (message.guild.id !== config.allowedGuildId || !config.antilinks.active || message.author.bot) return;

    const hasWhitelistedRole = message.member.roles.cache.some(role => config.whitelistRoles.includes(role.id));
    if (hasWhitelistedRole) {
      console.log(`Message from ${message.author.tag} ignored by antilinks due to whitelisted role.`);
      return;
    }

    const linkPattern = /https?:\/\/\S+/gi;
    if (!linkPattern.test(message.content)) return;

    let actionTaken = 'Detected';

    if (config.antilinks.deleteMessages) {
      message.delete().catch(error => console.error("Failed to delete link message:", error));
      actionTaken = 'Deleted Message';
    }

    const now = Date.now();

    const actions = config.antilinks.actions;
    if (actions.timeout) {
      message.member.timeout(actions.timeoutDuration, "Posting links is not allowed.").catch(error => console.error("Failed to timeout member:", error));
      actionTaken += ', Timeout';
    }

    if (actions.kick) {
      message.member.kick("Posting links is not allowed.").catch(error => console.error("Failed to kick member:", error));
      actionTaken += ', Kick';
    }

    if (actions.ban) {
      message.member.ban({ reason: "Posting links is not allowed." }).catch(error => console.error("Failed to ban member:", error));
      actionTaken += ', Ban';
    }

    const logChannel = client.channels.cache.get(config.logChannelId);
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setTitle('Link Detection')
        .setColor(0xFFA500)
        .addFields(
          { name: 'User', value: `<@${message.author.id}>`, inline: true },
          { name: 'Action', value: actionTaken, inline: true },
          { name: 'Channel', value: `<#${message.channel.id}>`, inline: true },
          { name: 'Detected At', value: `<t:${Math.floor(now / 1000)}:F>`, inline: false }
        )
        .setTimestamp();
      logChannel.send({ embeds: [logEmbed] }).catch(error => console.error("Failed to send log message:", error));
    }
  },
};
