const fs = module.parent.exports.fs;
const path = module.parent.exports.path;
const bot = module.parent.exports.bot;
const prefix = module.parent.exports.prefix;
const logme = module.parent.exports.logme;
const cout = module.parent.exports.cout;
const loadConfig = module.parent.exports.loadConfig;
const updateConfig = module.parent.exports.updateConfig;
const pluginsRes = module.parent.exports.pluginsRes;
const checkRole = module.parent.exports.checkRole;
const checkOwner = module.parent.exports.checkOwner;
var serverData = module.parent.exports.serverData;
var downloader = require('../../node_modules/youtube-dl/lib/downloader');
const ffprobe = require('ffprobe');
const ffprobepath = path.join('.', 'ffprobe');
var mespeak = require('mespeak');

if (!mespeak.isConfigLoaded()) mespeak.loadConfig(require("mespeak/src/mespeak_config.json"));
if (!mespeak.isVoiceLoaded()) mespeak.loadVoice(require("mespeak/voices/en/en-us.json"));

var ytdl;

downloader((err, done) => {
  logme('Updated youtube-dl: ' + done);
  ytdl = require('youtube-dl');
});
// ytdl = require('youtube-dl');


const commands = {
  ["play"]: { visible: true, prefix: true, description: 'Play a Sound or Music', usage: '<optional: sound from list or link>' },
  ["dc"]: { visible: true, prefix: true, description: 'Disconnect Soundboard from Voice Channel', usage: '' },
  ["clear"]: { visible: true, prefix: true, description: 'Clear Soundboard Queue', usage: '' },
  ["sounds"]: { visible: true, prefix: true, description: 'List Soundboard Sounds', usage: '' },
  ["sreload"]: { visible: true, prefix: true, description: 'Reload Soundboard Sounds', usage: '' },
  ["skip"]: { visible: true, prefix: true, description: 'Skip Sound', usage: '' },
  ["vol"]: { visible: true, prefix: true, description: 'Change Soundboard Volume', usage: '<optional: volume(0-100)>' },
  ["queue"]: { visible: true, prefix: true, description: 'Show Soundboard Queue', usage: '' },
  ["pause"]: { visible: true, prefix: true, description: 'Pause Soundboard', usage: '' },
  ["resume"]: { visible: true, prefix: true, description: 'Resume Soundboard', usage: '' },
  ["shuffle"]: { visible: true, prefix: true, description: 'Shuffle Queue', usage: '' },
  ["vreload"]: { visible: true, prefix: true, description: 'Reload Announcer Voice Spec', usage: '' },
  ["tannouncer"]: { visible: true, prefix: true, description: 'Toggle Music Announcer', usage: '' }
};

const audioDir = path.join(pluginsRes, 'soundboard');
var sounds;
loadSounds();
var voiceSpecs;
loadVoiceSpecs();

const defaultConfig = JSON.stringify({ embedColor: 0x00ffff, volume: 0.30, skipTime: 180, maxQueueList: 5, longEmbedTime: 20000, shortEmbedTime: 5000 });
var pluginConfig = loadConfig(defaultConfig, 'soundboard');
var embedColor = pluginConfig.embedColor;
var volume = pluginConfig.volume;
var maxQueueList = pluginConfig.maxQueueList;
var longEmbedTime = pluginConfig.longEmbedTime;
var shortEmbedTime = pluginConfig.shortEmbedTime;
var skipTime = pluginConfig.skipTime;

const isPlaying = (guild) => {
  //Array is more thrustworthy than this ?
  if (serverData[guild.id].queue != undefined && serverData[guild.id].queue.length > 0) {
    serverData[guild.id].isPlaying = true;
  }
  else {
    serverData[guild.id].isPlaying = false;
  }
  return serverData[guild.id].isPlaying;
  logme("[DEBUG] isPlaying in: " + guild.id + " => " + serverData[guild.id].isPlaying);
};

const skipTimer = (guild, time) => {
  setTimeout(() => {
    if (time <= 0) {
      serverData[guild.id].canSkip = true;
    } else {
      serverData[guild.id].skipTimerValue = time - 1000;
      skipTimer(guild, time - 1000);
    }
  }, 1000);
};

function loadSounds() {
  sounds = {};
  fs.readdir(audioDir, function (err, files) {
    if (err) {
      logme(cout.red('Error reading files: ' + err));
    }
    for (let i = 0; i < files.length; i++) {
      sounds[files[i].split('.')[0]] = path.join(audioDir, files[i]);
    }
  });
}

