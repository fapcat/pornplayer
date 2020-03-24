module.exports = new class ConfigManager {
    constructor() {
        return JSON.parse(fs.readFileSync(`./config.json`));
    }
}