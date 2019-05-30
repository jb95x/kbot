const cout = require('chalk');
var data = [];
data.push(' ┌─┐  ┌─┐ ┌──────┐              ┌─┐     ');
data.push(' │██ ┌┘██ │███████┐             │██     ');
data.push(' │██┌┘██  │██   │██  ┌─────┐  ┌─┘██─┐   ');
data.push(' │██┘██   │██───┘██ ┌┘██████┐ └██████   ');
data.push(' │████┐   │███████┐ │██   │██   │██     ');
data.push(' │██└██┐  │██   │██ │██   │██   │██ ┌─┐ ');
data.push(' │██ └██┐ │██───┘██ └██───┘██   └██─┘██ ');
data.push(' └██  └██ └███████   └██████     └████  ');
data.push('                                        ');
console.log(cout.bold.bgBlack.black(data.join("\n")
  .replace(new RegExp("█", "g"), cout.magenta("█"))
  .replace(new RegExp("┌", "g"), cout.green("┌"))
  .replace(new RegExp("└", "g"), cout.green("└"))
  .replace(new RegExp("┐", "g"), cout.green("┐"))
  .replace(new RegExp("┘", "g"), cout.green("┘"))
  .replace(new RegExp("│", "g"), cout.green("│"))
  .replace(new RegExp("─", "g"), cout.green("─"))
));
