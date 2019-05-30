const bot = module.parent.exports.bot;
const prefix = module.parent.exports.prefix;
const logme = module.parent.exports.logme;
const cout = module.parent.exports.cout;
const fs = module.parent.exports.fs;
const path = module.parent.exports.path;
const http = require('https');

const cachePath = path.join('.', 'cache');

const commands = {
  ["9gag"]: { visible: true, prefix: true, description: 'Get a random post from 9gag', usage: '' }
};

function processMessage(message) {
  setTimeout(() => {
    message.embeds.forEach((embed) => {
      http.get(embed.url, function (resp) {

        let body = '';

        resp.on('data', (d) => {
          body += d;
        });

        resp.on('end', () => {
          processRequest(body, message, embed);
        });


      }).once("error", function (e) {
        logme(cout.bold.red("Got an error getting 9gag: ") + e.message);
      });
    });
  }, 2000);
}

function processRequest(body, message, embed) {
  try {
    let url = "https://img-9gag-fun.9cache.com/photo/" + embed.url.split("/")[4] + "_460svwm.webm";
    if (body.includes(embed.url.split("/")[4] + "_460svwm.webm")) {
      message.channel.send(url + "\n\n***Sent by: ***" + message.author.tag + "\n***Original link: *** <" + embed.url + "> \n***Title: ***" + embed.title + "\n").then(() => {
        logme(message.author.username + "#" + message.author.discriminator + " 9gag post (" + embed.url + ") was embeded in #" + message.channel.name + "!");
        if (message.embeds.length < 2) message.delete().catch(() => { });
      }).catch(() => { });
    }
  } catch (error) {
    console.log(error);
  }
}

const main = (message) => {
  if (message.content.startsWith(prefix + Object.keys(commands)[0])) {
    let options = {
      host: '9gag.com',
      path: '/random'
    };

    http.get(options, function (resp) {
      let post = resp.headers['location'];
      message.channel.send(post).then((result) => {
        processMessage(result);
      });
      logme(message.author.username + "#" + message.author.discriminator + " requested a random post from 9gag (" + post + ") in #" + message.channel.name + "!");
    }).once("error", function (e) {
      logme(cout.bold.red("Got an error getting 9gag: ") + e.message);
    });
  }
  else if (message.content.includes("9gag.com")) {
    processMessage(message);
  }
};

exports.main = main;
exports.name = "9gag Module";
exports.commands = commands;
exports.description = "9gag Commands ";
