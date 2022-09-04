const { env } = require('dotenv').config();
const express = require('express');
const path = require('path');
const index = require('./routes/index');
const api = require('./routes/api');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const request = require('superagent');

const app = express();
// DEBUG: set a ssl certificat (https)
// const fs = require('fs');
// const options = {
//     key: fs.readFileSync('./.extra/key.pem'),
//     cert: fs.readFileSync('./.extra/cert.pem')
// };
// const server = require('https').createServer(options, app);
const server = require('http').createServer(app);

const socket = require('socket.io');
const io = socket(server, { cors: { origin: '*', } });

const port = 8080;

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URL, (error) => {
    console.log((!error) ? '[ MONGODB ] Connected successfuly' : error);
});
var Schema = mongoose.Schema;

var UsersData = mongoose.model('UsersData',
    new Schema({
        _id: String,
        rooms: [{ type: 'ObjectId', ref: 'RoomData' }],
    }, { collection: 'users' })
);
var RoomData = mongoose.model('RoomData',
    new Schema({
        owner: {
            id: { type: String, ref: 'UsersData' },
            socketId: String,
        },
        users: [
            {
                id: { type: String, ref: 'UsersData' },
                socketId: String,
            }
        ],
        player: {
            trackId: { type: String },
            currentId: { type: String },
            playing: { type: Boolean },
            currentTime: { type: Number },
        },
        content: [{ type: Object, require: true }],
    }, { collection: 'rooms' })
);

// view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(express.static(path.join(__dirname, 'public')));
// parsing incoming data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(function (req, res, next) {
    let current_datetime = new Date();
    let formatted_date =
        current_datetime.getFullYear() +
        "-" +
        (current_datetime.getMonth() + 1) +
        "-" +
        current_datetime.getDate() +
        " " +
        current_datetime.getHours() +
        ":" +
        current_datetime.getMinutes() +
        ":" +
        current_datetime.getSeconds();
    let method = req.method;
    let url = req.originalUrl;
    let status = res.statusCode;
    let ip = req.headers['x-forwarded-for'] || ((req.socket.remoteAddress === '::1') ? '127.0.0.1' : req.socket.remoteAddress);
    let log = `[${formatted_date}] ${ip} [${req.protocol.toUpperCase()} ${method}] (${req.get('host')}): ${url} ${status}`;
    // console.log(log);
    next();
});



app.use(cors());
app.use(cookieParser());
app.use(sessions({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 1 day
    resave: false
}));

// Websocket

async function createUser(user) {
    if (!await UsersData.findOne({ _id: user._id }))
        return UsersData.create(user);
}

async function createRoom(userId) {

}

io.on('connection', (socket) => {
    console.log('[+] Connection ', socket.id);
    socket.emit('reset-room', null);

    socket.on('update-user', (googleId) => {
        createUser({ _id: googleId });
    })

    socket.on('ping', (data) => {
        console.log(socket, data)
        io.emit('ping', 'PONG');
    })

    socket.on('create-room', (userId, callback) => {
        var data = new RoomData(
            { owner: { id: userId, socketId: socket.id }, users: [{ id: userId, socketId: socket.id }], content: [] }
        );
        data.save((err, room) => {
            if (!err) {
                console.log('room created\nID :', room.id);
                socket.join(room.id);
                callback(room.id);
                console.log(`${socket.id} have join the room ${room.id}`)
            } else console.log(err);
        });
    });

    socket.on('join-room', async (userId, roomId, callback) => {
        await RoomData.findById(roomId).then(room => {
            room.users.push({ id: userId, socketId: socket.id });

            room.save((err, room) => {
                socket.join(room.id);
                socket.to(room.owner.socketId).emit('force-update-player', true);
                console.log(`${socket.id} has joined room ${room.id}`)
                socket.to(room.id).emit('new-data', room);
                callback(true);
            });
        })

    });

    socket.on('send-data', async ({ content, to, sender }) => {
        console.log({ content, to, sender }, 'send-data');

        if (Array.from(socket.rooms).includes(to) && content.trackId && content.requester) {
            await RoomData.findById(to).then(room => {
                request.get(`http://localhost:${port}/api/youtube/musicInfo/${content.trackId}`).then(response => {
                    room.content.push({
                        trackInfo: JSON.parse(response.text).info,
                        requester: content.requester,
                        vote: [socket.id],
                    });
                    room.markModified('content');
                    room.save((err, room) => {
                        io.in(to).emit('new-data', room);
                    });
                })
            })
        }
    });

    socket.on('update-vote', async ({ trackId, to, sender }) => {
        console.log({ trackId, to, sender }, 'update-vote');

        if (Array.from(socket.rooms).includes(to)) {
            await RoomData.findById(to).then(async room => {
                const index = room.content.findIndex(track => track.trackInfo.videoId === trackId);
                if (index !== -1) {
                    const userIndex = room.content[index].vote.findIndex(user => user === socket.id);
                    console.log(room.content[index].vote, userIndex);
                    (userIndex !== -1) ? await room.content[index].vote.splice(userIndex, 1) : await room.content[index].vote.push(socket.id);

                    room.markModified('content');
                    room.save((err, room) => {
                        // console.log(room)
                        io.in(to).emit('new-data', room);
                    });
                }
            })
        }
    });

    socket.on('update-player', async ({ player, to }) => {
        console.log({ player, to }, 'update-player');

        if (Array.from(socket.rooms).includes(to)) {
            await RoomData.findById(to).then(room => {
                if (room.owner.socketId === socket.id) {
                    if (room.content.length === 0) room.player.currentId = 0;

                    room.player.trackId = player.trackId;
                    room.player.playing = player.playing;
                    room.player.currentTime = player.currentTime;

                    room.save((err, room) => {
                        socket.in(to).emit('update-player', room);
                    });
                }
            })
        }
    });

    socket.on('disconnecting', function () {
        var rooms = Array.from(socket.rooms).filter(room => room !== socket.id);
        if (rooms.length > 0) {
            rooms.forEach(roomId => {
                RoomData.findById(roomId).then(room => {
                    room.users = room.users.filter(user => user.socketId !== socket.id);
                    if (room.ownerId === socket.id) room.ownerId = room.users[0];
                    room.save((err, room) => {
                        socket.in(roomId).emit('new-data', room);
                    });
                })
            })
        }
    });


    socket.on('disconnect', _ => {
        console.log('[-] Disconnection ', socket.id);
    })
});


// Route
app.use('/', index);
app.use('/api', api);

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


server.listen(port, () => console.log(`Listening on port : ${port}`));