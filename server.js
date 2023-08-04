'use strict'

// SETUP

const { v4: uuidV4 } = require('uuid');

const express = require("express");
const app = express();
app.use(express.static("public"));

const http = require("http").createServer(app);

const port = process.env.PORT || 8080;

const server = app.listen(port);
console.log("Server is running on http://localhost:" + port);

const io = require("socket.io")().listen(server);

const ejs = require('ejs');

app.set("views", __dirname + '/views');

app.engine('.html', ejs.__express);
app.set('view-engine', 'html');

app.use(express.static(__dirname + '/public'));

let peers = {};
const rooms = new Map()


// SERVER CODE


function main() {
  setupSocketServer();

  setInterval(function () {
    // update all clients of positions
    io.sockets.emit("positions", peers);
  }, 10);
}

main();

function setupSocketServer() {
  // Set up each socket connection
  io.on("connection", (socket) => {
    console.log(
      "Peer joined with ID",
      socket.id,
      ". There are " +
      io.engine.clientsCount +
      " peer(s) connected."
    );

    //Add a new client indexed by their socket id
    peers[socket.id] = {
      position: [0, 0.5, 0],
      rotation: [0, 0, 0, 1], // stored as XYZW values of Quaternion
    };

    // Make sure to send the client their ID and a list of ICE servers for WebRTC network traversal
    socket.emit(
      "introduction",
      Object.keys(peers)
    );

    // also give the client all existing clients positions:
    socket.emit("userPositions", peers);

    //Update everyone that the number of users has changed
    io.emit(
      "newUserConnected",
      socket.id
    );

    // whenever the client moves, update their movements in the clients object
    socket.on("move", (data) => {
      if (peers[socket.id]) {
        peers[socket.id].position = data[0];
        peers[socket.id].rotation = data[1];
      }
    });

    // Relay simple-peer signals back and forth
    socket.on("signal", (to, from, data) => {
      if (to in peers) {
        io.to(to).emit("signal", to, from, data);
      } else {
        console.log("Peer not found!");
      }
    });

    //Handle the disconnection
    socket.on("disconnect", () => {
      //Delete this client from the object
      delete peers[socket.id];
      io.sockets.emit(
        "userDisconnected",
        io.engine.clientsCount,
        socket.id,
        Object.keys(peers)
      );
      console.log(
        "User " +
        socket.id +
        " diconnected, there are " +
        io.engine.clientsCount +
        " clients connected"
      );
    });

    // create Room
    socket.on('createRoom', async (callback) => {
      const roomId = uuidV4()
      await socket.join(roomId)
      if (!rooms.get(roomId)) {
        rooms.set(roomId, {
          roomId,
          players: [{ id: socket.id}],
          online: 0,
        });
        callback(roomId);
      }
      else {
        rooms.get(roomId).players.push({id: socket.id})
      }
    });
    // join room
    socket.on('joinRoom', async (args, callback) => {
      const room = rooms.get(args.roomId)
      let error, message;
      if (!room) {
        error = true
        message = 'room does not exist'
      }
      else if (room.online == 0) {
        error = true
        message = 'room is empty'
      }
      else if (room.online >= 2) {
        error = true
        message = 'room is full'
      }
      if (error) {
        if (callback) {
          callback({
            error, message
          })
        }
        return
      }
      await socket.join(args.roomId)
      const roomUpdate = {
        ...room,
        players: [
          ...room.players,
          { id: socket.id, username: socket.data?.username },
        ],
      };
      room.online += 1
  
      rooms.set(args.roomId, roomUpdate);
  
      callback(roomUpdate); // respond to the client with the room details.
  
      // emit an 'opponentJoined' event to the room to tell the other player that an opponent has joined
      socket.to(args.roomId).emit('opponentJoined', roomUpdate);
    });
  });
}


/////////////////////
//////ROUTER/////////
/////////////////////


app.get('/', (req, res) => {
  //res.render('index.html')
  res.render('arena.html')
})

/* 
COMMENTED OUT FOR DEV PURPOSES
REINSTATE LATER 


app.get('/arena', (req, res) => {

	res.render('arenaMenu.html');

});

app.get('/arena/:id', (req, res) => {
  const roomId = req.params.id
  if (rooms.get(roomId) && rooms.has(roomId) && rooms.get(roomId).online+1 <= 2) {
    rooms.get(roomId).online += 1
    res.render('arena.html')
  }
  else {
    // room full or does not exist page
    res.render('404.html')
  }
});
*/

app.get('/*', (req, res) => {

	res.render('404.html');

});