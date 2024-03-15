const { AuditLogEvent, EmbedBuilder } = require('discord.js');

let roleActivityCache = [];

async function handleRoleActivity(role, action, config) {
    if (!config.roleMonitoring.active || role.guild.id !== config.allowedGuildId) {
        console.log("Role monitoring is inactive or the event is from an unauthorized guild.");
        return;
    }

    try {
        const fetchedLogs = await role.guild.fetchAuditLogs({
            limit: 1,
            type: action === 'create' ? AuditLogEvent.RoleCreate : AuditLogEvent.RoleDelete,
        }).catch(error => console.error("Failed to fetch audit logs for role activity:", error));

        const auditEntry = fetchedLogs ? fetchedLogs.entries.first() : null;

        if (!auditEntry || Date.now() - auditEntry.createdTimestamp > 5000) {
            console.log(`No recent audit log entry found for role ${action}.`);
            return;
        }

        const executor = auditEntry.executor;
        console.log(`${executor.tag} ${action} the role ${role.name}`);

        let member = await role.guild.members.fetch(executor.id).catch(() => {
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
        roleActivityCache.push({ executorId: executor.id, timestamp: now });
        roleActivityCache = roleActivityCache.filter(record => now - record.timestamp < config.roleMonitoring.timeFrame);

        const recentActivities = roleActivityCache.filter(record => record.executorId === executor.id).length;

        if (recentActivities > config.roleMonitoring.maxRoleChanges) {
            switch (config.roleMonitoring.action) {
                case 'kick':
                    await member.kick('Excessive role creation/deletion detected.').catch(error => console.error("Failed to kick:", error));
                    break;
                case 'ban':
                    await member.ban({ reason: 'Excessive role creation/deletion detected.' }).catch(error => console.error("Failed to ban:", error));
                    break;
                case 'timeout':
                    await member.timeout(config.roleMonitoring.timeoutDuration, 'Excessive role creation/deletion detected.').catch(error => console.error("Failed to timeout:", error));
                    break;
            }
            console.log(`${executor.tag} has been ${config.roleMonitoring.action} due to excessive role ${action}.`);

            const logChannel = role.guild.channels.cache.get(config.logChannelId);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle(`Role ${action} Detected`)
                    .setDescription(`**User :** ${executor.tag}\n**Action :** ${config.roleMonitoring.action}`)
                    .setColor(0xFF0000)
                    .addFields({ name: 'Detected At', value: `<t:${Math.floor(now / 1000)}:F>`, inline: false })
                    .setTimestamp();
                logChannel.send({ embeds: [logEmbed] }).catch(error => console.error("Failed to send log message:", error));
            }

            roleActivityCache = roleActivityCache.filter(record => record.executorId !== executor.id);
        }
    } catch (error) {
        console.error("An error occurred while handling role activity:", error);
    }
}

module.exports = [
    {
        name: 'roleCreate',
        async execute(role, client, config) {
            await handleRoleActivity(role, 'create', config);
        },
    },
    {
        name: 'roleDelete',
        async execute(role, client, config) {
            await handleRoleActivity(role, 'delete', config);
        },
    },
];
