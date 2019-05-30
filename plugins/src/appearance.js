const bot = module.parent.exports.bot;
const prefix = module.parent.exports.prefix;
const logme = module.parent.exports.logme;
const checkRole = module.parent.exports.checkRole;
const checkOwner = module.parent.exports.checkOwner;
const loadConfig = module.parent.exports.loadConfig;
const updateConfig = module.parent.exports.updateConfig;
const globalEvents = module.parent.exports.globalEvents;

const validStatus = ["online", "invisible", "dnd", "idle"];
const validActivityTypes = ["PLAYING", "LISTENING", "WATCHING"];

const commands = {
  ["avatar"]: { visible: true, prefix: true, description: 'Change Avatar', usage: '<image or image link>' },
  ["activity"]: { visible: true, prefix: true, description: 'Change Activity', usage: '<Activity type> <Activity>' },
  ["name"]: { visible: true, prefix: true, description: 'Change Name', usage: '<name>' },
  ["status"]: { visible: true, prefix: true, description: 'Change Status', usage: '[\'online\', \'idle\', \'invisible\', \'dnd\']' }
};

const clicommands = {
  ["avatar"]: { description: 'Change Avatar', usage: '<image link>' },
  ["activity"]: { visible: true, prefix: true, description: 'Change Activity', usage: '<Activity type> <Activity>' },
  ["name"]: { description: 'Change Name', usage: '<name>' },
  ["status"]: { description: 'Change Status', usage: '[\'online\', \'idle\', \'invisible\', \'dnd\']' }
};

const defaultConfig = JSON.stringify({ status: 'dnd', game: prefix + 'help' });
var pluginConfig = loadConfig(defaultConfig, 'appearance');

const applySavedState = () => {
  setGame(pluginConfig.game);
  setStatus(pluginConfig.status);
  logme('Status: ' + pluginConfig.status + ' | Game: ' + pluginConfig.game);
}

bot.on('ready', applySavedState);

function setAvatar(url) {
  bot.user.setAvatar(url);
  globalEvents.emit('newavatar', url);
}

function setUsername(name) {
  bot.user.setUsername(name);
  globalEvents.emit('newname', name);
}

function setGame(game) {
  let atype = game.split(" ")[0].toUpperCase();
  let atext = game.substring(game.split(" ")[0].length + 1);
  if(validActivityTypes.includes(atype) && atext != undefined){
    bot.user.setActivity(atext, { type: atype});
    pluginConfig['game'] = game;
    updateConfig(JSON.stringify(pluginConfig), 'appearance');
    globalEvents.emit('newgame', game);
  }
}

function setStatus(status) {
  bot.user.setStatus(status);
  pluginConfig['status'] = status;
  updateConfig(JSON.stringify(pluginConfig), 'appearance');
  globalEvents.emit('newstatus', status);
}

const main = (message) => {
  if (message.content.startsWith(prefix + Object.keys(commands)[0]) && checkOwner(message.author)) {
    let url;

    if (message.attachments.size > 0) {
      url = message.attachments.first().url;
    }
    else if (message.content.split(" ")[1] != undefined && message.content.split(" ")[1].startsWith("http")) {
      url = message.content.split(" ")[1];
    }

    if (url != undefined) {
      logme(message.author.username + "#" + message.author.discriminator + " as changed the avatar to (" + url + ") in #" + message.channel.name + "!");
      setAvatar(url);
    }

  }
  else if (message.content.startsWith(prefix + Object.keys(commands)[1]) && checkOwner(message.author)) {
    let input = message.content.substring(message.content.split(" ")[0].length + 1);
    logme(message.author.username + "#" + message.author.discriminator + " as set the activity to: (" + input + ") in #" + message.channel.name + "!");
    if (input != undefined) {
      setGame(input);
    }
  }
  else if (message.content.startsWith(prefix + Object.keys(commands)[2]) && checkOwner(message.author)) {
    let input = message.content.substring(message.content.split(" ")[0].length + 1);
    logme(message.author.username + "#" + message.author.discriminator + " as set the name to: (" + input + ") in #" + message.channel.name + "!");
    if (input != undefined) {
      setUsername(input);
    }
  }
  else if (message.content.startsWith(prefix + Object.keys(commands)[3]) && checkOwner(message.author)) {
    let input = message.content.substring(message.content.split(" ")[0].length + 1);
    if (input != undefined && validStatus.includes(input)) {
      setStatus(input);
      logme(message.author.username + "#" + message.author.discriminator + " as set the status to: (" + input + ") in #" + message.channel.name + "!");
    }
  }
};

const climain = (input) => {
  if (input.startsWith(Object.keys(clicommands)[0])) {
    let url;

    if (input.split(" ")[1] != undefined && input.split(" ")[1].startsWith("http")) {
      url = input.split(" ")[1];
    }

    if (url != undefined) {
      logme("The avatar was changed to (" + url + ") !");
      setAvatar(url);
    }
  }
  else if (input.startsWith(Object.keys(clicommands)[1])) {
    input = input.substring(input.split(" ")[0].length + 1);
    logme("The activity was set to: (" + input + ") !");
    if (input != undefined) {
      setGame(input);
    }
  }
  else if (input.startsWith(Object.keys(clicommands)[2])) {
    input = input.substring(input.split(" ")[0].length + 1);
    logme("The name was set to: (" + input + ") !");
    if (input != undefined) {
      setUsername(input);
    }
  }
  else if (input.startsWith(Object.keys(clicommands)[3])) {
    input = input.substring(input.split(" ")[0].length + 1);
    if (input != undefined && validStatus.includes(input)) {
      setStatus(input);
      logme("The status was set to: (" + input + ") !");
    }
  }
};

const unload = () => {
  bot.removeListener('ready', applySavedState);
}

exports.unload = unload;
exports.main = main;
exports.climain = climain;
exports.name = "Appearance Manager";
exports.commands = commands;
exports.clicommands = clicommands;
exports.description = "Costumise the Bot Appearance";
