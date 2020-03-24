let current_section = previous_section = 'home';
let history = [];
let files = [];
let video_el = document.getElementById('video_player');
let settings_div = document.getElementById('settings');
let ph = null;
let selected_list_item = 0;
let list_items = [];

video_el.autoplay = false;
video_el.volume = 0; 

function switch_section(sname) {
    let sections = ['home', 'files', 'player']

    if (current_section != sname) previous_section = current_section;
    current_section = sname;

    if (sname == 'settings') {
        settings_div.classList.add('settings_visible');
    } else {
        settings_div.classList.remove('settings_visible');

        for (let s of sections) {
            let el = document.getElementById(s);
            if (s == sname) el.style.display = 'block';
            else el.style.display = 'none';
        }

        if (sname == "files") {
            window.setTimeout(function() {
                document.getElementById('files').scrollTop = document.querySelector('#files li.selected').offsetTop;
            }, 0);
        }
    }
}

function toggle_aspect_ratio() {
    if (current_section == "player") {
        let aspect_ratios = ['contain', 'cover', 'fill', 'none'];
        
        let i = aspect_ratios.lastIndexOf(getComputedStyle(video_el).objectFit) + 1;
        if (i >= aspect_ratios.length) i = 0;

        video_el.style.objectFit = aspect_ratios[i];
    }
}

function update_files_list() {
    let files_div = document.getElementById('files_list');

    for (let f = 0; f < files.length; f++) {
        file_item = document.createElement('li');
        file_item.classList.add('file_item');
        file_item.setAttribute('data-id', f);
        file_item.innerText = files[f];
        file_item.addEventListener('click', function () {
            listItems[selected_list_item].classList.remove("selected");
            listItems[f].classList.add("selected");
            listItems[f].classList.add("active");
            play_video('specific', f)
            selected_list_item = f;
            switch_section('player');
        })
        files_div.appendChild(file_item);
    }

    listItems = document.querySelectorAll("#files_list li");
    listItems[0].classList.add("selected");
}

switch_section(current_section);



video_el.addEventListener('loadedmetadata', () => { 
    play();
});

video_el.addEventListener('error', () => { 
    console.log(`Error ${video_el.error.code} with file ${get_from_history().path}; details: ${video_el.error.message}`);
    play_video('next');
});

video_el.addEventListener('ended', () => { 
    play_video('next');
});

video_el.addEventListener('timeupdate', () => {
    let progress = document.getElementById('progress');
    progress.style.width = `${(video_el.currentTime / video_el.duration) * 100}%`
});

function add_to_history(id, time) {
    history.push(
        {
            'id': id,
            'time': time,
            'path': files[id]
        }
    );
}

function progress_hide() {
    let progress = document.getElementById('progress_bar');
    progress.style.opacity = 0;
    progress.style.bottom = `-30px`;
}

function progress_delayed_hide() {
    clearTimeout(ph);
    ph = setTimeout(progress_hide, 1500);
}

function progress_show() {
    let progress = document.getElementById('progress_bar');
    progress.style.display = 'block';
    progress.style.opacity = 100;
    progress.style.bottom = `20px`;
    progress_delayed_hide();
}

function update_history(time = 'rnd') {
    history[history.length - 1].time = time;
}

function get_from_history(back = 0) {
    return history[history.length - (back + 1)]
}

function play_video(method = 'random', custom_vid = 0, custom_start = 0) {
    if (video_el.currentTime) update_history(video_el.currentTime);
    video_el.style.display = 'block';
    progress_show();

    switch(method) {
        case 'first':
            add_to_history(0, 'rnd');
            break;
        case 'specific':
            add_to_history(custom_vid, 'rnd');
            break;
        case 'next':
            if (history.length == 0) add_to_history(0, 'rnd');
            else add_to_history((get_from_history().id == files.length - 1) ? 0 : get_from_history().id + 1, 'rnd');
            break;
        case 'previous':
            if (history.length == 0) add_to_history(files.length - 1, 'rnd');
            else add_to_history((get_from_history().id == 0) ? files.length - 1 : get_from_history().id - 1, 'rnd');
            break;
        case 'random':
            add_to_history(Math.floor(Math.random()*files.length), 'rnd');
            break;
        case 'last':
            if (history.length == 0) add_to_history(Math.floor(Math.random()*files.length), 'rnd');
            history.push(history.splice(history.length - 2, 1)[0]);
            break;
        default:
    }

    console.log(`Playing video ${get_from_history().id + 1} of ${files.length} (${get_from_history().path})`);

    let allElements = Array.from(document.querySelectorAll('#files_list li.active'))
    for (let element of allElements) {
        element.classList.remove('active')
    }

    let allsElements = Array.from(document.querySelectorAll('#files_list li.selected'))
    for (let element of allsElements) {
        element.classList.remove('selected')
    }

    document.querySelector(`[data-id='${get_from_history().id}']`).classList.add('active');
    document.querySelector(`[data-id='${get_from_history().id}']`).classList.add('selected');

    selected_list_item = get_from_history().id;

    video_el.src = `http://localhost:3001/video/?f=${encodeURIComponent(get_from_history().path)}`;
    video_el.load();
}

