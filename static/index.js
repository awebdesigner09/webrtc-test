let localStream;
let remoteStream;
let peerConnection;
let socket;
let makingOffer = false;
let polite = false

let connect = async (callback) => {
  let roomName = window.location.pathname.split("/")[1];
  socket = new WebSocket(`ws://localhost:8000/ws/${roomName}"`);
  socket.onopen = async (_) =>  {
    await callback()
  };

  socket.onmessage = handleMessage;
};

let init = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,

  });
  document.getElementById("user-1").srcObject = localStream;
  await connect(createStreams);
}


let createStreams = async () => {
  peerConnection = new RTCPeerConnection(config);
  remoteStream = new MediaStream();

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  // This function is called each time a peer connects.
  peerConnection.ontrack = (event) => {
    console.log("adding track");
    event.streams[0]
      .getTracks()
      .forEach((track) => remoteStream.addTrack(track));
  };

  peerConnection.onicecandidate = async (event) => {
    if (event.candidate) {
      socket.send(
        JSON.stringify({ type: "candidate", candidate: event.candidate })
      );
    }
  };
  peerConnection.onnegotiationneeded = async () => {
    try {
      makingOffer = true;
      await peerConnection.setLocalDescription();
      // signaler.send({ description: pc.localDescription });
      socket.send(
        JSON.stringify({
          type: "OFFER",
          message: peerConnection.localDescription,
        })
      );
    } catch (err) {
      console.error(err);
    } finally {
      makingOffer = false;
    }
  };

  document.getElementById("user-2").srcObject = remoteStream;
};

const config = {
  iceServers: [
    {
      urls: [
        "stun:stun1.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
      ],
    },
  ],
};

localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

peerConnection.ontrack = (event) => {
    console.log("adding track");
    event.streams[0]
      .getTracks()
      .forEach((track) => remoteStream.addTrack(track));
  };

 peerConnection.onicecandidate = async (event) => {
    if (event.candidate) {
      socket.send(
        JSON.stringify({ type: "candidate", candidate: event.candidate })
      );
    }
  };

peerConnection.onnegotiationneeded = async () => {
    try {
      makingOffer = true;
      await peerConnection.setLocalDescription();
      socket.send(
        JSON.stringify({
          type: "OFFER",
          message: peerConnection.localDescription,
        })
      );
    } catch (err) {
      console.error(err);
    } finally {
      makingOffer = false;
    }
  };


let handleMessage = async ({ data }) => {
  data = JSON.parse(data);
  if (data["type"] == "USER_JOIN") {
    polite = true
    createStreams();
  }
  if (data["type"] === "OFFER") {
    console.log("received offer")
    handlePerfectNegotiation(data)
  }
  if (data["type"] === "ANSWER") {
    console.log("received answer")
    handlePerfectNegotiation(data)
  }
  if(data["type"] === "candidate") {
    handleIceCandidate(data)
  }
};

let handlePerfectNegotiation = async ({ message }) => {
  try {
    if (message) {
      const offerCollision =
        message.type === "offer" &&
        (makingOffer || peerConnection.signalingState !== "stable");

      ignoreOffer = !polite && offerCollision;
      if (ignoreOffer) {
        return;
      }

      await peerConnection.setRemoteDescription(message);
      if (message.type === "offer") {
        await peerConnection.setLocalDescription();
        socket.send(JSON.stringify({
          type: "ANSWER",
          message: peerConnection.localDescription,
        }));
      }
    }
  } catch (err) {
    console.error(err);
  }
};

let handleIceCandidate = async ({ candidate }) => {
  if (peerConnection && peerConnection.remoteDescription) {
    peerConnection.addIceCandidate(candidate);
  }
};

document.addEventListener(
  "DOMContentLoaded",
  async function () {
    await init();
  },
  false
);