function loadVoiceSpecs() {
  try {
    voiceSpecs = JSON.parse(fs.readFileSync(path.join('.', 'plugins', 'cfg', 'soundboard-voice.json'), 'UTF-8'));
    logme('VoiceSpecs loaded !');
  } catch (error) {
    console.log(error);
    logme('VoiceSpecs not found');
    voiceSpecs = { variant: 'f2', rawdata: true };
  }
}

const cachePath = path.join('.', 'cache');

function clearCache(key, number) {
  try {
    fs.unlinkSync(path.join(cachePath, key + '_' + number));
    logme('Cache ' + key + '_' + number + ' cleared');
  } catch (error) {
    logme('Cache ' + key + '_' + number + ' was empty');
  }
}

function cacheNextSong(key, notIncrement) {
  if(!notIncrement) serverData[key].currentCache = (serverData[key].currentCache + 1) % 2;
  if (serverData[key].queue.length > 1 && serverData[key].queue[1].web && !serverData[key].songCaching) {
    serverData[key].songCaching = true;
    logme('Caching next song: ' + serverData[key].queue[1].name);
    let nextSong = ytdl(serverData[key].queue[1].src, ['-f', 'mp3/worst[ext=webm]/worst'], { maxBuffer: Infinity });
    logme('Current cache container: ' + key + '_' + serverData[key].currentCache);
    let filePath = path.join(cachePath, key + '_' + serverData[key].currentCache);
    nextSong.pipe(fs.createWriteStream(filePath));
    nextSong.once('end', () => {
      if(serverData[key].queue[1]) logme('Finished caching next song: ' + serverData[key].queue[1].name);
      //if(notIncrement) serverData[key].currentCache = (serverData[key].currentCache + 1) % 2;
      serverData[key].songCaching = false;
    });
  }
}

function downloadSong(data, callback) {
  let key = data.guild.id;
  serverData[key].currentCache = (serverData[key].currentCache + 1) % 2;
  serverData[key].songCaching = true;
  logme('Downloading song: ' + data.name);
  let song = ytdl(data.src, ['-f', 'mp3/worst[ext=webm]/worst'], { maxBuffer: Infinity });
  logme('Current cache container: ' + key + '_' + serverData[key].currentCache);
  let filePath = path.join(cachePath, key + '_' + serverData[key].currentCache);
  song.pipe(fs.createWriteStream(filePath));
  song.once('end', () => {
    logme('Finished downloading song: ' + data.name);
    serverData[key].songCaching = false;
    callback(filePath);
  });
}

const unload = () => {
  mespeak = undefined;
  bot.removeListener('voiceStateUpdate', voiceStateUpdateCallback);
  Object.keys(serverData).forEach((key) => {
    serverData[key].queue = [];
    if (serverData[key].playlistFilling) serverData[key].allowQueue = false;
    if (serverData[key].connectionRef != undefined) {
      logme(cout.green("SoundBoard terminated in server: " + serverData[key].name + " !"));
      if (serverData[key].dispatcherRef != undefined) serverData[key].dispatcherRef.resume();
      serverData[key].connectionRef.disconnect();
    }
    delete serverData[key].queue;
    delete serverData[key].playlistQueue;
    delete serverData[key].allowQueue;
    delete serverData[key].playlistFilling;
    delete serverData[key].dispatcherRef;
    delete serverData[key].connectionRef;
    delete serverData[key].voiceRef;
    delete serverData[key].lastChannel;
    delete serverData[key].volume;
    delete serverData[key].isPlaying;
    delete serverData[key].canSkip;
    delete serverData[key].skipTimerValue;
    delete serverData[key].announcer;
    delete serverData[key].songCaching;
    clearCache(key, 0);
    clearCache(key, 1);
    delete serverData[key].currentCache;
  });
  logme(cout.green("Plugin Terminated!"));

};

function getVoice(user, guild) {
  return guild.members.get(user.id).voiceChannel;
}

