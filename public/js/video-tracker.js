document.addEventListener("DOMContentLoaded", function () {
    const video = document.querySelector("#video_player");

    if (!video) {
        console.warn("No video element found on DOMContentLoaded.");
        return;
    }

    waitForMetadata(video);
});

function waitForMetadata(video) {
    if (video.readyState >= 1) {
        initVideoDebuggingAndTracking(video);
    } else {
        video.addEventListener("loadedmetadata", () => {
            initVideoDebuggingAndTracking(video);
        });
    }
}

function sendEventToBackend(eventType) {
    const video = document.querySelector('#video_player');
    const videoHash = video.getAttribute('data-video-path');

    if (!video || !videoHash) return;

    const currentTime = video.currentTime;

    fetch('http://192.168.1.19:8008/api/v1/video-engagement/event', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            video_hash: videoHash,
            event: eventType,
            time: Math.round(currentTime * 100) / 100 // round to 2 decimals
        })
    }).then(res => res.json())
        .then(data => console.log(`✅ Logged ${eventType} at ${currentTime}s`, data))
        .catch(err => console.error('❌ Error sending event:', err));
}

function initVideoDebuggingAndTracking(video) {
    console.log("✅ Video element found!");
    const videoFile = video.currentSrc || video.src;

    // Extract the hash from the data attribute on the video element
    const videoHash = video.getAttribute('data-video-path');

    if (!videoHash) {
        console.error("⚠️ No video hash found on the video element.");
        return;
    }

    const videoDuration = video.duration;
    const numSegments = 300;
    const watchThresholdPercent = 80;

    const segmentDuration = videoDuration / numSegments;
    const segmentWatchTime = new Array(numSegments).fill(0);
    const segmentWatchCounts = new Array(numSegments).fill(0);

    let lastTime = null;
    const updateInterval = 10 * 1000;

    // console.log(`🔎 Tracking video hash: ${videoHash}`);
    // console.log(`⏱️ Video duration: ${videoDuration.toFixed(2)} seconds`);
    // console.log(`📏 Segment duration: ${segmentDuration.toFixed(2)} seconds per segment`);

    // // ===== Event Listeners =====
    // video.addEventListener("play", () => {
    //     console.log(`▶️ Playing from ${video.currentTime.toFixed(2)}s`);
    // });
    //
    // video.addEventListener("pause", () => {
    //     console.log(`⏸️ Paused at ${video.currentTime.toFixed(2)}s`);
    // });
    //
    // video.addEventListener("seeking", () => {
    //     console.log(`🔄 Seeking... moving to ${video.currentTime.toFixed(2)}s`);
    // });
    //
    // video.addEventListener("seeked", () => {
    //     console.log(`✅ Seek completed. New position: ${video.currentTime.toFixed(2)}s`);
    // });
    //
    // video.addEventListener("waiting", () => {
    //     console.log("⌛ Buffering...");
    // });
    //
    // video.addEventListener("playing", () => {
    //     console.log("▶️ Resumed playback after buffering.");
    // });
    //
    // video.addEventListener("ended", () => {
    //     console.log("🏁 Video ended.");
    //     sendProgressUpdate();
    // });

    video.addEventListener("timeupdate", () => {
        const currentTime = video.currentTime;

        if (lastTime === null) {
            lastTime = currentTime;
            return; // First timeupdate, set baseline
        }

        const segmentIndex = Math.floor((currentTime / videoDuration) * numSegments);

        if (segmentIndex < 0 || segmentIndex >= numSegments) {
            lastTime = currentTime;
            return;
        }

        const deltaTime = currentTime - lastTime;

        if (deltaTime < 0) {
            console.log(`⏪ Rewind detected. Skipping delta...`);
            lastTime = currentTime;
            return;
        }

        if (deltaTime > segmentDuration * 2) {
            console.log(`⏩ Large jump detected (seek?). Skipping delta...`);
            lastTime = currentTime;
            return;
        }

        segmentWatchTime[segmentIndex] += deltaTime;

        const requiredWatchTime = segmentDuration * (watchThresholdPercent / 100);

        if (segmentWatchTime[segmentIndex] >= requiredWatchTime) {
            segmentWatchCounts[segmentIndex]++;
            console.log(`✅ Segment ${segmentIndex} fully watched ${segmentWatchCounts[segmentIndex]} time(s)`);

            segmentWatchTime[segmentIndex] = 0;
        }

        lastTime = currentTime;
    });


    // ===== API Call Function =====
    async function sendProgressUpdate() {
        const watchedSegments = [];

        segmentWatchCounts.forEach((count, index) => {
            if (count > 0) {
                watchedSegments.push({
                    segment: index,
                    timesWatched: count,
                });
            }
        });

        if (watchedSegments.length === 0) {
            console.log("⏱️ No new segments watched since last update.");
            return;
        }

        console.log(`🚀 Sending progress update for video hash: ${videoHash}`);
        console.table(watchedSegments);

        try {
            const response = await fetch('http://192.168.1.19:8008/api/v1/video-engagement-pp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // If you have CSRF protection, add the token here:
                    // 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                body: JSON.stringify({
                    video_hash: videoHash,
                    segments: watchedSegments
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            console.log("✅ Progress update sent successfully:", data);

            // Clear counts after successful update to avoid duplicate counts
            watchedSegments.forEach(({segment}) => {
                segmentWatchCounts[segment] = 0;
            });

        } catch (error) {
            console.error("❌ Error sending progress update:", error);
        }
    }

    // Start periodic progress updates
    setInterval(sendProgressUpdate, updateInterval);
}
