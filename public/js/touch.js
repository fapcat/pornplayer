let curr_time = 0;
let new_time = 0;

let adjusting_volume = false;
let curr_volume = 0;
let new_volume = 0;

let gestureArea = document.getElementById("player");

let directions = [];
directions[2] = "left";
directions[4] = "right";
directions[16] = "down";
directions[8] = "up";

let panInfo = {};

let mc = new Hammer.Manager(gestureArea);

let singlepan = new Hammer.Pan({
    event: "pan",
    direction: Hammer.DIRECTION_ALL,
    threshold: 5,
    pointers: 1,
});

mc.add(singlepan);

mc.on("panstart", (e) => {
    panInfo = {};

    curr_time = (video_el.currentTime / video_el.duration) * 100;

    if (e.center.x <= gestureArea.offsetWidth / 2) {
        // left side
        if (e.center.y <= gestureArea.offsetHeight / 2) {
            panInfo.startQuadrant = 1;
        } else {
            panInfo.startQuadrant = 4;
        }
    } else {
        if (e.center.y <= gestureArea.offsetHeight / 2) {
            panInfo.startQuadrant = 2;
        } else {
            panInfo.startQuadrant = 3;
        }
    }

    console.log(panInfo);
});

mc.on("panend", (e) => {
    console.log(e, Math.abs(e.velocity));
    if (e.type === "panend") {
        if (
            Math.abs(e.velocity) > 0.3 &&
            e.distance > 10 &&
            panInfo.action != "seeking"
        ) {
            panInfo.gestureType = "swipe";

            if (
                (panInfo.startQuadrant == 2 || panInfo.startQuadrant == 3) &&
                panInfo.direction === "down"
            ) {
                panInfo.action = "home";
                switch_section("home");
                cancelFullscreen();
            }

            if (
                (panInfo.startQuadrant == 2 || panInfo.startQuadrant == 3) &&
                panInfo.direction === "up"
            ) {
                sendEventToBackend("x");
                console.log('x');
            }

            if (
                (panInfo.startQuadrant == 1 || panInfo.startQuadrant == 2) &&
                panInfo.direction === "right"
            ) {
                panInfo.action = "play_random";
                if (files.length > 0) play_video("random");
            }

            if (
                (panInfo.startQuadrant == 1 || panInfo.startQuadrant == 2) &&
                panInfo.direction === "left"
            ) {
                panInfo.action = "play_last";
                if (files.length > 0) play_video("last");
            }
        } else {
            panInfo.gestureType = "pan";

            if (seeking == true && startplaying == false) {
                let set_time = Math.round(video_el.duration * (new_time / 100));
                console.log(
                    set_time,
                    video_el.duration,
                    new_time,
                    video_el.offsetHeight,
                    e.center.y
                );
                video_el.currentTime = set_time;
            }
        }
    }

    seeking = false;
});

mc.on("pan", (e) => {
    panInfo.direction = directions[e.offsetDirection];

    if (
        panInfo.startQuadrant > 2 &&
        (panInfo.direction === "left" || panInfo.direction === "right") &&
        startplaying == false
    ) {
        panInfo.action = "seeking";
        seeking = true;

        progress_show();
        let tx = e.deltaX / video_el.offsetWidth;
        new_time =
            video_el.offsetWidth > 500
                ? curr_time + Math.round((tx * 1000) / 3)
                : curr_time + Math.round(tx * 1000) / 7;
        if (new_time > 98) new_time = 98;
        if (new_time < 0) new_time = 0;
        let progress = document.getElementById("progress");
        progress.style.width = `${new_time}%`;
    }

    console.log(panInfo);
});


let tap = new Hammer.Tap({event: "singletap"});
let doubletap = new Hammer.Tap({event: "doubletap", taps: 2});
tap.recognizeWith(doubletap);

mc.add(tap);
mc.add(doubletap);

mc.on("doubletap", function (e) {
    if (e.center.y <= gestureArea.offsetHeight / 2) {
        if (e.center.x <= gestureArea.offsetWidth / 2) {
            if (files.length > 0) play_video("previous");
        } else {
            if (files.length > 0) play_video("next");
        }
    } else {
        toggleFullscreen();
    }
});

mc.on("singletap", function (e) {
    progress_show();
});
