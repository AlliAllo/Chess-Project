const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const router = require('./routes/router.js');
const port = 3001; // Choose any available port

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const corsOptions = {
  origin: 'http://localhost:3000', // The frontend url
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use('/', router);

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle any events related to the chess game here

  // Example: Notify when a player makes a move
  socket.on('chessMove', (moveData) => {
    // Broadcast the move to all connected clients
    io.emit('chessMove', moveData);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

