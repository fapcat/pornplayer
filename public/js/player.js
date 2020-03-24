class Player {
    constructor(id) {
        this.video = this.create_video_element(id);
        this.files = [];
        this.history = [];
        this.scan();

        window.addEventListener('resize', () => {
            var viewportwidth;
            var viewportheight;

            // the more standards compliant browsers (mozilla/netscape/opera/IE7) use window.innerWidth and window.innerHeight

            if (typeof window.innerWidth != 'undefined')
            {
                viewportwidth = window.innerWidth,
                viewportheight = window.innerHeight
            }

            // IE6 in standards compliant mode (i.e. with a valid doctype as the first line in the document)

            else if (typeof document.documentElement != 'undefined'
            && typeof document.documentElement.clientWidth !=
            'undefined' && document.documentElement.clientWidth != 0)
            {
                viewportwidth = document.documentElement.clientWidth,
                viewportheight = document.documentElement.clientHeight
            }

            // older versions of IE

            else
            {
                viewportwidth = document.getElementsByTagName('body')[0].clientWidth,
                viewportheight = document.getElementsByTagName('body')[0].clientHeight
            }
            this.video.style.height=viewportheight+'px';
            this.video.style.width=viewportwidth+'px';  
        }, true);


        return this;
    }

    togglefullscreen() {
        let elem = document.querySelector('html');
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
          } else if (elem.mozRequestFullScreen) { /* Firefox */
            elem.mozRequestFullScreen();
          } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
            elem.webkitRequestFullscreen();
          } else if (elem.msRequestFullscreen) { /* IE/Edge */
            elem.msRequestFullscreen();
          }
    }

    toggledanger() {
        this.video.style.display = (this.video.style.display == 'block') ? 'none' : 'block';
        this.video.volume = 0; 
    }

    create_video_element(id) {
        let container = document.querySelector(id);
        let video = document.createElement('video');
        let progress_bar = document.createElement('div');
        let notification = document.createElement('div');

        // video.style.width = '100%';
        // video.style.height = '100%';  
        video.autoplay = false;
        video.volume = 0; 
        // video.setAttribute("controls","controls");
        video.addEventListener('loadedmetadata', () => { 
            this.play();
        });

        container.appendChild(video);
        return video;
    }

    scan() {
        fetch('/files')
        .then((response) => {
            return response.json();
          })
          .then((data) => {
            this.files = data;
          });
    }

    escape() {
        this.video.style.display = 'none';
        this.video.pause();
        this.video.volume = 0; 
    }

    play_video(method = 'random', custom_start = 0) {
        if (this.video.currentTime) this.update_history(this.video.currentTime);
        this.video.style.display = 'block';

        switch(method) {
            case 'first':
                this.add_to_history(0, 'rnd');
                break;
            case 'next':
                if (this.history.length == 0) this.add_to_history(0, 'rnd');
                else this.add_to_history((this.get_from_history().id == this.files.length - 1) ? 0 : this.get_from_history().id + 1, 'rnd');
                break;
            case 'random':
                this.add_to_history(Math.floor(Math.random()*this.files.length), 'rnd');
                break;
            case 'previous':
                if (this.history.length == 0) this.add_to_history(Math.floor(Math.random()*this.files.length), 'rnd');
                this.history.push(this.history.splice(this.history.length - 2, 1)[0]);
                break;
            default:
        }

        this.video.src = `http://localhost:3001/video/?f=${encodeURIComponent(this.get_from_history().path)}`;
        this.video.load();
    }

    add_to_history(id, time) {
        this.history.push(
            {
                'id': id,
                'time': time,
                'path': this.files[id]
            }
        );
    }

    update_history(time = 'rnd') {
        this.history[this.history.length - 1].time = time;
    }

    get_from_history(back = 0) {
        return this.history[this.history.length - (back + 1)]
    }

    play() {
        this.video.play();
        let vidfile = this.get_from_history();
        console.log(`Playing video ${vidfile.id + 1} of ${this.files.length} (${vidfile.path})`);
        let curtime = (vidfile.time == 'rnd') ? Math.floor(Math.random() * this.video.duration + 30) : vidfile.time;
        this.video.currentTime = curtime ;
    };

    ff() {
        if (this.video.currentTime < (this.video.duration - 60)) {
            this.video.currentTime = this.video.currentTime + 60;
            // noti(Math.floor((video.currentTime / video.duration) * 100) + "%" + " >>>", 1000);
        } else {
            // noti(Math.floor((video.currentTime / video.duration) * 100) + "%" + " >>|", 1000);
        }
    }

    rw() {
        if (this.video.currentTime > 90) {
            this.video.currentTime = this.video.currentTime - 60;
            // noti("<<< " + Math.floor((video.currentTime / video.duration) * 100) + "%", 1000);
        } else {
            // noti("|<< " + Math.floor((video.currentTime / video.duration) * 100) + "%", 1000);
        }
    }

    action(name) {
        console.log(`action: ${name}`);

        switch(name) {
            case 'play_first':
                this.play_video('first');
                break;
            case 'play_next':
                this.play_video('next');
                break;
            case 'play_random':
                this.play_video('random');
                break;
            case 'play_previous':
                this.play_video('previous');
                break;
            case 'rewind':
                this.rw();
                break;
            case 'fastforward':
                this.ff();
                break;
            case 'escape':
                this.toggledanger();
                break;
            case 'fullscreen':
                this.togglefullscreen();
                break;
            case 'show_list':
                window.location.href = '/list'
                break;
            default:
        }
    }
}