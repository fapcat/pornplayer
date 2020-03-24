module.exports = new class Store {
    constructor() {
        this.data = [];
    }

    set(key, value) {
        this.data[key] = value;
    }

    get(key) {
        return this.data[key];
    }
}