const voiceStateUpdateCallback = (oldMember, newMember) => {
  let member = oldMember;
  if (!serverData[oldMember.guild.id]) member = newMember;
  if (serverData[member.guild.id]) {
    if (isPlaying(member.guild) && serverData[member.guild.id].queue[0] != undefined && newMember.id == serverData[member.guild.id].queue[0].author.id) {
      if (newMember.voiceChannel != undefined) newMember.voiceChannel.join().catch(() => { });
    }
  }

  // if (playing() && dispatcherRef != undefined && queue[0] != undefined && getVoice(bot.user, queue[0].guild) != undefined) {
  //   if (dispatcherRef.paused && getVoice(bot.user, queue[0].guild).members.size > 1) {
  //     logme("Voice Channel has listenners, resuming...");
  //     dispatcherRef.resume();
  //   }
  //   else if (getVoice(bot.user, queue[0].guild).members.size == 1) {
  //     logme("Voice Channel doesn't have listenners, pausing ...");
  //     dispatcherRef.pause();
  //   }
  // }


};

bot.on('voiceStateUpdate', voiceStateUpdateCallback);

function endEmitManager(guild) {
  if (serverData[guild.id].queue.length != 0) {
    playQueue(guild);
  }
  else {
    clearCache(guild.id, 0);
    clearCache(guild.id, 1);
    logme("Queue finished");
  }
}

function playAnnouncement(connection, data, guild) {
  logme('Started Music Announcement: ' + data.name);
  let robot = mespeak.speak('Next Song is' + data.name + ' requested by ' + data.author.username, voiceSpecs);
  fs.writeFileSync(path.join('.', 'cache', guild.id + '_announcement'), new Buffer(robot));
  serverData[guild.id].dispatcherRef = connection.playFile(path.join('.', 'cache', guild.id + '_announcement'));
  data.announced++;
  serverData[guild.id].dispatcherRef.setVolumeLogarithmic(serverData[guild.id].volume);
  serverData[guild.id].dispatcherRef.once('end', (reason) => {
    data.announced++;
    logme('Ended Music Announcement: ' + data.name);
    clearCache(guild.id, 'announcement');
    endEmitManager(guild);
  });
}

function playQueueCommons(connection, data, guild) {
  serverData[guild.id].dispatcherRef.setVolumeLogarithmic(serverData[guild.id].volume);
  cacheNextSong(guild.id);
  serverData[guild.id].dispatcherRef.once('start', () => {
    logme("Started playing: (" + data.name + ") in : " + connection.channel.name);
    data.channel.send({
      embed: {
        title: ':speaker: ***Now playing:*** ' + data.name,
        color: embedColor
      }
    }).then(thisMsg => {
      thisMsg.delete(shortEmbedTime).catch(() => { });
    });
  });
  serverData[guild.id].dispatcherRef.once('end', (reason) => {
    logme("Done playing: (" + data.name + ") in : " + connection.channel.name);
    serverData[guild.id].queue.shift();
    clearCache(guild.id, (serverData[guild.id].currentCache + 1) % 2);
    endEmitManager(guild);
  });
}

function playQueue(guild) {
  let data = serverData[guild.id].queue[0];
  let voice = getVoice(data.author, data.guild) != undefined ? getVoice(data.author, data.guild) : getVoice(bot.user, data.guild);
  if (voice != undefined) {
    serverData[guild.id].voiceRef = voice;
    voice.join().then(connection => {
      serverData[guild.id].connectionRef = connection;
      if (data.announced == 2 || !serverData[guild.id].announcer) {
        if (!data.web) {
          serverData[guild.id].dispatcherRef = connection.playFile(data.src);
          playQueueCommons(connection, data, guild);
        }
        else {
          let filePath = path.join(cachePath, guild.id + '_' + serverData[guild.id].currentCache);
          if (fs.existsSync(filePath) && !serverData[guild.id].songCaching) {
            logme('Playing from cache ' + guild.id + '_' + serverData[guild.id].currentCache + '...');
            serverData[guild.id].dispatcherRef = connection.playFile(filePath);
            playQueueCommons(connection, data, guild);
          } else {
            clearCache(guild.id, 0);
            clearCache(guild.id, 1);
            logme('Song isn\'t cached');
            downloadSong(data, (fileDownloadPath) => {
              serverData[guild.id].dispatcherRef = connection.playFile(fileDownloadPath);
              playQueueCommons(connection, data, guild);
            });
          }
        }
      } else {
        playAnnouncement(connection, data, guild);
      }
    });
  }
  else {
    logme("No reference for VoiceChannel");

    data.channel.send('<@' + data.author.id + '>', {
      embed: {
        title: ':x: Please enter in a ***Voice Channel ***  and ***Try again***',
        color: embedColor
      }
    }).then(thisMsg => {
      thisMsg.delete(shortEmbedTime).catch(() => { });
    });

    serverData[guild.id].queue.shift();
  }
}

