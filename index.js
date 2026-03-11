const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const store = require("./lib/store-manager");
const vs = require("./lib/video-streamer");
const cm = require("./lib/file-manager/cache-manager");
const config = require("./lib/config-manager");
const fs = require("./lib/file-manager/file-scanner");
const fm = require("./lib/file-manager/file-manager");
const pm = require("./lib/file-manager/playlist-manager");
const fp = require("./lib/file-manager/file-provider");
const { log } = require("./lib/log-manager");
const argv = require("minimist")(process.argv.slice(2));

const app = express();
const port = config.get().port || 3002;

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

store.set("files", []);
store.set("scan_status", "idle");
store.set("log_level", argv.v != null && Number.isInteger(argv.v) ? argv.v : 0);

var unless = function (path, middleware) {
  return function (req, res, next) {
    if (req.url.startsWith(path)) {
      return next();
    } else {
      return middleware(req, res, next);
    }
  };
};

app.use(
  session({
    key: "user_sid",
    secret: "somerandonstuffs",
    resave: false,
    saveUninitialized: false,
  })
);

let pinProtect = function (req, res, next) {
  // console.log(req.query);
  // console.log(req.url);
  // console.log("ref " + req.header("Referer"));

  let token =
    req.headers["x-access-token"] || req.headers["authorization"] || "";
  if (token.startsWith("Bearer ")) {
    token = token.slice(7, token.length);

    if (token == config.get().pin) {
      req.session.user = "loggedin";
    }
  }

  if (
    req.url != "/pin" &&
    !req.session.user &&
    req.url.slice(0, 6) != "/video" &&
      config.get().pin!== ""
  ) {
    console.log("Not a valid PIN");
    res.redirect("/pin");
  } else {
    next();
  }
};

// app.use(unless("/file", pinProtect));

app.get("/pin", (req, res) => {
  res.render("pages/pin");
});

app.get("/hammer", (req, res) => {
  res.render("pages/ht");
});

app.post("/pin", (req, res) => {
  if (req.body.pin == config.get().pin) {
    req.session.user = "loggedin";
    res.redirect("/");
  } else {
    res.redirect("/pin");
  }
});

app.get("/", async (req, res) => {
  res.render("pages/index", {
    num_files: store.get("files") || [],
    scan_status: store.get("scan_status"),
    scan_message: store.get("scan_message"),
  });
});

app.post("/file/:method", (req, res) => {
  let nextFile = fm.getFile(
    req.params.method,
    req.body.currentVideo,
    req.body.customVideo
  );
  res.json(nextFile);
});

app.get("/logout", (req, res) => {
  req.session.user = null;
  res.redirect("/");
});

app.get("/video", vs);

app.get("/files", async (req, res) => {
  res.json(store.get("files"));
});

app.get("/playlist/:name", async (req, res) => {
  pm.getPlaylist(req.params.name).then((data) => {
    res.json(data);
  });
});


app.get("/playlists", async (req, res) => {
  pm.getPlaylists().then((data) => {
    res.json(data);
  });
});

app.get("/remote-playlists", async (req, res) => {
    pm.getRemotePlaylists()
        .then((data) => {
            res.json(data);
        })
        .catch((err) => {
            console.error("Error fetching remote playlists:", err);
            res.status(500).json({ error: "Failed to load remote playlists" });
        });
});


app.get("/remote-playlist/:id", async (req, res) => {
    pm.getRemotePlaylist(req.params.id)
        .then((data) => {
            res.json(data);
        })
        .catch((err) => {
            console.error("Error fetching remote playlist:", err);
            res.status(500).json({ error: "Failed to load remote playlist" });
        });
});

app.post("/playlist", (req, res) => {
  pm.saveFileToPlaylist(req.body['playlist'], req.body['file']);
});

app.post("/config", (req, res) => {
  for (key of Object.keys(req.body)) {
    config.set(key, req.body[key]);
    config.save();
  }
});

app.get("/config", (req, res) => {
  res.json(config.get());
});

app.post("/search", (req, res) => {
  console.log(req.body.search);

  fm.getFileList(req.body.search).then((data) => {
    store.set("files", data);
    store.set("scan_status", "complete");
    fp.loadVideos();
    res.json(store.get("files"));
  });
});

app.listen(port, () => {
  log(`Video player started on http://localhost:${port}`);

  // fm.getFileList().then((data) => {
  //   store.set("files", data);
  //   store.set("scan_status", "complete");
  //   fp.loadVideos();
  //   log(`${store.get("files").length} files loaded`);
  // });
  // get cache in any case

  if (cm.check_cache()) store.set("files", cm.load().files);
  if (
    !cm.check_cache() ||
    config.force_scan_at_startup ||
    argv.f === true ||
    argv.p != null
  ) {
    if (config.get().force_scan_at_startup) log("Force rescan at start");
    if (argv.f === true) log("Forced rescan");
    if (argv.p != null) {
      fs.scan(argv.p.split(";")).then((res) => {
        store.set("files", res);
        store.set("scan_status", "complete");
        log(`${store.get("files").length} files loaded`);
      });
    } else {
      fs.scan().then((res) => {
        store.set("files", res);
        store.set("scan_status", "complete");
        cm.cache_files(res);
        fp.loadVideos();
        log(`${store.get("files").length} files loaded`);
      });
    }
  } else {
    store.set("files", cm.load().files);
    store.set("scan_status", "complete");
    fp.loadVideos();
    log(`${store.get("files").length} files loaded`);
  }
});
