const bot = module.parent.exports.bot;
const fs = module.parent.exports.fs;
const path = module.parent.exports.path;
const prefix = module.parent.exports.prefix;
const logme = module.parent.exports.logme;
const cout = module.parent.exports.cout;
const logs = module.parent.exports.logs;
const loadConfig = module.parent.exports.loadConfig;
const updateConfig = module.parent.exports.updateConfig;
const cliExec = module.parent.exports.cliExec;
const plugins = module.parent.exports.plugins;
const pluginsRes = module.parent.exports.pluginsRes;
const globalEvents = module.parent.exports.globalEvents;
var serverData = module.parent.exports.serverData;

const rsa = require('node-rsa');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const namespace = io.of('/Konsole');

const clicommands = {
  ["webpass"]: { description: 'Web interface password', usage: '<password>' },
  ["webport"]: { description: 'Web interface port', usage: '<port>' },
  ["webtimeout"]: { description: 'Web interface timeout', usage: '<timeout in seconds>' }
};

const contentDir = path.join(pluginsRes, 'web-control');

const defaultConfig = JSON.stringify({ secret: 'password', port: '1337', timeout: '10' });
var pluginConfig = loadConfig(defaultConfig, 'web-control');
var timeout = pluginConfig.timeout;
var secret = pluginConfig.secret;
var port = pluginConfig.port;

function setVars() {
  timeout = pluginConfig.timeout;
  secret = pluginConfig.secret;
  port = pluginConfig.port;
}

var key = new rsa();

if(!pluginConfig.keys){
  key.setOptions({ encryptionScheme: 'pkcs1' });
  key.generateKeyPair();
  pluginConfig.keys = {private: key.exportKey('pkcs1-private-pem')};
  if (updateConfig(JSON.stringify(pluginConfig), 'web-control')) {
    logme("Web Console Keys generated!");
  }
} else {
  key.setOptions({ encryptionScheme: 'pkcs1' });
  key.importKey(pluginConfig.keys.private);
}

var publicKey = key.exportKey('pkcs8-public-pem');

app.use('/', express.static(contentDir));

function coldBootConnection(socket) {
  socket.emit('fullUpdate', apiJSON());
}

const updateLogs = (logObj) => {
  namespace.emit('newlog', logObj);
}

globalEvents.on('newlog', updateLogs);

const updateName = (nameStr) => {
  namespace.emit('newname', nameStr);
}

globalEvents.on('newname', updateName);

const updateStatus = (statusStr) => {
  namespace.emit('newstatus', statusStr);
}

globalEvents.on('newstatus', updateStatus);

const updateGame = (gameStr) => {
  namespace.emit('newgame', gameStr);
}

globalEvents.on('newgame', updateGame);

const updateAvatar = (avatarUrl) => {
  namespace.emit('newavatar', avatarUrl);
}

globalEvents.on('newavatar', updateAvatar);

const updateCompletions = () => {
  namespace.emit('updatecompletions', getCompletions());
}

globalEvents.on('pluginloaded', updateCompletions);
globalEvents.on('pluginunloaded', updateCompletions);

function getCompletions () {
  let completions = {};
  Object.keys(plugins).forEach((plugin) => {
    if (plugins[plugin] != undefined && plugins[plugin].clicommands != undefined) {
      Object.keys(plugins[plugin].clicommands).forEach((command) => {
        completions[command] = null;
      });
    }
  });
  return completions;
}

function onConnection(socket) {

  coldBootConnection(socket);

  socket.on('exec', (string) => {
    try {
      let data = JSON.parse(key.decrypt(string));
      if (data.timestamp > (Date.now() - timeout * 1000)) {
        if (data.password == secret && data.command) {
          cliExec(data.command);
          socket.emit('notification', { text: 'Received!' });
        } else {
          socket.emit('notification', { text: 'Incorrect Password!' });
        }
      } else {
        socket.emit('notification', { text: 'Repetition Attack Detected!' });
        logme(cout.red('Someone is bruteforcing the Web Console! IP: ' + socket.request.connection.remoteAddress.split(':')[3]));
      }
    }
    catch (e) {
      socket.emit('notification', { text: 'Malformed request!' });
    }
  });

  socket.on('fullUpdate', ()=>{
    socket.emit('fullUpdate', apiJSON());
  });
  
  socket.on('musicupdate', () => {
    let result = {};
    Object.keys(serverData).forEach((data) => {
      let name = serverData[data].name;
      result[name] = {};
      if (serverData[data].dispatcherRef) result[name].timepassed = (serverData[data].dispatcherRef.time / 1000);
      if (serverData[data].queue) result[name].queue = serverData[data].queue.map((x) => {
        return { src: (x.web ? x.src : ''), name: x.name, duration: x.duration, author: x.author.username, web: x.web };
      });
    });
    socket.emit('musicupdate', result);
  });

}

