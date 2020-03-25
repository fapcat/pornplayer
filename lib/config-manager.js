const path = require('path');

module.exports = new class ConfigManager {
    constructor() {
        this.config = this.get();
    }

    set(key, value) {
        this.config[key] = value;
    }

    get() {
        return JSON.parse(fs.readFileSync(`./config.json`));
    }

    has(key) {
        return this.config.hasOwnProperty(key)
    }

    save() {
        fs.writeFileSync(path.resolve(path.dirname(require.main.filename) + '/config.json'), JSON.stringify(this.config, null, 2));
    }
}