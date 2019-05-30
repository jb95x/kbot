const fs = require('fs');
const path = require('path');
const cout = require('chalk');
const stripAnsi = require('strip-ansi');
const cron = require('node-cron');
const readline = require('readline');
const pluginsSrc = path.join(__dirname, 'plugins', 'src');
const pluginsRes = path.join(__dirname, 'plugins', 'res');
const pluginsCfg = path.join(__dirname, 'plugins', 'cfg');
const allowedservers = ['133221718968762368', '323233864183054347', '434048012650807296'];
const owner = '130858336550780928';
const Discord = require('discord.js');
const bot = new Discord.Client();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  completer: completer
});

const EventEmitter = require('events');
class KEvents extends EventEmitter {};
const globalEvents = new KEvents();

var maxLogs = 200;
var config = {};
var plugins = {};
var logs = [];
var allowedchannels = [];
var serverData = {};
var disabledPlugins = {};

function clear(){
  process.stdout.write('\033[2J\033[1;1H');
}

function toTwoDigits(singleDigit){
  return singleDigit < 10 ? '0'+singleDigit : singleDigit;
}

const logme = (message) => {
  let id = logs.length > 0 ? logs.slice(-1)[0].id + 1 : 0;
  let date = new Date();
  let dateString = toTwoDigits(date.getHours())
                  + ":" + toTwoDigits(date.getMinutes())
                  + ":" + toTwoDigits(date.getSeconds())
                  + " - " + toTwoDigits(date.getDate())
                  + "/" + toTwoDigits((date.getMonth()+1))
                  + "/" + date.getFullYear();
  let logString = cout.cyan("[" + dateString + "] ") + cout.white(message);
  console.log(logString);
  let logObj = {id: id, text: logString};
  logs.push(logObj);
  globalEvents.emit('newlog', logObj);
  if(logs.length > maxLogs)
  {
    logs.shift();
  }
}

const restartBot = () => {
logme(cout.green.bold("Restarting Bot..."));
  bot.destroy().then(() => {
    botStart();
  }).catch((reason) => {
    logme(cout.red.bold("Error destroying session: ") + reason);
    process.exit(1);
  });
};

const loadPlugin = (plugin) => {
  try {
    if(plugins[plugin] != undefined)
    {
      unloadPlugin(plugin);
      loadPlugin(plugin);
    } else {
      plugins[plugin] = require(path.join(pluginsSrc, plugin));
      if(Object.keys(disabledPlugins).includes(plugin)){
        delete disabledPlugins[plugin];
        updateConfig(JSON.stringify(disabledPlugins), 'disabledPlugins');
      }
      logme(cout.green("[LOADED] ") + plugin);
      globalEvents.emit('pluginloaded', plugin);
    }
  }
  catch (e) {
    logme(cout.red.bold("This plugin has errors: ") + plugin);
    console.log(e);
  }
};

const unloadPlugin = (plugin) => {
  try {
    if(plugins[plugin].unload != undefined) plugins[plugin].unload();
    delete plugins[plugin];
    delete require.cache[require.resolve(path.join(pluginsSrc, plugin))];
    logme(cout.yellow("[UNLOADED] ") + plugin);
    globalEvents.emit('pluginunloaded', plugin);
  }
  catch (e) {
    logme(cout.red.bold("Got an error being unloaded: ") + plugin);
    console.log(e);
  }
};

const disablePlugin = (plugin) => {
  disabledPlugins[plugin] = null;
  updateConfig(JSON.stringify(disabledPlugins), 'disabledPlugins');
  logme(cout.yellow("[DISABLED] ") + plugin);
  if (Object.keys(plugins).includes(plugin)) {
    logme("Trying to unload " + plugin + "...");
    unloadPlugin(plugin);
  } else {
    logme(cout.red("The plugin " + plugin + " is not loaded"));
  }
}

const reloadPlugins = () => {
  fs.readdir(pluginsSrc, (err, files) => {
    if (err){
      logme(cout.red.bold("Error reading plugins directory: ") + err);
    } else {
      Object.keys(plugins).forEach((plugin) => {
        unloadPlugin(plugin);
      });
      files.forEach((plugin) => {
        if(!Object.keys(disabledPlugins).includes(plugin)) loadPlugin(plugin);
      });
    }
  });
};

const loadConfig = (defaultConfig, configName, silent) => {
  let filename = path.join(pluginsCfg, configName + '.cfg');
  let pluginConfig;
  try{
    pluginConfig = fs.readFileSync(filename, 'UTF-8');
    if(!silent) logme(cout.green.bold("Loaded configuration file: ") + configName);
    return JSON.parse(pluginConfig);
  }
  catch(e) {
    logme(cout.red.bold("Can't find configuration file: ") + configName);
    logme('Creating file with defaults ...');
    fs.writeFileSync(filename, defaultConfig);
    logme(cout.green.bold("Default configuration loaded"));
    return JSON.parse(defaultConfig);
  }
};

