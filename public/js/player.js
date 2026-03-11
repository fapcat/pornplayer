video_el.addEventListener("loadedmetadata", () => {
  play();
});

video_el.addEventListener("seeked", () => {
  if (startplaying) {
    // setTimeout(() => {
    startplaying = false;
    video_el.style.visibility = "visible";
    video_el.play();
    // }, 200);
  }
});

video_el.addEventListener("error", () => {
  console.log(
    `Error ${video_el.error.code} with file ${
      get_from_history().path
    }; details: ${video_el.error.message}`
  );
  play_video("next");
});

video_el.addEventListener("ended", () => {
  play_video("next");
});

video_el.addEventListener("timeupdate", () => {
  if (seeking == false) {
    let progress = document.getElementById("progress");
    progress.style.width = `${
      (video_el.currentTime / video_el.duration) * 100
    }%`;
  }
});

function progress_hide() {
  let progress = document.getElementById("info_bar");
  progress.style.opacity = 0;
  progress.style.bottom = `-30px`;
  // document.getElementById("touch_menu").style.display = "none";
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
  // document.getElementById("touch_menu").style.display = "flex";
  progress_delayed_hide();
}

function scan() {
  return fetch("/files")
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      files = data;
      if (files.length > 0) update_files_list();
      document.getElementById("num_files").textContent = files.length;
      return data;
    });
}

function play() {
  video_el.style.display = "block";
  video_el.pause();
  let curtime =
    current_video.time == "rnd"
      ? Math.floor(Math.random() * video_el.duration)
      : current_video.time;
  video_el.currentTime = curtime;
}

// function seekToTime(ts) {
//   // try and avoid pauses after seeking
//   video_element.pause();
//   video_element.currentTime = ts; // if this is far enough away from current, it implies a "play" call as well...oddly. I mean seriously that is junk.
//     // however if it close enough, then we need to call play manually
//     // some shenanigans to try and work around this:
//     var timer = setInterval(function() {
//         if (video_element.paused && video_element.readyState ==4 || !video_element.paused) {
//             video_element.play();
//             clearInterval(timer);
//         }
//     }, 50);
// }

function select_list_item(id, make_active = false) {
  last_selected_item = selected_list_item;
  selected_list_item = id;

  if (last_selected_item != null)
    file_items[last_selected_item].classList.remove("selected");
  file_items[selected_list_item].classList.add("selected");
  if (make_active) {
    if (active_list_item != null)
      file_items[active_list_item].classList.remove("active");
    file_items[selected_list_item].classList.add("active");
    active_list_item = selected_list_item;
  }
}

