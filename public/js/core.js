let current_section = (previous_section = "home");
let history = [];
let files = [];
let playlists = [];
let video_el = document.getElementById("video_player");
let settings_div = document.getElementById("settings");
let file_items = [];
let ph = null; // progress timer
let selected_list_item = null;
let last_selected_item = null;
let active_list_item = null;
let list_items = [];
let seeking = false;
let startplaying = false;
let mute = false;
let current_video = {};

video_el.autoplay = false;
video_el.volume = 0;

document.getElementById("search").addEventListener("click", () => {
  let search = document.getElementById("search_string").value || "all";
  postData("/search", { "search": search }).then((data) => {
    files = data;
    document.getElementById("num_files").textContent = files.length;
  });
});

document.getElementById("all").addEventListener("click", () => {
  postData("/search", { "search": "all" }).then((data) => {
    files = data;
    document.getElementById("num_files").textContent = files.length;
    document.getElementById("search_string").value = "";
  });
});

function switch_section(sname) {
  let sections = ["home", "files", "player"];

  if (current_section == sname) previous_section = current_section;

  current_section = sname;

  for (let s of sections) {
    let el = document.getElementById(s);
    if (s == sname) el.style.display = "block";
    else el.style.display = "none";
  }

  if (sname == "files") {
    window.setTimeout(function () {
      document.getElementById("files").scrollTop = document.querySelector(
        "#files li.selected"
      ).offsetTop;
    }, 0);
  }
}

function config() {
  return fetch("/config")
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      return data;
    });
}

function getPlaylists() {
  return fetch("/playlists")
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        return data;
      });
}

function setPlaylist(name) {
    return fetch(`/playlist/${name}`)
        .then((response) => {
          return response.json();
        })
        .then((data) => {
            console.log(data);
          files = data;
          if (files.length > 0) update_files_list();
          document.getElementById("num_files").textContent = files.length;
          return data;
        });
}

function getRemotePlaylists() {
    return fetch("/remote-playlists")
        .then((response) => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then((data) => {
            return data; // array of playlists from Laravel
        })
        .catch((err) => {
            console.error("Error fetching remote playlists:", err);
            return [];
        });
}


function setRemotePlaylist(id) {
    return fetch(`/remote-playlist/${id}`)
        .then((response) => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then((data) => {
            files = data.map(item => item.path);

            if (files.length > 0) update_files_list();
            document.getElementById("num_files").textContent = files.length;
            console.log(files);
            return data;
        })
        .catch((err) => {
            console.error("Error setting remote playlist:", err);
            return [];
        });
}

function add_to_history(id, time) {
  history.push({
    id: id,
    time: time,
    path: files[id],
  });
}

function update_history(time = "rnd") {
  history[history.length - 1].time = time;
}

function get_from_history(back = 0) {
  return history.length > 0 ? history[history.length - (back + 1)] : false;
}

function get_video(method = "random", custom_vid = null) {
  return new Promise((resolve, reject) => {
    let currentTime = video_el.currentTime ? video_el.currentTime : 0;
    current_video.time = currentTime;

    fetch(`/file/${method}`, {
      method: "post",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        currentVideo: current_video,
        customVideo: custom_vid,
      }),
    }).then((res) => {
      resolve(res.json());
    });
  });
}

function save_to_playlist(playlist, file) {
  postData("/playlist", { action: 'save', playlist: playlist, file: current_video.path }).then((data) => {});
}

function play_video(method = "random", custom_vid = null, custom_start = 0) {
  get_video(method, custom_vid).then((file) => {
    current_video = file;
    //select_list_item(get_from_history().id, true);

    startplaying = true;
    video_el.style.visibility = "hidden";

    video_el.setAttribute('data-video-path', encodeURI(file.path));

    video_el.src = `/video/?f=${encodeURI(file.path)}`;
    video_el.load();

    document.getElementById("info").innerHTML = file.path;
    progress_show();
  });
}