function awake(guild) {
  if(serverData[guild.id].queue.length == 1) {
    playQueue(guild);
  } else if(serverData[guild.id].queue.length == 2)  {
    logme("Mid playback caching in server:" + guild.name);
    cacheNextSong(guild.id, true);
  }
}

function shuffle(a) {
  for (let i = a.length; i; i--) {
    let j = Math.floor(Math.random() * i);
    [a[i - 1], a[j]] = [a[j], a[i - 1]];
  }
}

function formatDuration(duration) {
  let timeArray = duration.split(":");
  let resultArray = [];
  timeArray.forEach((item, index) => {
    resultArray.push(item.length < 2 ? '0' + item : item);
  });
  return resultArray.join(':');
}

function secToTimestamp(data) {
  let timeStamp = '';

  let base = new Date(data * 1000);
  let seconds = base.getSeconds();
  let minutes = base.getMinutes();
  let hours = base.getHours();
  let days = base.getDate() - 1;

  timeStamp += days > 0 ? (days.toString().length < 2 ? '0' + days + ':' : days + ':') : (hours > 0 ? '00:' : '');
  timeStamp += hours > 0 ? (hours.toString().length < 2 ? '0' + hours + ':' : hours + ':') : (minutes > 0 || days > 0 ? '00:' : '');
  timeStamp += minutes > 0 ? (minutes.toString().length < 2 ? '0' + minutes + ':' : minutes + ':') : ((seconds > 0 || hours > 0) || days > 0 ? '00:' : '');
  timeStamp += seconds > 0 ? (seconds.toString().length < 2 ? '0' + seconds : seconds) : '00';

  return timeStamp;
}

function queueSound(input, author, channel, guild) {
  channel.send({
    embed: {
      title: ':white_check_mark: ***Queued:*** ' + input,
      color: embedColor
    }
  }).then(thisMsg => {
    thisMsg.delete(shortEmbedTime).catch(() => { });
  });

  ffprobe(sounds[input], { path: ffprobepath })
    .then((info) => {
      serverData[guild.id].queue.push({ src: sounds[input], name: input, duration: secToTimestamp(info.streams[0].duration), author: author, channel: channel, guild: guild, web: false, announced: 0 });
      logme(author.username + "#" + author.discriminator + " has requested to play the follow on soundboard: (" + input + ") !");
      awake(guild);
    })
    .catch(() => { });
}

function queueRandom(author, channel, guild) {
  let list = Object.keys(sounds);
  let input = list[Math.floor((Math.random() * list.length))];

  channel.send({
    embed: {
      title: ':white_check_mark: ***Queued:*** ' + input,
      color: embedColor
    }
  }).then(thisMsg => {
    thisMsg.delete(shortEmbedTime).catch(() => { });
  });

  ffprobe(sounds[input], { path: ffprobepath })
    .then((info) => {
      serverData[guild.id].queue.push({ src: sounds[input], name: input, duration: secToTimestamp(info.streams[0].duration), author: author, channel: channel, guild: guild, web: false, announced: 0 });
      logme(author.username + "#" + author.discriminator + " has requested to play the follow on soundboard: (" + input + ") !");
      awake(guild);
    })
    .catch(() => { });
}

function queueWeb(info, author, channel, guild) {
  channel.send({
    embed: {
      title: ':white_check_mark: ***Queued:*** ' + info.title,
      color: embedColor
    }
  }).then(thisMsg => {
    thisMsg.delete(shortEmbedTime).catch(() => { });
  });

  serverData[guild.id].queue.push({ src: info.webpage_url, name: info.title, duration: formatDuration(info.duration), author: author, channel: channel, guild: guild, web: true, announced: 0 });
  logme(author.username + "#" + author.discriminator + " has requested to play the follow on soundboard: (" + info.title + ") !");
  awake(guild);
}

