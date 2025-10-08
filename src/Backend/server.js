require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const https = require('https');
const fs = require('fs');
const socketIO = require('socket.io');


const app = express();

// Load certificates if available
let server;
if (process.env.USE_HTTPS === 'true') {
  const options = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH),
  };
  server = https.createServer(options, app);
  console.log('✅ HTTPS mode enabled');
} else {
  server = http.createServer(app);
  console.log('⚠️  Using HTTP (development mode) - not secure!');
}

const io = socketIO(server);

const port = 3001;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ----- MONGODB CONNECTION ----------------------------------- //

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// ------------------------------------------------------------ //


const corsOptions = {
  origin: 'https://localhost:3000', // The frontend url
  credentials: true,
  optionsSuccessStatus: 200,
};

const router = require('./routes/router.js');
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/games');


app.use(cors(corsOptions));
app.use('/', router);
app.use('/auth', authRoutes);
app.use('/games', gameRoutes);

// ----- ENFORCE HTTPS -----
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);


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

