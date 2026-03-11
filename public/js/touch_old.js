// var mc = new Hammer.Manager(document.getElementById("player"));
// mc.add(new Hammer.Swipe({ event: "swiperight", direction: Hammer.DIRECTION_RIGHT }));
// mc.add(new Hammer.Swipe({ event: "swipeleft", direction: Hammer.DIRECTION_LEFT }));
// mc.add(new Hammer.Swipe({ event: "swipedown", direction: Hammer.DIRECTION_DOWN }));

let hammertime = new Hammer(document.getElementById("player"));

hammertime.get("swipe").set({ direction: Hammer.DIRECTION_ALL });
hammertime.get("pan").set({ direction: Hammer.DIRECTION_ALL });

let curr_time = 0;
let new_time = 0;

let adjusting_volume = false;
let curr_volume = 0;
let new_volume = 0;

let notification = document.getElementById("notification");

hammertime.on("swiperight", function (e) {
  if (files.length > 0 && e.center.y <= video_el.offsetHeight / 2) {
    play_video("random");
  }
});

hammertime.on("swipeleft", function (e) {
  if (files.length > 0 && e.center.y <= video_el.offsetHeight / 2) {
    play_video("last");
  }
});

hammertime.on("swipedown", function (e) {
  if (e.center.x > video_el.offsetWidth / 2) {
    switch_section("home");
    cancelFullscreen();
  }
});

hammertime.on("panstart", function (ev) {
  if (ev.direction <= 4) {
    curr_time = (video_el.currentTime / video_el.duration) * 100;
    seeking = true;
  } else {
    if (ev.center.x <= video_el.offsetWidth / 2) {
      adjusting_volume = true;
      curr_volume = video_el.volume * 10;
      notification.style.display = "block";
    }
  }
});

hammertime.on("pan", function (ev) {
  if (
    ev.center.y > video_el.offsetHeight / 2 &&
    seeking == true &&
    startplaying == false
  ) {
    progress_show();
    let tx = ev.deltaX / video_el.offsetWidth;
    new_time =
      video_el.offsetWidth > 500
        ? curr_time + Math.round((tx * 1000) / 3)
        : curr_time + Math.round(tx * 1000) / 7;
    if (new_time > 95) new_time = 95;
    if (new_time < 0) new_time = 0;
    let progress = document.getElementById("progress");
    progress.style.width = `${new_time}%`;
  }

  if (ev.center.x <= video_el.offsetWidth / 2 && mute === false) {
    let tx = ev.deltaY / video_el.offsetHeight;
    new_volume =
      video_el.offsetHeight > 500
        ? Math.round(curr_volume - (tx * 100) / 3)
        : Math.round(curr_volume - (tx * 100) / 7);
    if (new_volume > 10) new_volume = 10;
    if (new_volume <= 0) new_volume = 0;
    video_el.volume = new_volume / 10;
    notification.innerHTML = ` ${new_volume}`;
  }
});

hammertime.on("panend", function (ev) {
  if (
    ev.center.y > video_el.offsetHeight / 2 &&
    seeking == true &&
    startplaying == false
  ) {
    let set_time = Math.round(video_el.duration * (new_time / 100));
    console.log(
      set_time,
      video_el.duration,
      new_time,
      video_el.offsetHeight,
      ev.center.y
    );
    video_el.currentTime = set_time;
  }
  seeking = false;
  adjusting_volume = false;

  setTimeout(() => {
    notification.style.display = "none";
  }, 100);
});

document.getElementById("key_mobile").addEventListener("click", () => {
  if (files.length > 0) {
    switch_section("player");
    play_video("random");
  }
});

document.getElementById("key_home").addEventListener("click", () => {
  switch_section("home");
});

document.getElementById("key_files").addEventListener("click", () => {
  if (files.length > 0) {
    switch_section("files");
  }
});

document.getElementById("key_player").addEventListener("click", () => {
  if (files.length > 0) {
    switch_section("player");
    play_video("random");
  }
});

document.getElementById("key_aspect_ratio").addEventListener("click", () => {
  toggle_aspect_ratio();
});

let tap = new Hammer.Tap({ event: "singletap" });
let doubletap = new Hammer.Tap({ event: "doubletap", taps: 2 });
tap.recognizeWith(doubletap);

hammertime.on("doubletap", function (ev) {
  toggleFullscreen();
});

// let multiswipe = new Hammer.Swipe({
//   event: "multiswipe",
//   direction: Hammer.DIRECTION_ALL,
//   threshold: 10,
//   pointers: 2,
// });

// hammertime.on("multiswipe", function (ev) {
//   alert("multiswipe");
// });
