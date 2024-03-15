const { AuditLogEvent, EmbedBuilder } = require('discord.js');

let channelActivityCache = [];

async function handleChannelActivity(channel, action, config) {
    if (!config.channelMonitoring.active || channel.guild.id !== config.allowedGuildId) {
        console.log("Channel monitoring is inactive or the event is from an unauthorized guild.");
        return;
    }

    try {
        const fetchedLogs = await channel.guild.fetchAuditLogs({
            limit: 1,
            type: action === 'create' ? AuditLogEvent.ChannelCreate : AuditLogEvent.ChannelDelete,
        }).catch(error => console.error("Failed to fetch audit logs for channel activity:", error));

        const auditEntry = fetchedLogs ? fetchedLogs.entries.first() : null;

        if (!auditEntry || Date.now() - auditEntry.createdTimestamp > 5000) {
            console.log(`No recent audit log entry found for channel ${action}.`);
            return;
        }

        const executor = auditEntry.executor;
        console.log(`${executor.tag} ${action} the channel ${channel.name}`);

        let member = await channel.guild.members.fetch(executor.id).catch(() => {
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
        channelActivityCache.push({ executorId: executor.id, timestamp: now });
        channelActivityCache = channelActivityCache.filter(record => now - record.timestamp < config.channelMonitoring.timeFrame);

        const recentActivities = channelActivityCache.filter(record => record.executorId === executor.id).length;

        if (recentActivities > config.channelMonitoring.maxChannelChanges) {
            switch (config.channelMonitoring.action) {
                case 'kick':
                    await member.kick('Excessive channel creation/deletion detected.').catch(error => console.error("Failed to kick:", error));
                    break;
                case 'ban':
                    await member.ban({ reason: 'Excessive channel creation/deletion detected.' }).catch(error => console.error("Failed to ban:", error));
                    break;
                case 'timeout':
                    await member.timeout(config.channelMonitoring.timeoutDuration, 'Excessive channel creation/deletion detected.').catch(error => console.error("Failed to timeout:", error));
                    break;
            }
            console.log(`${executor.tag} has been ${config.channelMonitoring.action} due to excessive channel ${action}.`);

            const logChannel = channel.guild.channels.cache.get(config.logChannelId);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle(`Channel ${action} Detected`)
                    .setDescription(`**User :** ${executor.tag}\n**Action :** ${config.channelMonitoring.action}`)
                    .setColor(0xFF0000)
                    .addFields({ name: 'Detected At', value: `<t:${Math.floor(now / 1000)}:F>`, inline: false })
                    .setTimestamp();
                logChannel.send({ embeds: [logEmbed] }).catch(error => console.error("Failed to send log message:", error));
            }

            channelActivityCache = channelActivityCache.filter(record => record.executorId !== executor.id);
        }
    } catch (error) {
        console.error("An error occurred while handling channel activity:", error);
    }
}

module.exports = [
    {
        name: 'channelCreate',
        async execute(channel, client, config) {
            await handleChannelActivity(channel, 'create', config);
        },
    },
    {
        name: 'channelDelete',
        async execute(channel, client, config) {
            await handleChannelActivity(channel, 'delete', config);
        },
    },
];
