const bot = module.parent.exports.bot;
const prefix = module.parent.exports.prefix;
const logme = module.parent.exports.logme;
const cout = module.parent.exports.cout;

const commands = {
  ["del"] : {visible: true, prefix: true, description: 'Delete Messages', usage: '<optional: number of messages>'}
};

const main = (message) =>
{
  let input = message.content.toLowerCase();
  if (input.startsWith(prefix+Object.keys(commands)[0]))
  {
    let size = parseInt(input.split(" ")[1]);
    size = isNaN(size) ? 1 : Math.min(Math.max(size,1), 100);
    logme(message.author.username + "#" + message.author.discriminator + " requested " + size + " messages to be deleted from #" + message.channel.name + "!");
    message.channel.fetchMessages({
      limit: size,
      before: message.id
    }).then(messages => {
      if(messages.size > 0)
      {
        logme("Deleting " + messages.size + " messages from #" + message.channel.name + "!");
        if(messages.size > 1)
        {
          message.channel.bulkDelete(messages);
        }
        else
        {
          messages.first().delete(0);
        }
      }
      else
      {
        logme("No messages to delete from #" + message.channel.name + "!");
      }
    }).catch(console.error);
  }
};

exports.main = main;
exports.name = "Delete Module";
exports.commands = commands;
exports.description = "Delete, Delete, Delete !";