function queuePlaylist(guild) {
  if (serverData[guild.id].allowQueue) {
    let data = serverData[guild.id].playlistQueue.shift();
    ytdl.getInfo(data.src.url, ['-x'], { maxBuffer: Infinity }, (error, info) => {
      if (error == null) {
        if (serverData[guild.id].allowQueue){
          serverData[guild.id].queue.push({ src: info.webpage_url, name: info.title, duration: formatDuration(info.duration), author: data.author, channel: data.channel, guild: data.guild, web: true, announced: 0 });
          if(serverData[guild.id].queue.length < 3) awake(guild);
        }
      }
      if (serverData[guild.id].playlistQueue && serverData[guild.id].playlistQueue.length != 0) {
        queuePlaylist(guild);
      }
      else {
        serverData[guild.id].allowQueue = true;
        serverData[guild.id].playlistFilling = false;
        data.channel.send({
          embed: {
            title: ':white_check_mark: ***Queueing successful!***',
            color: embedColor
          }
        }).then(thisMsg => {
          thisMsg.delete(shortEmbedTime).catch(() => { });
        });
      }
    });
  }
  else {
    serverData[guild.id].playlistQueue = [];
    serverData[guild.id].allowQueue = true;
    serverData[guild.id].playlistFilling = false;
    serverData[guild.id].lastChannel.send({
      embed: {
        title: ':white_check_mark: ***Queueing terminated!***',
        color: embedColor
      }
    }).then(thisMsg => {
      thisMsg.delete(shortEmbedTime).catch(() => { });
    });
  }
}


function resolveLink(input, author, channel, guild) {
  ytdl.getInfo(input, ['--flat-playlist'], { maxBuffer: Infinity }, (error, info) => {
    if (error == null) {
      if (!Array.isArray(info)) {
        queueWeb(info, author, channel, guild);
      }
      else {
        fillPlaylistQueue(input, info, author, channel, guild);
      }
    }
    else {
      logme("Error gathering link info from: (" + input + ") !");

      channel.send({
        embed: {
          title: ':x: *** Error queueing song/playlist ***',
          color: embedColor
        }
      }).then(thisMsg => {
        thisMsg.delete(shortEmbedTime).catch(() => { });
      });

    }
  });
}

function fillPlaylistQueue(input, info, author, channel, guild) {
  logme(author.username + "#" + author.discriminator + " has queued a playlist on the soundboard: (" + input + ") !");
  channel.send({
    embed: {
      title: ':arrows_counterclockwise: ***Queueing ' + info.length + ' songs...***',
      color: embedColor
    }
  }).then(thisMsg => {
    thisMsg.delete(shortEmbedTime).catch(() => { });
  });

  info.forEach((item, index) => {
    serverData[guild.id].playlistQueue.push({ src: item, author: author, channel: channel, guild: guild })
  });

  if (!serverData[guild.id].playlistFilling) {
    serverData[guild.id].playlistFilling = true;
    queuePlaylist(guild);
  }
}

function resolveSearch(input, author, channel, guild) {
  ytdl.getInfo(input, ['--default-search', 'ytsearch'], { maxBuffer: Infinity }, (error, info) => {
    if (error == null) {
      queueWeb(info, author, channel, guild);
    }
    else {
      logme("Couldn't found: (" + input + ") !");

      channel.send({
        embed: {
          title: ':x: *** Couldn\'t found: ' + input + ' ***',
          color: embedColor
        }
      }).then(thisMsg => {
        thisMsg.delete(shortEmbedTime).catch(() => { });
      });
    }
  });
}

function resolveWeb(input, author, channel, guild) {
  if (input.startsWith('http')) {
    resolveLink(input, author, channel, guild);
  }
  else {
    resolveSearch(input, author, channel, guild);
  }
}

function soundboardController(input, author, channel, guild) {
  if (input) {
    if (sounds[input] != undefined) {
      queueSound(input, author, channel, guild);
    }
    else {
      resolveWeb(input, author, channel, guild);
    }
  }
  else {
    queueRandom(author, channel, guild);
  }
}

const serverInit = (serverID, message) => {
  if (!serverData[serverID].queue) serverData[serverID].queue = [];
  if (!serverData[serverID].playlistQueue) serverData[serverID].playlistQueue = [];
  if (!serverData[serverID].allowQueue) serverData[serverID].allowQueue = true;
  if (!serverData[serverID].playlistFilling) serverData[serverID].playlistFilling = false;
  if (!serverData[serverID].dispatcherRef) serverData[serverID].dispatcherRef = undefined;
  if (!serverData[serverID].connectionRef) serverData[serverID].connectionRef = undefined;
  if (!serverData[serverID].voiceRef) serverData[serverID].voiceRef = undefined;
  if (!serverData[serverID].lastChannel) serverData[serverID].lastChannel = undefined;
  if (!serverData[serverID].volume) serverData[serverID].volume = volume;
  if (!serverData[serverID].isPlaying) serverData[serverID].isPlaying = false;
  if (!serverData[serverID].canSkip) serverData[serverID].canSkip = true;
  if (!serverData[serverID].skipTimerValue) serverData[serverID].skipTimerValue = 0;
  if (!serverData[serverID].currentCache) serverData[serverID].currentCache = 0;
  if (!serverData[serverID].announcer) serverData[serverID].announcer = false;
  if (!serverData[serverID].songCaching) serverData[serverID].songCaching = false; 
  main_commands(message);
};

