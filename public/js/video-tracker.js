let _trackingInterval = null;
let _visibilityHandler = null;
let _unloadHandler = null;

function initVideoTracker(video, videoHash, endpoint = '/api/v1/video-engagement') {
    if (!video || !videoHash) {
        console.warn("initVideoTracker: missing video element or hash.");
        return;
    }

    if (_trackingInterval) {
        clearInterval(_trackingInterval);
        _trackingInterval = null;
    }

    if (_visibilityHandler) {
        document.removeEventListener('visibilitychange', _visibilityHandler);
        _visibilityHandler = null;
    }

    if (_unloadHandler) {
        window.removeEventListener('beforeunload', _unloadHandler);
        _unloadHandler = null;
    }

    if (video.readyState >= 1) {
        startTracking(video, videoHash, endpoint);
    } else {
        video.addEventListener("loadedmetadata", () => {
            startTracking(video, videoHash, endpoint);
        });
    }
}

function startTracking(video, videoHash, endpoint) {
    const sessionId = crypto.randomUUID();
    const minRangeDuration = 2; // seconds — filters scrubbing
    const fallbackInterval = 60 * 1000; // flush every 60s during long continuous plays

    let ranges = [];
    let rangeStart = null;

    function closeRange() {
        if (rangeStart === null) return;
        const duration = video.currentTime - rangeStart;
        if (duration >= minRangeDuration) {
            ranges.push([rangeStart, video.currentTime]);
        }
        rangeStart = null;
    }

    function buildPayload() {
        return JSON.stringify({
            video_hash: videoHash,
            session_id: sessionId,
            ranges: ranges,
            duration: video.duration,
        });
    }

    async function flush() {
        if (ranges.length === 0) return;
        const payload = buildPayload();
        ranges = [];
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload,
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
        } catch (error) {
            console.error("Error sending tracking update:", error);
        }
    }

    function flushBeacon() {
        closeRange();
        if (ranges.length === 0) return;
        navigator.sendBeacon(
            endpoint,
            new Blob([buildPayload()], { type: 'application/json' })
        );
        ranges = [];
    }

    // Start a range when playback actually begins (covers initial play, post-pause, post-seek)
    video.addEventListener('playing', () => {
        rangeStart = video.currentTime;
    });

    video.addEventListener('pause', () => {
        closeRange();
        flush();
    });

    // Close range before the jump, new range starts on 'playing' after seek completes
    video.addEventListener('seeking', () => {
        closeRange();
        flush();
    });

    video.addEventListener('ended', () => {
        closeRange();
        flush();
    });

    _visibilityHandler = () => {
        if (document.visibilityState === 'hidden') {
            flushBeacon();
        }
    };

    _unloadHandler = () => flushBeacon();

    document.addEventListener('visibilitychange', _visibilityHandler);
    window.addEventListener('beforeunload', _unloadHandler);

    _trackingInterval = setInterval(() => {
        if (ranges.length > 0) flush();
    }, fallbackInterval);
}
