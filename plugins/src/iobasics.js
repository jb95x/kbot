const bot = module.parent.exports.bot;
const restartBot = module.parent.exports.restartBot;
const logme = module.parent.exports.logme;

const clicommands = {
  ["exit"] : {description: 'Exit Bot', usage: ''},
  ["restart"] : {description: 'Restart Bot', usage: ''},
  ["cls"] : {description: 'Clear Screen', usage: ''}
};

const climain = (input) =>
{
  if (input.startsWith(Object.keys(clicommands)[0]))
  {
    logme("ByeBye! My friend");
    bot.destroy().then(() => {
      process.exit(0)
    }).catch((reason) => {
      console.log("Error on destroy:" + reason);
      process.exit(1);
    });
  }
  else if (input.startsWith(Object.keys(clicommands)[1]))
  {
    restartBot();
  }
  else if (input.startsWith(Object.keys(clicommands)[2]))
  {
    process.stdout.write('\033[2J\033[1;1H');
  }
};

exports.climain = climain;
exports.name = "IO Basics";
exports.clicommands = clicommands;
exports.description = "Basic IO Commands for the Bot";
