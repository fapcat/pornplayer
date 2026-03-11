const fisc = require("./file-scanner");
const fipr = require("./file-provider");
const cama = require("./cache-manager");
const config = require("../config-manager");
const store = require("../store-manager");
const { log } = require("../log-manager");

const http = require("http");

module.exports = new (class FileManager {
  constructor() {
    this.fileProvider = config.get().file_provider || "local";
  }

  getFileList(type = "all") {
    // if (this.fileProvider == 'local') {
    //   store.set("files", cm.load().files);
    //   store.set("scan_status", "complete");
    //   log(`${store.get("files").length} files loaded`);
    // } else {
    //   return new Promise((resolve, reject) => {
    //     http.get(`http://192.168.1.5:8000/api/play/${type}`, (resp) => {
    //       let data = "";
    //
    //       resp.on("data", (chunk) => {
    //         data += chunk;
    //       });
    //
    //       resp.on("end", () => {
    //         resolve(JSON.parse(data));
    //       });
    //     });
    //   });
    // }

    return new Promise((resolve, reject) => {
      let filteredArray = store.get('files').filter(item => item.toLowerCase().includes(type.toLowerCase()));
      resolve(filteredArray);
    });
  }

  getFile(requestType, lastVideo, customVideo = null) {
    fipr.updateCurrentHistory(lastVideo);

    switch (requestType) {
      case "previous":
        return fipr.getPreviousVideo();
        break;
      case "next":
        return fipr.getNextVideo();
        break;
      case "last":
        return fipr.getLastVideo();
        break;
      case "random":
        return fipr.getRandomVideo();
        break;
      case "specific":
        return fipr.getSpecificVideo(customVideo);
        break;
    }
  }

  rescanFiles() {
    if (store.get("scan_status") == "complete") {
      // store.set("files", []);
      store.set("scan_status", "scanning");
      fisc.scan().then((res) => {
        store.set("files", res);
        store.set("scan_status", "complete");
        cama.cache_files(res);
        log(`${store.get("files").length} files loaded`);
      });
    } else {
      log("There is still a scan ongoing");
    }
  }
})();
