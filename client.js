// Get DOM elements
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');

// WebRTC configuration
const configuration = {
    iceServers: [{
        urls: 'stun:stun.l.google.com:19302'
    }]
};

let pc;
let localStream;

// Start button click handler
startButton.onclick = async () => {
    try {
        // Get local media stream
        localStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
        });
        localVideo.srcObject = localStream;

        // Create peer connection
        pc = new RTCPeerConnection(configuration);

        // Add local stream to peer connection
        localStream.getTracks().forEach(track => {
            pc.addTrack(track, localStream);
        });

        // Listen for remote stream
        pc.ontrack = (event) => {
            if (remoteVideo.srcObject !== event.streams[0]) {
                remoteVideo.srcObject = event.streams[0];
            }
        };

        // Create and send offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const response = await fetch('/offer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sdp: pc.localDescription.sdp,
                type: pc.localDescription.type
            })
        });

        const answer = await response.json();
        await pc.setRemoteDescription(answer);

        startButton.disabled = true;
        stopButton.disabled = false;
    } catch (e) {
        console.error('Error starting WebRTC:', e);
    }
};

// Stop button click handler
stopButton.onclick = () => {
    if (pc) {
        pc.close();
        pc = null;
    }
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    localVideo.srcObject = null;
    remoteVideo.srcObject = null;
    startButton.disabled = false;
    stopButton.disabled = true;
};

// Initialize
stopButton.disabled = true;