const updateConfig = (newConfig, configName, silent) => {
  let filename = path.join(pluginsCfg, configName + '.cfg');
  let pluginConfig;
  try{
    pluginConfig = fs.readFileSync(filename, 'UTF-8');
    fs.writeFileSync(filename, newConfig);
    if(!silent) logme(cout.green.bold("Updated configuration file: ") + configName);
    return true;
  }
  catch(e) {
    logme(cout.red.bold("Can't find configuration file: ") + configName);
    return false;
  }
};

function setup(){
  let newConfig = {};
  rl.question("Token: ", (answer) =>{
    newConfig["token"] = answer;
    clear();
    rl.question("Prefix: ", (answer2) =>{
      newConfig["prefix"] = answer2;
      clear();
      fs.writeFileSync(path.join(__dirname, 'config.cfg'), JSON.stringify(newConfig));
      config = newConfig;
      botStart();
    });
  });
}

const botStart = () => {
  disabledPlugins = loadConfig('{}', 'disabledPlugins');
  exports.disabledPlugins = disabledPlugins;
  reloadPlugins();
  bot.login(config.token).catch((reason) => {
    logme(cout.red.bold("Error on login: ") + reason);
    process.exit(1);
  });
}

bot.on('ready', () => {
  console.log("\t\t\t" + cout.magenta.bold("Bot: ") + bot.user.username + "#" + bot.user.discriminator);
  allowedservers.forEach((server) => {
    allowedchannels = allowedchannels.concat(bot.guilds.get(server).channels.keyArray());
  });
  logme(cout.magenta.bold("Servers: ") + bot.guilds.size + cout.magenta.bold(" Users: ") + (bot.users.size-1));  // -1 porque o Clyde n conta né
  logme(cout.magenta.bold("Modules loaded: ") + Object.keys(plugins).length);
  logme(cout.green.bold("Initialization Completed!"));
});

const serverInit = (guild) => {
  if (serverData[guild.id] == undefined)
  {
    serverData[guild.id] = {};
    serverData[guild.id].name = guild.name;
  }
};

bot.on('message', message => {
  if(message.author.id != bot.user.id && allowedchannels.includes(message.channel.id))
  {
    serverInit(message.guild);
    if(message.content.startsWith(config.prefix))
    {
        message.delete(500).catch(() => {});
    }
    Object.keys(plugins).forEach((plugin) => {
      if(plugins[plugin] != undefined && plugins[plugin].main != undefined)
      {
        try {
          plugins[plugin].main(message);
        }
        catch(e){
          logme(cout.red.bold("Got an error executing command: ") + message.content + cout.red.bold(" Plugin: ") + plugin);
          console.log(e);
        }
      }
    });
  }
});

const checkRole  = (roleName, user, guild) => {
  let role = guild.roles.find('name', roleName);
  return role != undefined ? role.members.has(user.id) : false;
};

const checkOwner = (user) => {
  return user.id == owner;
}

const cliExec = (input) => {
  Object.keys(plugins).forEach(function(plugin){
    if(plugins[plugin] != undefined && plugins[plugin].climain != undefined)
    {
      try{
        plugins[plugin].climain(input);
      }
      catch(e){
        logme(cout.red.bold("Got an error executing cli command: ") + input + cout.red.bold(" Plugin: ") + plugin);
        console.log(e);
      }
    }
  });
};

function completer(line){
  let completions = [];
  Object.keys(plugins).forEach((plugin) => {
    if(plugins[plugin] != undefined && plugins[plugin].clicommands != undefined)
    {
      completions = completions.concat(Object.keys(plugins[plugin].clicommands));
    }
  });
  const hits = completions.filter((c) => { return c.indexOf(line) === 0 });
  return [hits.length ? hits : completions, line];
}

rl.on('line', (input) => {
  cliExec(input);
});

fs.readFile(path.join(__dirname, 'config.cfg'), 'UTF-8', (err, data) => {
  if (err){
    clear();
    logme(cout.red.bold("Can't find configuration file"));
    setup();
  } else {
    clear();
    config = JSON.parse(data);
    exports.prefix = config.prefix;
    require(path.join(__dirname, 'splash.js'));
    botStart();
    cron.schedule('0 3,15 * * *', restartBot);
  }
});

exports.bot = bot;
exports.fs = fs;
exports.path = path;
exports.pluginsSrc = pluginsSrc;
exports.pluginsRes = pluginsRes;
exports.pluginsCfg = pluginsCfg;
exports.cout = cout;
exports.logme = logme;
exports.logs = logs;
exports.loadPlugin = loadPlugin;
exports.unloadPlugin = unloadPlugin;
exports.disablePlugin = disablePlugin;
exports.reloadPlugins = reloadPlugins;
exports.loadConfig = loadConfig;
exports.updateConfig = updateConfig;
exports.restartBot = restartBot;
exports.checkRole = checkRole;
exports.checkOwner = checkOwner;
exports.serverData = serverData;
exports.plugins = plugins;
exports.cliExec = cliExec;
exports.globalEvents = globalEvents;