function play_video_old(method = "random", custom_vid = 0, custom_start = 0) {
  if (video_el.currentTime) update_history(video_el.currentTime);

  switch (method) {
    case "first":
      add_to_history(0, "rnd");
      break;
    case "specific":
      add_to_history(custom_vid, "rnd");
      break;
    case "next":
      if (history.length == 0) add_to_history(0, "rnd");
      else
        add_to_history(
          get_from_history().id == files.length - 1
            ? 0
            : get_from_history().id + 1,
          "rnd"
        );
      break;
    case "previous":
      if (history.length == 0) add_to_history(files.length - 1, "rnd");
      else
        add_to_history(
          get_from_history().id == 0
            ? files.length - 1
            : get_from_history().id - 1,
          "rnd"
        );
      break;
    case "random":
      add_to_history(Math.floor(Math.random() * files.length), "rnd");
      break;
    case "last":
      if (history.length == 0)
        add_to_history(Math.floor(Math.random() * files.length), "rnd");
      history.push(history.splice(history.length - 2, 1)[0]);
      break;
    default:
  }

  console.log(
    `Playing video ${get_from_history().id + 1} of ${files.length} (${
      get_from_history().path
    })`
  );

  select_list_item(get_from_history().id, true);

  startplaying = true;
  video_el.style.visibility = "hidden";

  video_el.src = `/video/?f=${encodeURIComponent(get_from_history().path)}`;
  video_el.load();

  document.getElementById("info").innerHTML = get_from_history().path;
  progress_show();
}

function toggleFullscreen(event) {
  var element = document.body;

  if (event instanceof HTMLElement) {
    element = event;
  }

  var isFullscreen =
    document.webkitIsFullScreen || document.mozFullScreen || false;

  element.requestFullScreen =
    element.requestFullScreen ||
    element.webkitRequestFullScreen ||
    element.mozRequestFullScreen ||
    function () {
      return false;
    };
  document.cancelFullScreen =
    document.cancelFullScreen ||
    document.webkitCancelFullScreen ||
    document.mozCancelFullScreen ||
    function () {
      return false;
    };

  isFullscreen ? document.cancelFullScreen() : element.requestFullScreen();
}

function cancelFullscreen(event) {
  var element = document.body;

  if (event instanceof HTMLElement) {
    element = event;
  }

  var isFullscreen =
    document.webkitIsFullScreen || document.mozFullScreen || false;

  document.cancelFullScreen =
    document.cancelFullScreen ||
    document.webkitCancelFullScreen ||
    document.mozCancelFullScreen ||
    function () {
      return false;
    };

  isFullscreen ? document.cancelFullScreen() : false;
}

switch_section(current_section);
config().then((data) => {
  let aspect_ratio = data.aspect_ratio || "contain";
  video_el.style.objectFit = aspect_ratio;
  document.getElementById('current_aspect_ratio').innerHTML = '(' + aspect_ratio + ')';
  mute = data.mute || false;
});

getPlaylists().then((data) => {
  let playlist_div = document.getElementById("playlist");

  for (let f = 0; f < data.length; f++) {
    file_item = document.createElement("li");
    file_item.classList.add("file_item");
    file_item.setAttribute("data-id", f);
    file_item.innerText = data[f];
    file_item.addEventListener("click", function () {
      setPlaylist(data[f]);
    });
    playlist_div.appendChild(file_item);
  }
});

getRemotePlaylists().then((data) => {
    let remoteDiv = document.getElementById("remote_playlists");

    // Clear any existing items first (optional)
    remoteDiv.innerHTML = "";

    for (let i = 0; i < data.length; i++) {
        const playlist = data[i]; // { id, title, query, writeable }

        const li = document.createElement("li");
        li.classList.add("file_item");
        li.setAttribute("data-id", playlist.id);
        li.textContent = playlist.title;

        li.addEventListener("click", function () {
            setRemotePlaylist(playlist.id);
        });

        remoteDiv.appendChild(li);
    }
});

document.addEventListener("fullscreenchange", exitHandler);
document.addEventListener("webkitfullscreenchange", exitHandler);
document.addEventListener("mozfullscreenchange", exitHandler);
document.addEventListener("MSFullscreenChange", exitHandler);

function exitHandler() {
  if (
    !document.fullscreenElement &&
    !document.webkitIsFullScreen &&
    !document.mozFullScreen &&
    !document.msFullscreenElement
  ) {
    console.log("exit");
  }
}

function toggle_aspect_ratio() {
  let aspect_ratios = ["contain", "cover", "fill", "none"];

  let i = aspect_ratios.lastIndexOf(getComputedStyle(video_el).objectFit) + 1;
  if (i >= aspect_ratios.length) i = 0;

  video_el.style.objectFit = aspect_ratios[i];

  document.getElementById('current_aspect_ratio').innerHTML = '(' + aspect_ratios[i] + ')';

  postData("/config", { aspect_ratio: aspect_ratios[i] }).then((data) => {});
}