function scan() {
    return fetch('/files')
    .then((response) => {
        return response.json();
      })
      .then((data) => {
        files = data.files;
        if (files.length > 0) update_files_list();
        document.getElementById('num_files').innerText = `${files.length}${(data.scan_status == 'scanning') ? ' (Still scanning)' : ''}`;
        return data;
      });
}

function play() {
    video_el.style.display = 'block'
    video_el.play();
    let vidfile = get_from_history();
    let curtime = (vidfile.time == 'rnd') ? Math.floor(Math.random() * video_el.duration + 30) : vidfile.time;
    video_el.currentTime = curtime ;
};



addEvent(document, "keydown", function (e) {
    e = e || window.event;
    
    switch(e.keyCode) {
        case 83: // key: s
            switch_section('settings');
            break;
        case 13: // enter key
            if (current_section == "files") {
                listItems[selected_list_item].classList.add("active");
                play_video('specific', selected_list_item)
                switch_section('player');
            }
            break;
        case 27: // escape
            if (current_section == "settings") {
                switch_section(previous_section);
            }
            
            if (current_section == "player") {
                
                video_el.volume = 0; 
                video_el.pause();
                video_el.style.display = "none"
                
                let progress = document.getElementById('progress_bar');
                progress.style.display = 'none';
            }

            switch_section('home');
            break;
        // case 34: // key: pagedown
        //     if (current_section == "files" && selected_list_item < listItems.length) {
        //         i = selected_list_item;
        //         while((listItems[i].offsetTop + listItems[i].offsetHeight) <= (document.getElementById('files').offsetHeight + document.getElementById('files').scrollTop)) {
        //             if (i == listItems.length - 1) break;
        //             else i++;
        //         }
                
        //         window.setTimeout(function() {
        //             listItems[selected_list_item].remove("selected");
        //             listItems[i].scrollIntoView();
        //             listItems[i].classList.add("selected"); // Highlight the new element
        //             selected_list_item = i
        //         }, 0);
        //     }
        //     break;
        case 38: // key: up arrow
            if (current_section == "files") {
                // Remove the highlighting from the previous element
                listItems[selected_list_item].classList.remove("selected");
                selected_list_item = selected_list_item > 0 ? --selected_list_item : 0;     // Decrease the counter      
                window.setTimeout(function() {
                    listItems[selected_list_item].scrollIntoView();
                    listItems[selected_list_item].classList.add("selected"); // Highlight the new element
                }, 0);

            }
            break;
        case 40: // key: down arrow
            if (current_section == "files") {
                // Remove the highlighting from the previous element
                listItems[selected_list_item].classList.remove("selected");
                selected_list_item = selected_list_item < listItems.length-1 ? ++selected_list_item : listItems.length-1; // Increase counter 
                window.setTimeout(function() {
                    listItems[selected_list_item].scrollIntoView();
                    listItems[selected_list_item].classList.add("selected");       // Highlight the new element
                }, 0);
            }
            break;
        case 49: // key: 1
            switch_section('home');
            break;
        case 50: // key: 2
            switch_section('files');
            break;
        case 51: // key: 3
            switch_section('player');
            break;
        case 65: // key: a (aspect ratio)
            toggle_aspect_ratio();
            break;
        case 66: // key: b (play previous in sequence)
        if (files.length > 0) {
                switch_section('player');
                play_video('previous');
            }
            break;
        case 72: // key: h (play random)
            if (files.length > 0) {
                switch_section('player');
                play_video('random');
            }
            break;
        case 74: // key: j (rewind)
            if (current_section == "player") {
                progress_show();
                if (video_el.currentTime >= (video_el.duration * .05)) {
                    video_el.currentTime = video_el.currentTime - (video_el.duration * .05);
                } else {
                    video_el.currentTime = 0;
                }
            }
            break;
        case 75: // key: k (fast forward)
            if (current_section == "player") {
                progress_show();
                if (video_el.currentTime < (video_el.duration - (video_el.duration * .05))) {
                    video_el.currentTime = video_el.currentTime + (video_el.duration * .05);
                }
            }
            break;
        case 76: // key: l (play last viewed)
            if (files.length > 0) {
                switch_section('player');
                play_video('last');
            }
            break;
        case 78: // key: n (play next in sequence)
            if (files.length > 0) {
                switch_section('player');
                play_video('next');
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

scan();