const main = (message) => {
  serverInit(message.guild.id, message);
};

const main_commands = (message) => {
  if (message.content.startsWith(prefix + Object.keys(commands)[0]) && serverData[message.guild.id].allowQueue) {
    let input = message.content.substring(message.content.split(" ")[0].length + 1);
    let author = message.author;
    let guild = message.guild;
    let channel = message.channel;
    serverData[message.guild.id].lastChannel = channel;
    soundboardController(input, author, channel, guild);
  }
  else if (message.content.startsWith(prefix + Object.keys(commands)[1])) {
    serverData[message.guild.id].queue = [];
    if (serverData[message.guild.id].playlistFilling) serverData[message.guild.id].allowQueue = false;
    if (serverData[message.guild.id].connectionRef != undefined) {
      logme(message.author.username + "#" + message.author.discriminator + " has requested to stop the soundboard in #" + message.channel.name + "!");
      if (serverData[message.guild.id].dispatcherRef != undefined) serverData[message.guild.id].dispatcherRef.resume();
      serverData[message.guild.id].connectionRef.disconnect();
      clearCache(message.guild.id, 0);
      clearCache(message.guild.id, 1);
    }
  }
  else if (message.content.startsWith(prefix + Object.keys(commands)[2])) {
    serverData[message.guild.id].queue = serverData[message.guild.id].queue.slice(0, 1);
    if (serverData[message.guild.id].playlistFilling) serverData[message.guild.id].allowQueue = false;
    logme(message.author.username + "#" + message.author.discriminator + " has cleared the soundboard in #" + message.channel.name + "!");
  }
  else if (message.content.startsWith(prefix + Object.keys(commands)[3])) {
    let result = '** SoundBoard Sounds**\n\n';
    Object.keys(sounds).forEach(function (item, index) {
      result += '`' + item + '` ';
    });
    message.channel.send(result).then(thisMsg => {
      thisMsg.delete(longEmbedTime).catch(() => { });
    });
    logme(message.author.username + "#" + message.author.discriminator + " has requested the soundboard list in #" + message.channel.name + "!");
  }
  else if (message.content.startsWith(prefix + Object.keys(commands)[4])) {
    loadSounds();
    logme(message.author.username + "#" + message.author.discriminator + " has requested to reload the soundboard list in #" + message.channel.name + "!");
  }
  else if (message.content.startsWith(prefix + Object.keys(commands)[5]) && isPlaying(message.guild)) {
    if (serverData[message.guild.id].dispatcherRef != undefined) {
      if (serverData[message.guild.id].canSkip) {
        serverData[message.guild.id].canSkip = false;
        skipTimer(message.guild, skipTime * 1000);
        logme(message.author.username + "#" + message.author.discriminator + " has requested to skip sound in #" + message.channel.name + "!");
        serverData[message.guild.id].dispatcherRef.end();
      }
      else {
        message.channel.send({
          embed: {
            title: ':x: You can skip in ' + (serverData[message.guild.id].skipTimerValue / 1000) + ' seconds',
            color: embedColor
          }
        }).then(thisMsg => {
          thisMsg.delete(shortEmbedTime).catch(() => { });
        });
      }
    }
  }
  else if (message.content.startsWith(prefix + Object.keys(commands)[6])) {
    let vol = message.content.split(" ")[1];

    if (!isNaN(vol)) {
      vol = vol / 100;
    }

    if (!(vol == undefined || vol > 1)) {
      serverData[message.guild.id].volume = vol;
    }

    if (serverData[message.guild.id].dispatcherRef != undefined) serverData[message.guild.id].dispatcherRef.setVolumeLogarithmic(serverData[message.guild.id].volume);
    message.channel.send({
      embed: {
        title: ':speaker: Soundboard Volume: ' + serverData[message.guild.id].volume * 100 + '%',
        color: embedColor
      }
    }).then(thisMsg => {
      thisMsg.delete(3000).catch(() => { });
    });
    logme(message.author.username + "#" + message.author.discriminator + " has requested to change da volume to: " + serverData[message.guild.id].volume + " in #" + message.channel.name + "!");
  }
  else if (message.content.startsWith(prefix + Object.keys(commands)[7])) {
    let np;
    let timePassed = '';
    if (serverData[message.guild.id].dispatcherRef != undefined) {
      timePassed = secToTimestamp(serverData[message.guild.id].dispatcherRef.time / 1000);
    }

    if (isPlaying(message.guild) && serverData[message.guild.id].queue.length > 0) {
      np = ':speaker: ***Now playing:*** ' + serverData[message.guild.id].queue[0].name + ' :watch: ' + timePassed + '/' + serverData[message.guild.id].queue[0].duration + ' :inbox_tray: ' + serverData[message.guild.id].queue[0].author.username + (serverData[message.guild.id].queue[0].web ? '\n:link: ' + serverData[message.guild.id].queue[0].src : '');
    }
    else {
      np = ':speaker: ***Queue is empty***';
    }

    let fields = [];

    for (let i = 1; i < Math.min(serverData[message.guild.id].queue.length, maxQueueList + 1); i++) {
      fields.push({
        name: i + '. ' + serverData[message.guild.id].queue[i].name + ' :watch: ' + serverData[message.guild.id].queue[i].duration + ' :inbox_tray: ' + serverData[message.guild.id].queue[i].author.username,
        value: (serverData[message.guild.id].queue[i].web ? ':link: ' + serverData[message.guild.id].queue[i].src : '-'),
        inline: false
      });
    }
    logme(message.author.username + "#" + message.author.discriminator + " has requested the soundboard queue in #" + message.channel.name + "!");
    message.channel.send(np, {
      embed: {
        title: 'Queued: ' + (serverData[message.guild.id].queue.length - 1 < 0 ? 0 : serverData[message.guild.id].queue.length - 1) + (serverData[message.guild.id].playlistQueue.length > 0 ? ' :arrows_counterclockwise: ' + (serverData[message.guild.id].playlistQueue.length + 1) + ' left' : ''),
        color: embedColor,
        fields: fields
      }
    }).then(thisMsg => {
      thisMsg.delete(longEmbedTime).catch(() => { });
    });
  }
  else if (message.content.startsWith(prefix + Object.keys(commands)[8])) {
    logme(message.author.username + "#" + message.author.discriminator + " has requested to pause in #" + message.channel.name + "!");
    if (isPlaying(message.guild)) serverData[message.guild.id].dispatcherRef.pause();
  }
  else if (message.content.startsWith(prefix + Object.keys(commands)[9])) {
    logme(message.author.username + "#" + message.author.discriminator + " has requested to resume in #" + message.channel.name + "!");
    if (isPlaying(message.guild)) serverData[message.guild.id].dispatcherRef.resume();
  }
  else if (message.content.startsWith(prefix + Object.keys(commands)[10])) {
    logme(message.author.username + "#" + message.author.discriminator + " has requested to shuffle playlist in #" + message.channel.name + "!");
    let head = serverData[message.guild.id].queue.slice(0, 1);
    let tail = serverData[message.guild.id].queue.slice(1, serverData[message.guild.id].queue.length);
    shuffle(tail);
    serverData[message.guild.id].queue = head.concat(tail);
  }
  else if (message.content.startsWith(prefix + Object.keys(commands)[11])) {
    loadVoiceSpecs();
    logme(message.author.username + "#" + message.author.discriminator + " has requested to reload the voiceSpecs in #" + message.channel.name + "!");
  }
  else if (message.content.startsWith(prefix + Object.keys(commands)[12])) {
    serverData[message.guild.id].announcer = !serverData[message.guild.id].announcer;
    message.channel.send({
      embed: {
        title: 'Music Announcer ' + (serverData[message.guild.id].announcer ? ':white_check_mark:' : ':x:'),
        color: embedColor
      }
    }).then(thisMsg => {
      thisMsg.delete(shortEmbedTime).catch(() => { });
    });
    logme(message.author.username + "#" + message.author.discriminator + " has toggled the music announcer in #" + message.channel.name + "!");
  }



};
exports.main = main;
exports.unload = unload;
exports.name = "SoundBoard";
exports.commands = commands;
exports.description = "SoundBoard Module to joke with people";
