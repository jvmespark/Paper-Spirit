

// socket.io
let mySocket;

// array of connected clients
let peers = {};

// Variable to store our three.js scene:
let glScene;

// set video width / height / framerate here:
const videoWidth = 80;
const videoHeight = 60;
const videoFrameRate = 15;

// Our local media stream (i.e. webcam and microphone stream)
let localMediaStream = null;

// Constraints for our local audio/video stream
let mediaConstraints = {
  audio: true,
  video: {
    width: videoWidth,
    height: videoHeight,
    frameRate: videoFrameRate,
  },
};

////////////////////////////////////////////////////////////////////////////////
// Start-Up Sequence:
////////////////////////////////////////////////////////////////////////////////

window.onload = async () => {
  console.log("Window loaded.");

  // first get user media
  localMediaStream = await getMedia(mediaConstraints);

  //createLocalVideoElement();

  // then initialize socket connection
  initSocketConnection();

  // finally create the threejs scene
  console.log("Creating three.js scene...");
  glScene = new Scene(onPlayerMove);
};

////////////////////////////////////////////////////////////////////////////////
// Local media stream setup
////////////////////////////////////////////////////////////////////////////////

// https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
async function getMedia(_mediaConstraints) {
  let stream = null;

  try {
    stream = await navigator.mediaDevices.getUserMedia(_mediaConstraints);
  } catch (err) {
    console.log("Failed to get user media!");
    console.warn(err);
  }

  return stream;
}

////////////////////////////////////////////////////////////////////////////////
// Socket.io
////////////////////////////////////////////////////////////////////////////////

// establishes socket connection
function initSocketConnection() {
  console.log("Initializing socket.io...");
  mySocket = io();

  mySocket.on("connect", () => {
    console.log("My socket ID:", mySocket.id);
  });

  //On connection server sends the client his ID and a list of all keys
  mySocket.on("introduction", (otherClientIds) => {

    // for each existing user, add them as a client and add tracks to their peer connection
    for (let i = 0; i < otherClientIds.length; i++) {
      if (otherClientIds[i] != mySocket.id) {
        let theirId = otherClientIds[i];

        console.log("Adding client with id " + theirId);
        peers[theirId] = {};

        let pc = createPeerConnection(theirId, true);
        peers[theirId].peerConnection = pc;

        //createClientMediaElements(theirId);

        glScene.addClient(theirId);

      }
    }
  });

  // when a new user has entered the server
  mySocket.on("newUserConnected", (theirId) => {
    if (theirId != mySocket.id && !(theirId in peers)) {
      console.log("A new user connected with the ID: " + theirId);

      console.log("Adding client with id " + theirId);
      peers[theirId] = {};

      //createClientMediaElements(theirId);

      glScene.addClient(theirId);
    }
  });

  mySocket.on("userDisconnected", (clientCount, _id, _ids) => {
    // Update the data from the server

    if (_id != mySocket.id) {
      console.log("A user disconnected with the id: " + _id);
      glScene.removeClient(_id);
      //removeClientVideoElementAndCanvas(_id);
      delete peers[_id];
    }
  });

  mySocket.on("signal", (to, from, data) => {
    // console.log("Got a signal from the server: ", to, from, data);

    // to should be us
    if (to != mySocket.id) {
      console.log("Socket IDs don't match");
    }

    // Look for the right simplepeer in our array
    let peer = peers[from];
    if (peer.peerConnection) {
      peer.peerConnection.signal(data);
    } else {
      console.log("Never found right simplepeer object");
      // Let's create it then, we won't be the "initiator"
      // let theirSocketId = from;
      let peerConnection = createPeerConnection(from, false);

      peers[from].peerConnection = peerConnection;

      // Tell the new simplepeer that signal
      peerConnection.signal(data);
    }
  });

  // Update when one of the users moves in space
  mySocket.on("positions", (_clientProps) => {
    glScene.updateClientPositions(_clientProps);
  });
}

////////////////////////////////////////////////////////////////////////////////
// Clients / WebRTC
////////////////////////////////////////////////////////////////////////////////

// this function sets up a peer connection and corresponding DOM elements for a specific client
function createPeerConnection(theirSocketId, isInitiator = false) {
  console.log('Connecting to peer with ID', theirSocketId);
  console.log('initiating?', isInitiator);

  let peerConnection = new SimplePeer({ initiator: isInitiator })
  // simplepeer generates signals which need to be sent across socket
  peerConnection.on("signal", (data) => {
    // console.log('signal');
    mySocket.emit("signal", theirSocketId, mySocket.id, data);
  });

  // When we have a connection, send our stream
  peerConnection.on("connect", () => {
    // Let's give them our stream
    peerConnection.addStream(localMediaStream);
    console.log("Send our stream");
  });

  // Stream coming in to us
  peerConnection.on("stream", (stream) => {
    console.log("Incoming Stream");

    //updateClientMediaElements(theirSocketId, stream);
  });

  peerConnection.on("close", () => {
    console.log("Got close event");
    // Should probably remove from the array of simplepeers
  });

  peerConnection.on("error", (err) => {
    console.log(err);
  });

  return peerConnection;
}

// temporarily pause the outgoing stream
function disableOutgoingStream() {
  localMediaStream.getTracks().forEach((track) => {
    track.enabled = false;
  });
}
// enable the outgoing stream
function enableOutgoingStream() {
  localMediaStream.getTracks().forEach((track) => {
    track.enabled = true;
  });
}

////////////////////////////////////////////////////////////////////////////////
// Three.js
////////////////////////////////////////////////////////////////////////////////

function onPlayerMove() {
  // console.log('Sending movement update to server.');
  mySocket.emit("move", glScene.getPlayerPosition());
}