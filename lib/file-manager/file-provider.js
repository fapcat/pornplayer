// const cm = require("./cache-manager");
const store = require("../store-manager");

module.exports = new (class FileProvider {
  constructor() {
    this.files = [];
    this.history = [];

    this.loadVideos();
  }

  updateCurrentHistory(lastVideo) {
    if (this.history.length > 0)
      this.history[this.history.length - 1].time = lastVideo.time;
  }

  addToHistory(id, time = 0) {
    let historyItem = {
      id: id,
      time: time,
      path: store.get("files")[id],
    };
    this.history.push(historyItem);
    // console.log(historyItem);
  }

  getFromHistory(back = 0) {
    return this.history[this.history.length - (back + 1)];
  }

  loadVideos() {
    this.files = store.get("files");
  }

  getRandomVideo() {
    if (store.get("files") == []) return false;

    let randomFile = Math.floor(Math.random() * store.get("files").length);
    this.addToHistory(randomFile);

    return { id: randomFile, path: store.get("files")[randomFile], time: "rnd" };
  }

  getNextVideo() {
    if (store.get("files") == []) return false;

    let nextFile =
      this.getFromHistory().id + 1 < store.get("files").length
        ? this.getFromHistory().id + 1
        : 0;

    this.addToHistory(nextFile);

    return { id: nextFile, path: store.get("files")[nextFile], time: "rnd" };
  }

  getPreviousVideo() {
    if (store.get("files") == []) return false;

    let previousFile =
      this.getFromHistory().id - 1 >= 0
        ? this.getFromHistory().id - 1
        : store.get("files").length - 1;

    this.addToHistory(previousFile);

    return { id: previousFile, path: store.get("files")[previousFile], time: "rnd" };
  }

  getSpecificVideo(id) {
    if (store.get("files") == []) return false;

    let specificFile =
      id > 0 && id <= store.get("files").length ? id : this.getFromHistory(1).id;

    this.addToHistory(specificFile);

    return { id: specificFile, path: store.get("files")[specificFile], time: "rnd" };
  }

  getLastVideo() {
    if (store.get("files") == [] || this.history == []) return false;

    let lastFile = this.getFromHistory(1);

    this.addToHistory(lastFile.id);

    return { id: lastFile.id, path: lastFile.path, time: lastFile.time };
  }
})();
