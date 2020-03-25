let config = require('./config-manager');
const { log } = require('./log-manager');
const confm = require('./config-manager');
const path = require('path');

config = confm.get();

function comp_arrays(array1, array2) {
    return (array1.length === array2.length && array1.sort().every(function(value, index) { return value === array2.sort()[index]}));
}
  
module.exports.check_cache = function () {
    if (!fs.existsSync(`./cache.json`)) {
        log('No cache file found');
        return false;
    }

    let config_folders = config.folders;
    let cache_folders = JSON.parse(fs.readFileSync(`./cache.json`)).folders;

    return comp_arrays(config_folders, cache_folders);
}

module.exports.load = function () {
    log('Loading cache');
    return JSON.parse(fs.readFileSync(`./cache.json`));
}

module.exports.cache_files = function(files) {
    return new Promise((resolve, reject) => {
      let data = JSON.stringify({ "folders": config.folders, "files": files }, null, 2);
      fs.writeFileSync(path.resolve(path.dirname(require.main.filename) + '/cache.json'), data);
    });
  };