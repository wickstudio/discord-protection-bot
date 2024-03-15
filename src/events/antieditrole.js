const { AuditLogEvent, EmbedBuilder } = require('discord.js');

let roleEditActivityCache = [];

async function handleRoleEditActivity(guild, type, role, config) {
    if (!config.roleEditMonitoring.active || guild.id !== config.allowedGuildId) {
        console.log("Role edit monitoring is inactive or not for this guild.");
        return;
    }

    try {
        const fetchedLogs = await guild.fetchAuditLogs({
            limit: 5,
            type: type === 'update' ? AuditLogEvent.RoleUpdate : AuditLogEvent.GuildMemberUpdate,
        }).catch(error => console.error("Failed to fetch audit logs:", error));

        const auditEntry = fetchedLogs ? fetchedLogs.entries.find(entry =>
            (entry.target.id === role.id || entry.target.id === role.user?.id) &&
            Date.now() - entry.createdTimestamp < 10000) : null;

        if (!auditEntry) {
            console.log(`No relevant audit log entry found for role ${type}.`);
            return;
        }

        const executor = auditEntry.executor;
        console.log(`${executor.tag} has edited a role or role assignment.`);

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

        roleEditActivityCache.push({ executorId: executor.id, timestamp: Date.now() });
        roleEditActivityCache = roleEditActivityCache.filter(record => Date.now() - record.timestamp < config.roleEditMonitoring.timeFrame);

        const recentEdits = roleEditActivityCache.filter(record => record.executorId === executor.id).length;

        if (recentEdits > config.roleEditMonitoring.maxEdits) {
            switch (config.roleEditMonitoring.action) {
                case 'kick':
                    await member.kick('Excessive role editing detected.').catch(error => console.error("Failed to kick:", error));
                    break;
                case 'ban':
                    await member.ban({ reason: 'Excessive role editing detected.' }).catch(error => console.error("Failed to ban:", error));
                    break;
                case 'timeout':
                    await member.timeout(config.roleEditMonitoring.timeoutDuration, 'Excessive role editing detected.').catch(error => console.error("Failed to timeout:", error));
                    break;
            }
            console.log(`Action ${config.roleEditMonitoring.action} was taken against ${executor.tag} for excessive role editing.`);

            const logChannel = guild.channels.cache.get(config.logChannelId);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle(`Role Editing Detected`)
                    .setDescription(`**User :** ${executor.tag}\n**Action :** ${config.roleEditMonitoring.action}`)
                    .setColor(0xFF0000)
                    .addFields({ name: 'Detected At', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false })
                    .setTimestamp();
                logChannel.send({ embeds: [logEmbed] }).catch(error => console.error("Failed to send log message:", error));
            }

            roleEditActivityCache = roleEditActivityCache.filter(record => record.executorId !== executor.id);
        }
    } catch (error) {
        console.error("Error handling role edit activity:", error);
    }
}

module.exports = [
    {
        name: 'roleUpdate',
        async execute(oldRole, newRole, client, config) {
            await handleRoleEditActivity(newRole.guild, 'update', newRole, config);
        },
    },
    {
        name: 'guildMemberUpdate',
        async execute(oldMember, newMember, client, config) {
            const roleChanges = newMember.roles.cache.difference(oldMember.roles.cache);
            if (roleChanges.size > 0) {
                await handleRoleEditActivity(newMember.guild, 'assignment', newMember, config);
            }
        },
    },
];
