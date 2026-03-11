const store = require("./store-manager");

let last_message = "";

module.exports.log = function (message, level = 0) {
  if (store.get("log_level") >= level && last_message != message) {
    console.log("\x1b[96m%s\x1b[0m", message); //cyan
    last_message = message;
  }
};
