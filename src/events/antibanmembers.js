const { AuditLogEvent, EmbedBuilder } = require('discord.js');

let banActivityCache = [];

async function handleBanActivity(guild, config) {
    if (!config.banMonitoring.active || guild.id !== config.allowedGuildId) {
        console.log("Ban monitoring is inactive or not for this guild.");
        return;
    }

    try {
        const fetchedLogs = await guild.fetchAuditLogs({
            limit: 5,
            type: AuditLogEvent.MemberBanAdd,
        });
        const recentBanEntry = fetchedLogs.entries.find(entry => Date.now() - entry.createdTimestamp < 10000);

        if (!recentBanEntry) {
            console.log("No relevant ban audit log entry found.");
            return;
        }

        const executor = recentBanEntry.executor;
        console.log(`${executor.tag} has banned a member.`);

        const member = await guild.members.fetch(executor.id).catch(() => {
            console.log(`Failed to fetch member: ${executor.tag}`);
            return null;
        });
        if (!member) return;

        const hasWhitelistedRole = member.roles.cache.some(role => config.whitelistRoles.includes(role.id));
        if (hasWhitelistedRole) {
            console.log(`${executor.tag} has a whitelisted role, skipping action.`);
            return;
        }

        const timestamp = Date.now();
        banActivityCache.push({ executorId: executor.id, timestamp });
        banActivityCache = banActivityCache.filter(record => timestamp - record.timestamp < config.banMonitoring.timeFrame);

        const recentBans = banActivityCache.filter(record => record.executorId === executor.id).length;

        if (recentBans > config.banMonitoring.maxBans) {
            switch (config.banMonitoring.action) {
                case 'kick':
                    if (member.kickable) await member.kick('Excessive banning detected.');
                    break;
                case 'ban':
                    if (member.bannable) await member.ban({ reason: 'Excessive banning detected.' });
                    break;
                case 'timeout':
                    if (member.moderatable) await member.timeout(config.banMonitoring.timeoutDuration, 'Excessive banning detected.');
                    break;
            }
            console.log(`Action taken: ${config.banMonitoring.action} on ${executor.tag} for excessive banning.`);

            const logChannel = guild.channels.cache.get(config.logChannelId);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle(`Banning Detected`)
                    .setDescription(`**User :** ${executor.tag}\n**Action :** ${config.banMonitoring.action}`)
                    .setColor(0xFF0000)
                    .addFields({ name: 'Detected At', value: `<t:${Math.floor(timestamp / 1000)}:F>`, inline: false })
                    .setTimestamp();
                logChannel.send({ embeds: [logEmbed] }).catch(console.error);
            }

            banActivityCache = banActivityCache.filter(record => record.executorId !== executor.id);
        }
    } catch (error) {
        console.error("Error handling ban activity:", error);
    }
}

module.exports = {
    name: 'guildBanAdd',
    async execute(ban, client, config) {
        await handleBanActivity(ban.guild, config);
    },
};
