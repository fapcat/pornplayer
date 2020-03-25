const express = require('express')
const fs = require('fs');
const path = require('path');
const store = require('./lib/store-manager');
const vs = require('./lib/video-streamer');
const cm = require('./lib/cache-manager');
const config = require('./lib/config-manager');
const fm = require('./lib/file-manager');
const { log } = require('./lib/log-manager');

const app = express()
const port = config.get().port || 3001;

store.set('files', []);
store.set('scan_status', "idle");

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/', async (req, res) => {
  res.render('pages/index', { num_files: (store.get('files') || []), scan_status: store.get('scan_status'), scan_message: store.get('scan_message') });
})

app.get('/video', vs)

app.get('/files', async (req, res) => {
  res.send({ files: store.get('files'), scan_status: store.get('scan_status')});
})

app.post('/config', (req, res) => {
  for (key of Object.keys(req.body)) {
    config.set(key, req.body[key]);
    config.save();
  }
})

app.get('/config', (req, res) => {
  res.json(config.get());
})

app.listen(port, () => {
  log(`Video player started on http://localhost:${port}`)
  log(`Scanning for videos`);
  store.set('scan_status', 'scanning');
  if (!cm.check_cache() || config.force_scan_at_startup) {
    if (config.get().force_scan_at_startup) log('Force rescan at start');
    fm.scan().then((res) => {
      store.set('files', res);
      store.set('scan_status', 'complete');
      cm.cache_files(res);
      log(`${store.get('files').length} files loaded`);
    });
  } else {
    store.set('files', cm.load().files);
    store.set('scan_status', 'complete');
    log(`${store.get('files').length} files loaded`);
  }
})