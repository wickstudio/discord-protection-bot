const { AuditLogEvent, EmbedBuilder, GatewayIntentBits, PermissionsBitField } = require('discord.js');

async function handleBotAddition(member, config) {
    if (!config.botMonitoring.active || member.guild.id !== config.allowedGuildId || !member.user.bot) {
        return;
    }

    try {
        const fetchedLogs = await member.guild.fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.BotAdd,
        });
        const auditEntry = fetchedLogs.entries.find(entry => entry.target.id === member.id && Date.now() - entry.createdTimestamp < 10000);

        if (!auditEntry) {
            console.log("No recent Bot Add audit log entry found.");
            return;
        }

        const executor = auditEntry.executor;
        console.log(`${executor.tag} added a bot: ${member.user.tag}.`);

        let executorMember = await member.guild.members.fetch(executor.id).catch(() => null);
        if (executorMember) {
            const hasWhitelistedRole = executorMember.roles.cache.some(role => config.whitelistRoles.includes(role.id));
            if (hasWhitelistedRole) {
                console.log(`${executor.tag} has a whitelisted role, skipping action.`);
                return;
            }

            switch (config.botMonitoring.action) {
                case 'kick':
                    if (executorMember.kickable) await executorMember.kick('Unauthorized bot addition detected.');
                    break;
                case 'ban':
                    if (executorMember.bannable) await executorMember.ban({ reason: 'Unauthorized bot addition detected.' });
                    break;
                case 'timeout':
                    if (executorMember.moderatable) await executorMember.timeout(config.botMonitoring.timeoutDuration, 'Unauthorized bot addition detected.');
                    break;
            }
            console.log(`Action ${config.botMonitoring.action} was taken against ${executor.tag} for adding a bot.`);
        }

        switch (config.botMonitoring.botAction) {
            case 'kick':
                if (member.kickable) await member.kick('Unauthorized bot addition.');
                break;
            case 'ban':
                if (member.bannable) await member.ban({ reason: 'Unauthorized bot addition.' });
                break;
        }
        console.log(`Bot ${member.user.tag} was ${config.botMonitoring.botAction} after being added.`);

        const logChannel = member.guild.channels.cache.get(config.logChannelId);
        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setTitle(`Added Bot Detected`)
                .setDescription(`**User :** ${executor.tag}\n**Bot :** ${member.user.tag}\n**User Action :** ${config.botMonitoring.action}\n**Bot Action :** ${config.botMonitoring.botAction}`)
                .setColor(0xFF0000)
                .setTimestamp();
            logChannel.send({ embeds: [logEmbed] }).catch(console.error);
        }
    } catch (error) {
        console.error("An error occurred while handling bot addition:", error);
    }
}

module.exports = {
    name: 'guildMemberAdd',
    async execute(member, client, config) {
        await handleBotAddition(member, config);
    },
};
