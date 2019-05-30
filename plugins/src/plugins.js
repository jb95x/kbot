const fs = module.parent.exports.fs;
const bot = module.parent.exports.bot;
const logme = module.parent.exports.logme;
const cout = module.parent.exports.cout;
const loadPlugin = module.parent.exports.loadPlugin;
const unloadPlugin = module.parent.exports.unloadPlugin;
const disablePlugin = module.parent.exports.disablePlugin;
const reloadPlugins = module.parent.exports.reloadPlugins;
const pluginsSrc = module.parent.exports.pluginsSrc;
const plugins = module.parent.exports.plugins;
const disabledPlugins = module.parent.exports.disabledPlugins;

const clicommands = {
  ["reloadplugins"]: { description: 'Reload all plugins', usage: '' },
  ["loadplugin"]: { description: 'Load / Re-enable Plugin', usage: '<plugin filename>' },
  ["unloadplugin"]: { description: 'Unload Plugin', usage: '<plugin filename>' },
  ["disableplugin"]: { description: 'Disable Plugin', usage: '<plugin filename>' },
  ["listplugins"]: { description: 'List Plugins', usage: '' }
};

const climain = (input) => {
  if (input.startsWith(Object.keys(clicommands)[0])) {
    logme("Reloading all plugins !");
    reloadPlugins();
  }
  else if (input.startsWith(Object.keys(clicommands)[1])) {
    let arg1 = input.split(" ")[1];
    fs.readdir(pluginsSrc, (err, files) => {
      if (err) {
        logme(cout.red.bold("Error reading plugins directory: ") + err);
      } else {
        if (files.includes(arg1)) {
          logme("Trying to load " + arg1 + "...");
          loadPlugin(arg1);
        } else {
          logme(cout.red("The plugin " + arg1 + " doesn't exist"));
        }
      }
    });
  }
  else if (input.startsWith(Object.keys(clicommands)[2])) {
    let arg1 = input.split(" ")[1];
    if (Object.keys(plugins).includes(arg1)) {
      logme("Trying to unload " + arg1 + "...");
      unloadPlugin(arg1);
    } else {
      logme(cout.red("The plugin " + arg1 + " is not loaded"));
    }
  }
  else if (input.startsWith(Object.keys(clicommands)[3])) {
    let arg1 = input.split(" ")[1];
    logme("Adding to the disabled list " + arg1 + "...");
    disablePlugin(arg1);
  }
  else if (input.startsWith(Object.keys(clicommands)[4])) {
    logme(cout.bold('[Enabled Plugins]'));
    Object.keys(plugins).forEach((plugin, index) => {
      logme(index + ": " + plugin);
    });
    logme(cout.bold('[Disabled Plugins]'));
    Object.keys(disabledPlugins).forEach((plugin, index) => {
      logme(index + ": " + plugin);
    });
  }
};

exports.climain = climain;
exports.name = "Plugins Manager";
exports.clicommands = clicommands;
exports.description = "Manage the plugins duh";
