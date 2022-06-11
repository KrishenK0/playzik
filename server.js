const { env } = require('dotenv').config();
const express = require('express');
const path = require('path');
const index = require('./routes/index');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const ytdl = require('ytdl-core');

const app = express();
// DEBUG: set a ssl certificat (https)
// const fs = require('fs');
// const options = {
//     key: fs.readFileSync('./extra/key.pem'),
//     cert: fs.readFileSync('./extra/cert.pem')
// };
// const server = require('https').createServer(option, app);
const server = require('http').createServer(app);

const { Server } = require('socket.io');
const io = new Server(server);

// view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(express.static(path.join(__dirname, 'public')));
// parsing incoming data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware
app.use(cors());
app.use(cookieParser());
app.use(sessions({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 1 day
    resave: false
}));


// Websocket
// io.on('connection', (socket) => {
//     console.log('[+] Connection');

//     socket.on('disconnect', () => {
//         console.log('[-] Connection');
//     });

// });

io.on('connection', (socket) => {
    console.log('[+] Connection');
    socket.emit('start', { hello: 'worold' });
});


// Route
app.use('/', index);

app.use((req, res) => {
    res.status(404);

    // respond with html page
    if (req.accepts('html')) {
        res.render('404', { url: req.url });
        return;
    }

    // default to plain-text. send()
    res.type('txt').send('Not found');
});

if (app.get('env') === 'development') {
    app.use((err, req, res) => {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err,
        });
    });
}

app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


server.listen(8080, () => console.log('Listening on port : 8080'));