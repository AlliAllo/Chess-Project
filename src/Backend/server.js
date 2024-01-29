const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const router = require('./routes/router.js');
const port = 3001; // Choose any available port

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const corsOptions = {
    origin: 'http://localhost:3000', // The frontend url
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use('/', router);


const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

module.exports = server;