addEvent(document, "keydown", function (e) {
  if (e.target.tagName === "INPUT") return;

  e = e || window.event;

  // key: 0-9 (seek to 0%, 10%, 20%, ...)
  for (let x = 0; x < 10; x++) {
    if (current_section == "player") {
      document.addEventListener("keydown", (e) => {
        const event = e || window.event;

        if (event.which == x.toString().toUpperCase().charCodeAt(0)) {
          event.preventDefault();

          progress_show()

          video_el.currentTime =
              (video_el.duration * x) / 10

        }
      });
    }
  }

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
          video_el.style.visibility = "hidden";

          let progress = document.getElementById("info_bar");
          progress.style.display = "none";
        }

        switch_section("home");
      }
      break;
    case 33: // key: pageup
      if (current_section == "files" && selected_list_item > 0) {
        let num_on_page = Math.floor(
          document.getElementById("files").offsetHeight /
            file_items[0].offsetHeight
        );

        let i = selected_list_item;
        i = i >= num_on_page ? i - num_on_page : 0;

        window.setTimeout(function () {
          select_list_item(i);
          file_items[selected_list_item].scrollIntoView();
        }, 0);
      }
      break;
    case 34: // key: pagedown
      if (
        current_section == "files" &&
        selected_list_item < file_items.length
      ) {
        let num_on_page = Math.floor(
          document.getElementById("files").offsetHeight /
            file_items[0].offsetHeight
        );

        let i = selected_list_item;
        i =
          i + num_on_page <= file_items.length - 1
            ? i + num_on_page
            : files.length - 1;

        window.setTimeout(function () {
          select_list_item(i);
          file_items[selected_list_item].scrollIntoView();
        }, 0);
      }
      break;
    case 37: // key: left
      if (current_section == "player") {
        progress_show();
        if (
            video_el.currentTime > 10
        ) {
          video_el.currentTime = video_el.currentTime -10
        }
      }
      break;

    case 39: // key: right
      if (current_section == "player") {
        progress_show();
        if (
            video_el.currentTime < video_el.duration - 10
        ) {
          video_el.currentTime = video_el.currentTime + 10
        }
      }
      break;


    case 38: // key: up arrow
      if (current_section == "files") {
        // Remove the highlighting from the previous element

        let new_item = selected_list_item > 0 ? selected_list_item - 1 : 0; // Decrease the counter
        window.setTimeout(function () {
          file_items[new_item].scrollIntoView();
          select_list_item(new_item);
        }, 0);
      }
      break;
    case 40: // key: down arrow
      if (current_section == "files") {
        // Remove the highlighting from the previous element
        let new_item =
          selected_list_item < file_items.length - 1
            ? selected_list_item + 1
            : file_items.length - 1; // Increase counter
        window.setTimeout(function () {
          file_items[new_item].scrollIntoView();
          select_list_item(new_item);
        }, 0);
      }
      break;


    case 38: // key: up
      if (current_section == "player") {
        if (video_el.volume < 1)
          video_el.volume = Math.round((video_el.volume + 0.1) * 10) / 10;
      }
      break;

      case 80: // key: p
        save_to_playlist('bangers', 'test');
        console.log('savetoplaylist');
        break;


    // case 49: // key: 1
    //   switch_section("home");
    //   break;
    // case 50: // key: 2
    //   switch_section("files");
    //   break;
    // case 51: // key: 3
    //   switch_section("player");
    //   break;
    // case 40: // key: down
    //   if (current_section == "player") {
    //     if (video_el.volume > 0)
    //       video_el.volume = Math.round((video_el.volume - 0.1) * 10) / 10;
    //   }
    //   break;
    case 66: // key: b (play previous in sequence)
      if (files.length > 0) {
        switch_section("player");
        play_video("previous");
      }
      break;
    case 70: // key: f (toggle fullscreen)
      if (current_section == "player") {
        toggleFullscreen();
      }
      break;
    case 72: // key: h (play random)
      if (files.length > 0) {
        switch_section("player");
        play_video("random");
      }
      break;
    case 73: // key: i (show info)
      if (current_section == "player") {
        progress_show();
      }
      break;
    case 74: // key: j (rewind)
      if (current_section == "player") {
        progress_show();
        if (video_el.currentTime >= video_el.duration * 0.05) {
          video_el.currentTime =
            video_el.currentTime - video_el.duration * 0.05;
        } else {
          video_el.currentTime = 0;
        }
      }
      break;
    case 75: // key: k (fast forward)
      if (current_section == "player") {
        progress_show();
        if (
          video_el.currentTime <
          video_el.duration - video_el.duration * 0.05
        ) {
          video_el.currentTime =
            video_el.currentTime + video_el.duration * 0.05;
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
    case 82: // key: r (aspect ratio)
      toggle_aspect_ratio();
      break;

    case 90: // key: z
      if (current_section === "player") {
        sendEventToBackend("x");
      }
      break;

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

async function postData(url = "", data = {}) {
  // Default options are marked with *
  const response = await fetch(url, {
    method: "POST", // *GET, POST, PUT, DELETE, etc.
    mode: "cors", // no-cors, *cors, same-origin
    cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
    credentials: "same-origin", // include, *same-origin, omit
    headers: {
      "Content-Type": "application/json",
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: "follow", // manual, *follow, error
    referrerPolicy: "no-referrer", // no-referrer, *client
    body: JSON.stringify(data), // body data type must match "Content-Type" header
  });
  return await response.json(); // parses JSON response into native JavaScript objects
}

scan();
