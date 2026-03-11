const path = require("path");
const fs = require("fs");
const store = require("../store-manager");
const confm = require("../config-manager");
const { log } = require("../log-manager");

let totalFilesScanned = 0;
let StartTime = 0;
let totalVideosFound = 0;

module.exports.scan = function (path = []) {
  return new Promise((resolve, reject) => {
    let files = [];
    let numFilesScanned = 0;
    totalFilesScanned = 0;
    StartTime = new Date();

    let config = confm.get();

    if (path.length > 0) {
      config.folders = path;
    }

    for (let i = 0; i < config.folders.length; i++) {
      log(`Scanning: ${config.folders[i]}`, 2);
      walk(config.folders[i], function (err, results) {
        log(results, 4);

        if (err) throw err;
        files = files.concat(results);
        numFilesScanned++;

        if (numFilesScanned == config.folders.length) {
          resolve(files);
        }
      });
    }
  });
};

function walk(dir, done) {
  let results = [];
  let exts = [".mp4"];

  if (!fs.existsSync(dir)) {
    console.log(`Unable to read: ${dir}`);
    return done(null, []);
  }

  fs.readdir(dir, function (err, list) {
    if (err) return done(err, []);
    var i = 0;
    (function next() {
      var file = list[i++];
      if (!file) return done(null, results);
      file = path.resolve(dir, file);
      fs.stat(file, function (err, stat) {
        if (stat && stat.isDirectory()) {
          if (file.match(/recycle|node_modules|\.git$/i)) {
            console.log(`Skipping ${file}`);
            next();
          } else {
            walk(file, function (err, res) {
              results = results.concat(res);
              next();
            });
          }
        } else {
          totalFilesScanned++;
          let hrend = new Date() - StartTime;
          store.set(
            "scan_message",
            `Currently found ${totalVideosFound} videos with ${totalFilesScanned} files scanned in ${
              hrend / 1000
            } (${totalFilesScanned / (hrend / 1000)} files per second`
          );
          if (exts.includes(path.extname(file).toLowerCase())) {
            results.push(file);
            let current_files = store.get("files") || [];
            current_files.push(file);
            store.set("files", current_files);
            totalVideosFound++;
          }
          next();
        }
      });
    })();
  });
}
