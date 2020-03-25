let current_section = (previous_section = "home");
let history = [];
let files = [];
let video_el = document.getElementById("video_player");
let settings_div = document.getElementById("settings");
let file_items = [];
let ph = null;
let selected_list_item = null;
let last_selected_item = null;
let active_list_item = null;
let list_items = [];

video_el.autoplay = false;
video_el.volume = 0;

function switch_section(sname) {
  let sections = ["home", "files", "player"];

  if (current_section == sname) previous_section = current_section;;
  
  current_section = sname;

  if (sname == "settings") {
    // settings_div.classList.add("settings_visible");
  } else {
    // settings_div.classList.remove("settings_visible");

    for (let s of sections) {
      let el = document.getElementById(s);
      if (s == sname) el.style.display = "block";
      else el.style.display = "none";
    }

    if (sname == "files") {
      window.setTimeout(function() {
        document.getElementById("files").scrollTop = document.querySelector("#files li.selected").offsetTop;
      }, 0);
    }
  }
}

function toggle_aspect_ratio() {
  if (current_section == "player") {
    let aspect_ratios = ["contain", "cover", "fill", "none"];

    let i = aspect_ratios.lastIndexOf(getComputedStyle(video_el).objectFit) + 1;
    if (i >= aspect_ratios.length) i = 0;

    video_el.style.objectFit = aspect_ratios[i];
    postData('/config', { "aspect_ratio": aspect_ratios[i] })
    .then((data) => {});
  }
}

function update_files_list() {
  let files_div = document.getElementById("files_list");

  for (let f = 0; f < files.length; f++) {
    file_item = document.createElement("li");
    file_item.classList.add("file_item");
    file_item.setAttribute("data-id", f);
    file_item.innerText = files[f];
    file_item.addEventListener("click", function() {
      select_list_item(f, true);
      play_video("specific", f);
      switch_section("player");
    });
    files_div.appendChild(file_item);
  }

  file_items = document.querySelectorAll("#files_list li");
  select_list_item(0);
}

video_el.addEventListener("loadedmetadata", () => {
  play();
});

video_el.addEventListener("error", () => {
  console.log(`Error ${video_el.error.code} with file ${get_from_history().path}; details: ${video_el.error.message}`);
  play_video("next");
});

video_el.addEventListener("ended", () => {
  play_video("next");
});

video_el.addEventListener("timeupdate", () => {
  let progress = document.getElementById("progress");
  progress.style.width = `${(video_el.currentTime / video_el.duration) * 100}%`;
});

function progress_hide() {
    let progress = document.getElementById("info_bar");
    progress.style.opacity = 0;
    progress.style.bottom = `-30px`;
}

function progress_delayed_hide() {
    clearTimeout(ph);
    ph = setTimeout(progress_hide, 2500);
}

function progress_show() {
    let progress = document.getElementById("info_bar");
    progress.style.display = "block";
    progress.style.opacity = 100;
    progress.style.bottom = `20px`;
    progress_delayed_hide();
}

function add_to_history(id, time) {
  history.push({
    id: id,
    time: time,
    path: files[id]
  });
}

function update_history(time = "rnd") {
    history[history.length - 1].time = time;
}

function get_from_history(back = 0) {
  return history[history.length - (back + 1)];
}

function play_video(method = "random", custom_vid = 0, custom_start = 0) {
  if (video_el.currentTime) update_history(video_el.currentTime);
  
  video_el.style.display = "block";

  switch (method) {
    case "first":
      add_to_history(0, "rnd");
      break;
    case "specific":
      add_to_history(custom_vid, "rnd");
      break;
    case "next":
      if (history.length == 0) add_to_history(0, "rnd");
      else add_to_history(get_from_history().id == files.length - 1 ? 0 : get_from_history().id + 1, "rnd");
      break;
    case "previous":
      if (history.length == 0) add_to_history(files.length - 1, "rnd");
      else add_to_history(get_from_history().id == 0 ? files.length - 1 : get_from_history().id - 1, "rnd");
      break;
    case "random":
      add_to_history(Math.floor(Math.random() * files.length), "rnd");
      break;
    case "last":
      if (history.length == 0) add_to_history(Math.floor(Math.random() * files.length), "rnd");
      history.push(history.splice(history.length - 2, 1)[0]);
      break;
    default:
  }

  console.log(`Playing video ${get_from_history().id + 1} of ${files.length} (${get_from_history().path})`);

  select_list_item(get_from_history().id, true);

  video_el.src = `http://localhost:3001/video/?f=${encodeURIComponent(get_from_history().path)}`;
  video_el.load();

  document.getElementById('info').innerHTML = get_from_history().path;
  progress_show();
}

function scan() {
  return fetch("/files")
    .then(response => {
      return response.json();
    })
    .then(data => {
      files = data.files;
      if (files.length > 0) update_files_list();
      document.getElementById("num_files").innerText = `${files.length}${data.scan_status == "scanning" ? " (Still scanning)" : ""}`;
      return data;
    });
}

function config() {
  return fetch("/config")
    .then(response => {
      return response.json();
    })
    .then(data => {
      return data;
    });
}

function play() {
  video_el.style.display = "block";
  video_el.play();
  let vidfile = get_from_history();
  let curtime = vidfile.time == "rnd" ? Math.floor(Math.random() * video_el.duration + 30) : vidfile.time;
  video_el.currentTime = curtime;
}

function select_list_item(id, make_active = false) {
  last_selected_item = selected_list_item;
  selected_list_item = id;

  if (last_selected_item != null) file_items[last_selected_item].classList.remove("selected");
  file_items[selected_list_item].classList.add("selected");
  if (make_active) {
    if (active_list_item != null) file_items[active_list_item].classList.remove("active");
    file_items[selected_list_item].classList.add("active");
    active_list_item = selected_list_item;
  }
}