namespace.on('connection', onConnection);

var server = http.listen(port, function () {
  logme('Web Console started on port ' + port + ' !');
});

const unload = () => {
  globalEvents.removeListener('newlog', updateLogs);
  globalEvents.removeListener('newname', updateName);
  globalEvents.removeListener('newavatar', updateAvatar);
  globalEvents.removeListener('newgame', updateGame);
  globalEvents.removeListener('newstatus', updateStatus);
  globalEvents.removeListener('pluginloaded', updateCompletions);
  globalEvents.removeListener('pluginunloaded', updateCompletions);
  server.close();
};

function apiJSON() {
  let result = {};
  result.logs = logs;
  result.completions = {};
  Object.keys(plugins).forEach((plugin) => {
    if (plugins[plugin] != undefined && plugins[plugin].clicommands != undefined) {
      Object.keys(plugins[plugin].clicommands).forEach((command) => {
        result.completions[command] = null;
      });
    }
  });
  result.serverData = {};
  Object.keys(serverData).forEach((data) => {
    let name = serverData[data].name;
    result.serverData[name] = {};
    if (serverData[data].dispatcherRef) result.serverData[name].timepassed = (serverData[data].dispatcherRef.time / 1000);
    if (serverData[data].queue) result.serverData[name].queue = serverData[data].queue.map((x) => {
      return { src: (x.web ? x.src : ''), name: x.name, duration: x.duration, author: x.author.username, web: x.web };
    });
  });
  try {
    result.publicKey = publicKey;
    result.name = bot.user.username;
    result.avatar = bot.user.displayAvatarURL;
    result.game = bot.user.presence.game.name;
    result.status = bot.user.presence.status;
  }
  catch (e) {
    setTimeout(() => {
      apiJSON();
    }, 1000);
  }
  result = JSON.stringify(result);
  return result;
}

const climain = (input) => {
  if (input.startsWith(Object.keys(clicommands)[0])) {
    let arg1 = input.substring(input.split(" ")[0].length + 1);
    if (arg1 != undefined) {
      pluginConfig['secret'] = arg1;
      if (updateConfig(JSON.stringify(pluginConfig), 'web-control')) {
        pluginConfig = loadConfig(defaultConfig, 'web-control');
        logme("Web console password changed successfully!");
        setVars();
      }
    }
  }
  else if (input.startsWith(Object.keys(clicommands)[1])) {
    let arg1 = parseInt(input.substring(input.split(" ")[0].length + 1));
    if (!isNaN(arg1)) {
      pluginConfig['port'] = arg1;
      if (updateConfig(JSON.stringify(pluginConfig), 'web-control')) {
        pluginConfig = loadConfig(defaultConfig, 'web-control');
        logme("Web console port changed successfully!");
        setVars();
      }
    }
  }
  else if (input.startsWith(Object.keys(clicommands)[2])) {
    let arg1 = parseInt(input.substring(input.split(" ")[0].length + 1));
    if (!isNaN(arg1)) {
      pluginConfig['timeout'] = arg1;
      if (updateConfig(JSON.stringify(pluginConfig), 'web-control')) {
        pluginConfig = loadConfig(defaultConfig, 'web-control');
        logme("Web console timeout changed successfully!");
        setVars();
      }
    }
  }
};

exports.unload = unload;
exports.climain = climain;
exports.name = "Web Controller";
exports.clicommands = clicommands;
exports.description = "Web console to control bot";
