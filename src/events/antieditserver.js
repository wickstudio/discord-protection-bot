const { AuditLogEvent, EmbedBuilder } = require('discord.js');

let serverEditActivityCache = [];

async function handleServerEditActivity(oldGuild, newGuild, config) {
    if (!config.serverEditMonitoring.active || newGuild.id !== config.allowedGuildId) {
        console.log("Server edit monitoring is inactive or not for this guild.");
        return;
    }

    try {
        const fetchedLogs = await newGuild.fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.GuildUpdate,
        }).catch(error => console.error("Failed to fetch audit logs for server edit:", error));

        const auditEntry = fetchedLogs ? fetchedLogs.entries.first() : null;

        if (!auditEntry || Date.now() - auditEntry.createdTimestamp > 5000) {
            console.log("No recent server edit audit log entry found.");
            return;
        }

        const executor = auditEntry.executor;
        console.log(`${executor.tag} has edited the server.`);

        let member = await newGuild.members.fetch(executor.id).catch(() => {
            console.log(`Failed to fetch member: ${executor.tag}`);
            return null;
        });
        if (!member) return;

        const hasWhitelistedRole = member.roles.cache.some(role => config.whitelistRoles.includes(role.id));
        if (hasWhitelistedRole) {
            console.log(`${executor.tag} has a whitelisted role, skipping action.`);
            return;
        }

        const now = Date.now();
        serverEditActivityCache.push({ executorId: executor.id, timestamp: now });
        serverEditActivityCache = serverEditActivityCache.filter(record => now - record.timestamp < config.serverEditMonitoring.timeFrame);

        const recentEdits = serverEditActivityCache.filter(record => record.executorId === executor.id).length;

        if (recentEdits > config.serverEditMonitoring.maxEdits) {
            switch (config.serverEditMonitoring.action) {
                case 'kick':
                    await member.kick('Excessive server editing detected.').catch(error => console.error("Failed to kick:", error));
                    break;
                case 'ban':
                    await member.ban({ reason: 'Excessive server editing detected.' }).catch(error => console.error("Failed to ban:", error));
                    break;
                case 'timeout':
                    await member.timeout(config.serverEditMonitoring.timeoutDuration, 'Excessive server editing detected.').catch(error => console.error("Failed to timeout:", error));
                    break;
            }
            console.log(`Action ${config.serverEditMonitoring.action} was taken against ${executor.tag} for excessive server editing.`);

            const logChannel = newGuild.channels.cache.get(config.logChannelId);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle(`Server Editing Detected`)
                    .setDescription(`**User :** ${executor.tag}\n**Action :** ${config.serverEditMonitoring.action}`)
                    .setColor(0xFF0000)
                    .addFields({ name: 'Detected At', value: `<t:${Math.floor(now / 1000)}:F>`, inline: false })
                    .setTimestamp();
                logChannel.send({ embeds: [logEmbed] }).catch(error => console.error("Failed to send log message:", error));
            }

            serverEditActivityCache = serverEditActivityCache.filter(record => record.executorId !== executor.id);
        }
    } catch (error) {
        console.error("Error handling server edit activity:", error);
    }
}

module.exports = {
    name: 'guildUpdate',
    async execute(oldGuild, newGuild, client, config) {
        await handleServerEditActivity(oldGuild, newGuild, config);
    },
};