addEvent(document, "keydown", function(e) {
  e = e || window.event;

  switch (e.keyCode) {
    case 13: // enter key
      if (current_section == "files") {
        play_video("specific", selected_list_item);
        switch_section("player");
      }
      break;
    case 27: // escape
      if (current_section == "settings") {
        switch_section(previous_section);
      } else {
        video_el.volume = 0;
        video_el.pause();
        if (current_section == "player") {
          video_el.style.display = "none";

          let progress = document.getElementById("info_bar");
          progress.style.display = "none";
        }

        switch_section("home");
      }

      break;
    case 33: // key: pageup
      if (current_section == "files" && selected_list_item > 0) {
          let num_on_page = Math.floor(document.getElementById('files').offsetHeight / file_items[0].offsetHeight)

          let i = selected_list_item;
          i = (i >= num_on_page) ? (i-num_on_page) : 0;

          window.setTimeout(function() {
              select_list_item(i)
              file_items[selected_list_item].scrollIntoView();
          }, 0);
      }
      break;
    case 34: // key: pagedown
        if (current_section == "files" && selected_list_item < file_items.length) {
            let num_on_page = Math.floor(document.getElementById('files').offsetHeight / file_items[0].offsetHeight)

            let i = selected_list_item;
            i = ((i+num_on_page) <= file_items.length - 1) ? (i+num_on_page) : files.length - 1;

            window.setTimeout(function() {
                select_list_item(i)
                file_items[selected_list_item].scrollIntoView();
            }, 0);
        }
        break;
    case 38: // key: up arrow
      if (current_section == "files") {
        // Remove the highlighting from the previous element
        
        let new_item = selected_list_item > 0 ? selected_list_item - 1 : 0; // Decrease the counter
        window.setTimeout(function() {
          file_items[new_item].scrollIntoView();
          select_list_item(new_item)
        }, 0);
      }
      break;
    case 40: // key: down arrow
      if (current_section == "files") {
        // Remove the highlighting from the previous element
        let new_item = selected_list_item < file_items.length - 1 ? selected_list_item + 1 : file_items.length - 1; // Increase counter
        window.setTimeout(function() {
          file_items[new_item].scrollIntoView();
          select_list_item(new_item)
        }, 0);
      }
      break;
    case 48: // key: 0
      if (current_section == "player") {
        if (video_el.volume < 1) video_el.volume = Math.round((video_el.volume + 0.1)*10)/10;
      }
      break;
    case 49: // key: 1
      switch_section("home");
      break;
    case 50: // key: 2
      switch_section("files");
      break;
    case 51: // key: 3
      switch_section("player");
      break;
    case 57: // key: 9
      if (current_section == "player") {
        if (video_el.volume > 0) video_el.volume = Math.round((video_el.volume - 0.1)*10)/10;
      }
      break;
    case 65: // key: a (aspect ratio)
      toggle_aspect_ratio();
      break;
    case 66: // key: b (play previous in sequence)
      if (files.length > 0) {
        switch_section("player");
        play_video("previous");
      }
      break;
    case 70: // key: f (toggle fullscreen)
    if (current_section == "player") {
        toggleFullscreen()
      }
      break;
    case 72: // key: h (play random)
      if (files.length > 0) {
        switch_section("player");
        play_video("random");
      }
      break;
    case 74: // key: j (rewind)
      if (current_section == "player") {
        progress_show();
        if (video_el.currentTime >= video_el.duration * 0.05) {
          video_el.currentTime = video_el.currentTime - video_el.duration * 0.05;
        } else {
          video_el.currentTime = 0;
        }
      }
      break;
    case 75: // key: k (fast forward)
      if (current_section == "player") {
        progress_show();
        if (video_el.currentTime < video_el.duration - video_el.duration * 0.05) {
          video_el.currentTime = video_el.currentTime + video_el.duration * 0.05;
        }
      }
      break;
    case 76: // key: l (play last viewed)
      if (files.length > 0) {
        switch_section("player");
        play_video("last");
      }
      break;
    case 78: // key: n (play next in sequence)
      if (files.length > 0) {
        switch_section("player");
        play_video("next");
      }
      break;
    // case 83: // key: s
    //   switch_section("settings");
    //   break;
    default:
      console.log(`You pressed ${e.keyCode}`);
  }
});

function addEvent(element, eventName, callback) {
  if (element.addEventListener) {
    element.addEventListener(eventName, callback, false);
  } else if (element.attachEvent) {
    element.attachEvent("on" + eventName, callback);
  } else {
    element["on" + eventName] = callback;
  }
}

async function postData(url = '', data = {}) {
  // Default options are marked with *
  const response = await fetch(url, {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, *cors, same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, *same-origin, omit
    headers: {
      'Content-Type': 'application/json'
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer', // no-referrer, *client
    body: JSON.stringify(data) // body data type must match "Content-Type" header
  });
  return await response.json(); // parses JSON response into native JavaScript objects
}

function toggleFullscreen(event) {
  var element = document.body;

	if (event instanceof HTMLElement) {
		element = event;
	}

	var isFullscreen = document.webkitIsFullScreen || document.mozFullScreen || false;

	element.requestFullScreen = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || function () { return false; };
	document.cancelFullScreen = document.cancelFullScreen || document.webkitCancelFullScreen || document.mozCancelFullScreen || function () { return false; };

	isFullscreen ? document.cancelFullScreen() : element.requestFullScreen();
}

switch_section(current_section);
config().then((data) => {
  video_el.style.objectFit = data.aspect_ratio || 'contain';
});

scan();
