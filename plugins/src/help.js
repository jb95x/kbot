const bot = module.parent.exports.bot;
const prefix = module.parent.exports.prefix;
const logme = module.parent.exports.logme;
const cout = module.parent.exports.cout;
const loadConfig = module.parent.exports.loadConfig;
const updateConfig = module.parent.exports.updateConfig;
const plugins = module.parent.exports.plugins;

const commands = {
    ["help"]: { visible: true, prefix: true, description: 'See commands', usage: '' },
};

const clicommands = {
    ["help"]: { description: 'I\'m here to help', usage: '' }
};

const defaultConfig = JSON.stringify({ embedColor: 0x00ffff });
var pluginConfig = loadConfig(defaultConfig, 'help');
var embedColor = pluginConfig.embedColor;

var server = {};

const serverInit = (serverID) => {
  if (server[serverID] == undefined)
  {
    server[serverID] = {};
    server[serverID].lastMsg = undefined;
  }
};

const main = (message) => {
    serverInit(message.guild.id);
    let input = message.content.toLowerCase();
    if (input.startsWith(prefix + Object.keys(commands)[0])) {
        logme(message.author.username + "#" + message.author.discriminator + " requested the commands list in #" + message.channel.name + "!");
        let fields = [];
        let nCommands = 0;
        Object.keys(plugins).forEach(function (item) {
            let fieldText = '';
            let commands = plugins[item].commands;
            if (commands != undefined) {
                Object.keys(commands).forEach(function (command) {
                    if (commands[command].visible) {
                            nCommands++;
                            fieldText += (commands[command].prefix ? prefix : '') + command + ' ' + commands[command].usage + ' (' + commands[command].description + ')\n';
                    }
                });

                fields.push({
                    name: plugins[item].name + " (" + plugins[item].description + ")",
                    value: fieldText,
                    inline: false
                });
            }
        });
        message.channel.send( '***Plugins: ' + fields.length + ' / Commands: ' + nCommands + ' ***',
        {embed:
          {
            fields: fields,
            thumbnail: {url: bot.user.avatarURL},
            footer: {text: 'Made/Run/Designed by Neo#5099'},
            color: embedColor
          }
        }).then(thisMsg => {
            if (server[message.guild.id].lastMsg != undefined) server[message.guild.id].lastMsg.delete().catch(() => { });
            server[message.guild.id].lastMsg = thisMsg;
        });
    }
};

const climain = (input) => {
    if (input.startsWith(Object.keys(clicommands)[0])) {
        Object.keys(plugins).forEach((plugin_name) => {
            let plugin = plugins[plugin_name];
            if (plugin.clicommands != undefined) {
                logme(cout.bold('[' + plugin.name + ': ' + plugin.description + ']'));
                Object.keys(plugin.clicommands).forEach((command_name) => {
                    let command = plugin.clicommands[command_name];
                    logme('... ' + command_name + ' ' + command.usage + ' => ' + command.description);
                });
            }
        });
    }
}

exports.main = main;
exports.climain = climain;
exports.name = "Help Module";
exports.commands = commands;
exports.clicommands = clicommands;
exports.description = "What can I help you ?";
