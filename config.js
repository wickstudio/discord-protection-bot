module.exports = {
  "DISCORD_TOKEN": "",
  "antispam": {
    "active": false,
    "messageCount": 3000000,
    "time": 3000,
    "deleteMessages": false,
    "timeout": false,
    "timeoutDuration": null
  },
  "antilinks": {
    "active": true,
    "deleteMessages": true,
    "actions": {
      "timeout": true,
      "timeoutDuration": 60000,
      "kick": false,
      "ban": false
    }
  },
  "channelMonitoring": {
    "active": true,
    "maxChannelChanges": 2,
    "timeFrame": 60000,
    "action": "timeout",
    "timeoutDuration": 60000
  },
  "roleMonitoring": {
    "active": true,
    "maxRoleChanges": 2,
    "timeFrame": 60000,
    "action": "timeout",
    "timeoutDuration": 60000
  },
  "kickMonitoring": {
    "active": true,
    "maxKicks": 1,
    "timeFrame": 60000,
    "action": "kick",
    "timeoutDuration": 60000
  },
  "banMonitoring": {
    "active": true,
    "maxBans": 1,
    "timeFrame": 60000,
    "action": "kick",
    "timeoutDuration": 60000
  },
  "botMonitoring": {
    "active": true,
    "action": "timeout",
    "botAction": "kick",
    "timeoutDuration": 60000
  },
  "roleEditMonitoring": {
    "active": true,
    "maxEdits": 1,
    "timeFrame": 60000,
    "action": "timeout",
    "timeoutDuration": 60000
  },
  "serverEditMonitoring": {
    "active": false,
    "maxEdits": 1,
    "timeFrame": 60000,
    "action": "kick",
    "timeoutDuration": 60000
  },
  "allowedGuildId": "",
  "logChannelId": "",
  "whitelistRoles": [
    "roleid_1",
    "roleid_2",
    "roleid_3"
  ]
};