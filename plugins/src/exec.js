const bot = module.parent.exports.bot;
const prefix = module.parent.exports.prefix;
const logme = module.parent.exports.logme;
const logs = module.parent.exports.logs;
const plugins = module.parent.exports.plugins;
const globalEvents = module.parent.exports.globalEvents;
const serverData = module.parent.exports.serverData;
const disabledPlugins = module.parent.exports.disabledPlugins;

const clicommands = {
  ["exec"]: { description: 'Executes code on-demand', usage: '<code>' },
};

const climain = (input) => {
  if (input.startsWith(Object.keys(clicommands)[0])) {
    let arg1 = input.substring(input.split(" ")[0].length + 1);
    if (arg1 != undefined) {
      try {
        eval(arg1);
      } catch (error) {
        console.log(error);
      }
    }
  }
}

exports.climain = climain;
exports.name = "Bot code executor";
exports.clicommands = clicommands;
exports.description = "Bot on-demand code execution";