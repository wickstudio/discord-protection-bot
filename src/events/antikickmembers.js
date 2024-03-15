const { AuditLogEvent, EmbedBuilder } = require('discord.js');

let kickActivityCache = [];

async function handleKickActivity(guild, config) {
    if (!config.kickMonitoring.active || guild.id !== config.allowedGuildId) {
        console.log("Kick monitoring is inactive.");
        return;
    }

    try {
        const fetchedLogs = await guild.fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.MemberKick,
        }).catch(error => console.error("Failed to fetch audit logs for kick activity:", error));

        const auditEntry = fetchedLogs ? fetchedLogs.entries.first() : null;

        if (!auditEntry || Date.now() - auditEntry.createdTimestamp > 5000) {
            console.log("No recent kick audit log entry found.");
            return;
        }

        const executor = auditEntry.executor;
        console.log(`${executor.tag} kicked a member.`);

        let member = await guild.members.fetch(executor.id).catch(() => {
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
        kickActivityCache.push({ executorId: executor.id, timestamp: now });
        kickActivityCache = kickActivityCache.filter(record => now - record.timestamp < config.kickMonitoring.timeFrame);

        const recentKicks = kickActivityCache.filter(record => record.executorId === executor.id).length;

        if (recentKicks > config.kickMonitoring.maxKicks) {
            switch (config.kickMonitoring.action) {
                case 'kick':
                    await member.kick('Excessive kicking of members detected.').catch(error => console.error("Failed to kick:", error));
                    break;
                case 'ban':
                    await member.ban({ reason: 'Excessive kicking of members detected.' }).catch(error => console.error("Failed to ban:", error));
                    break;
                case 'timeout':
                    await member.timeout(config.kickMonitoring.timeoutDuration, 'Excessive kicking of members detected.').catch(error => console.error("Failed to timeout:", error));
                    break;
            }
            console.log(`Action ${config.kickMonitoring.action} was taken against ${executor.tag} for excessive kicking.`);

            const logChannel = guild.channels.cache.get(config.logChannelId);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle(`Member Kicking Detected`)
                    .setDescription(`**User :** ${executor.tag}\n**Action :** ${config.kickMonitoring.action}`)
                    .setColor(0xFF0000)
                    .addFields({ name: 'Detected At', value: `<t:${Math.floor(now / 1000)}:F>`, inline: false })
                    .setTimestamp();
                logChannel.send({ embeds: [logEmbed] }).catch(error => console.error("Failed to send log message:", error));
            }

            kickActivityCache = kickActivityCache.filter(record => record.executorId !== executor.id);
        }
    } catch (error) {
        console.error("An error occurred while handling kick activity:", error);
    }
}

module.exports = {
    name: 'guildMemberRemove',
    async execute(member, client, config) {
        await handleKickActivity(member.guild, config);
    },
};
