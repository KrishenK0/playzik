const { env } = require('dotenv').config();
const express = require('express');
const path = require('path');
const index = require('./routes/index');
const api = require('./routes/api');
const utils = require('./utils');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const request = require('superagent');
const winston = require('winston');
const expressWinston = require('express-winston');


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

const port = process.env.PORT || 8080;

// const mariadb = require('mariadb');
// const { randomUUID } = require('crypto');
// const pool = mariadb.createPool({
//     host: process.env.DB_HOST || '127.0.0.1',
//     user: process.env.DB_USER || 'root',
//     password: process.env.DB_PWD || '',
//     port: 3307,
//     database: 'playzik',
//     connectionLimit: 2,
// });

// pool.getConnection((err, connection) => {
//     console.log(err, connection);
//     if (err) console.log(`[ MariaDB ] Connection ERROR (${err.text})`)
//     if (connection) connection.release();
//     return;
// }).then(async () => {
//     await pool.query('DELETE FROM `rooms_users`');
//     console.log(`[ MariaDB ] Previous active rooms has been reset`);
// });

// view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(express.static(path.join(__dirname, 'public')));
// parsing incoming data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(expressWinston.errorLogger({
    transports: [
        new winston.transports.Console()
    ],
    format: winston.format.combine(
        // Add the message timestamp with the preferred format
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
        // Tell Winston that the logs must be colored
        winston.format.colorize({ all: true }),
        // Define the format of the message showing the timestamp, the level and the message
        winston.format.printf(
            (info) => `${info.timestamp} ${info.level}: ${info.message}`,
        ),

    )
}));
app.use(expressWinston.logger({
    transports: [
        new winston.transports.Console()
    ],
    format: winston.format.combine(
        winston.format.simple(),
        winston.format.timestamp(),
        winston.format.colorize()
    ),
    meta: false,
    msg: "HTTP {{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}",
    colorize: true,
}));




app.use(cors());
app.use(cookieParser());
app.use(sessions({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 1 day
    resave: false
}));

// Websocket
async function createUser(userId, infos) {
    if (!(await pool.query('SELECT * FROM users WHERE googleId = ?', userId)).length) {
        if (!infos) return new Promise((reject) => reject({ error: 'No infos found' }));
        infos.authentication = undefined;
        await pool.query('INSERT INTO `users`(`googleId`, `infos`, `visitorId`) VALUES (?, ?, ?)', [infos.id, infos, await utils.get_visitor_id()]);
    }
    return (await pool.query('SELECT visitorId FROM users WHERE googleId = ?', userId))[0];
}

async function getUserById(userId) {
    return (await pool.query('SELECT * FROM users WHERE googleId = ?', userId)).slice(-1, 1)[0];
}

async function getRoomById(id) {
    return sanitizeRoom((await pool.query('SELECT * FROM rooms WHERE id = ?', parseInt(id))));
}

async function getRoomByUUID(uuid) {
    return sanitizeRoom((await pool.query('SELECT * FROM rooms WHERE uuid = ?', uuid)));
}

async function getRoomInerUserById(roomId) {
    const users = sanitizeRoom((await pool.query('SELECT * FROM `rooms_users` INNER JOIN users ON rooms_users.userId = users.id WHERE roomId = ?', roomId)));
    return Array.isArray(users) ? users : [users];
}

function addSongToRoom(room, content, socket) {
    if (room.content) {
        const songIndex = room.content.items.findIndex(x => x.trackInfo.videoId == content.trackId);
        if (songIndex != -1) {
            room.content.items[songIndex].temp = undefined;
            room.content.items[songIndex].played = undefined;
            room.content.items[songIndex].vote = [socket.id];

            if (room.content.items.find(x => x.temp))
                room.content.items = room.content.items.filter(x => !x.temp || x.trackInfo.videoId == room.player.currentId);


            return pool.query('UPDATE `rooms` SET `content`= ? WHERE id = ?', [room.content, room.id]);
        }
    }


    return utils.reqSong(content.visitorId, content.trackId).then(async response => {
        var sql, values;
        if (!room.content) {
            room.content = { items: [] };
            await utils.reqNext(content.visitorId, content.trackId).then(async radio => {
                await utils.reqNext(content.visitorId, content.trackId, radio.radioId).then(data => {
                    sql = 'UPDATE `rooms` SET `content`= ? WHERE id = ?';
                    data.content.forEach(song => {
                        room.content.items.push({
                            trackInfo: song,
                            requester: 'NAIKU',
                            vote: ['NAIKU'],
                            temp: true,
                        });

                    })
                })
            });
            room.player = { currentId: content.trackId };
            sql = 'UPDATE `rooms` SET `content`= ?, `player`= ? WHERE id = ?';
            values = [room.player, room.id];
        } else {
            if (room.content.items.find(x => x.temp))
                room.content.items = room.content.items.filter(x => !x.temp || x.trackInfo.videoId == room.player.currentId);

            sql = 'UPDATE `rooms` SET `content`= ? WHERE id = ?';
            values = [room.id];
        }

        const payload = {
            trackInfo: response.info,
            requester: content.requester,
            vote: [socket.id],
            temp: content.temp,
        }

        room.content.items[0].temp ? room.content.items.unshift(payload) : room.content.items.push(payload);

        return pool.query(sql, [room.content, ...values]);
    })

}

function sanitizeRoom(room) {
    room = room.filter(k => k !== 'meta');

    Object.values(room).forEach((row, i) => {
        for (const pair of Object.entries(row)) {
            try {
                room[i][pair[0]] = JSON.parse(pair[1]);
            } catch (error) {
                room[i][pair[0]] = pair[1];
            }
        }
    });
    return room.length > 1 ? room : room[0];
}

io.on('connection', (socket) => {
    console.log('[+] Connection ', socket.id);
    socket.emit('reset-room');

    socket.on('update-user', async (infos, userId, callback) => {
        callback(await createUser(userId, infos));
    })

    socket.on('ping-room', async _ => {
        await RoomData.findById(roomId).then(room => {
            if (room.users.find(user => user.socketId === socket.id))
                io.in(socket.id).emit('new-data', room);
        })
    })

    socket.on('create-room', async (userId, callback) => {
        var payload = {
            owner: { id: userId, socketId: socket.id },
            users: [{ id: userId, socketId: socket.id }]
        }
        pool.query('INSERT INTO `rooms`(`infos`, `uuid`) VALUES (?, ?)', [payload, randomUUID()]).then(async status => {
            const room = await getRoomById(status.insertId);
            if (room) {
                await pool.query('INSERT INTO `rooms_users`(`roomId`,`userId`,`isOwner`,`socketId`) VALUES (?,?,?,?)', [room.id, (await getUserById(userId)).id, true, socket.id]);
                console.log('room created\nID :', room.uuid);
                socket.join(room.uuid);
                socket.emit('new-user', await getRoomInerUserById(room.id));
                console.log(`${socket.id} have join the room ${room.uuid}`)
                callback(room.uuid);
            } else console.log('No room found');
        })
    });

    socket.on('join-room', async (userId, roomId, callback) => {
        let room = await getRoomByUUID(roomId)
        if (room && !Array.from(socket.rooms).includes(roomId)) {
            if (room.infos.status && room.infos.status == 'inactive') { // Join an inactive room
                const s = { id: userId, socketId: socket.id };
                room.infos = {};
                room.infos.owner = s;
                room.infos.users = [s];
            } else room.infos.users.push({ id: userId, socketId: socket.id });
            pool.query('UPDATE `rooms` SET `infos`= ? WHERE id = ?', [room.infos, room.id]).then(async status => {
                if (status.affectedRows) {
                    await pool.query('INSERT INTO `rooms_users`(`roomId`,`userId`,`socketId`) VALUES (?,?,?)', [room.id, (await getUserById(userId)).id, socket.id]);
                    socket.join(roomId);
                    console.log(`${socket.id} has joined room ${roomId}`)
                    io.in(roomId).emit('new-data', room);
                    io.in(roomId).emit('new-user', await getRoomInerUserById(room.id));
                    socket.to(room.infos.owner.socketId).emit('force-update-player');
                    callback(true);
                }
            })
        }
    });

    socket.on('send-data', async ({ content, to, sender }) => {
        // console.log({ content, to, sender }, 'send-data');
        if (Array.from(socket.rooms).includes(to) && content.trackId && content.requester) {
            let room = await getRoomByUUID(to);
            if (room) {
                addSongToRoom(room, content, socket).then(async status => {
                    if (status.affectedRows) {
                        io.in(to).emit('new-data', room);
                    }
                })
            }
        }
    });

    socket.on('update-vote', async ({ trackId, to, sender }) => {
        // console.log({ trackId, to, sender }, 'update-vote');
        if (Array.from(socket.rooms).includes(to)) {
            let room = await getRoomByUUID(to);
            if (room) {
                const index = room.content.items.findIndex(track => track.trackInfo.videoId === trackId);
                if (index !== -1) {
                    const userIndex = room.content.items[index].vote.findIndex(user => user === socket.id);
                    (userIndex !== -1) ? room.content.items[index].vote.splice(userIndex, 1) : room.content.items[index].vote.push(socket.id);
                    room.content.items.sort((a, b) => { return b.vote.length - a.vote.length })

                    pool.query('UPDATE `rooms` SET `content`= ? WHERE id = ?', [room.content, room.id]).then(async status => {
                        if (status.affectedRows) {
                            io.in(to).emit('new-data', room);
                        }
                    })
                }
            }
        }
    });

    socket.on('update-player', async ({ player, to }) => {
        // console.log({ player, to }, 'update-player');
        if (Array.from(socket.rooms).includes(to)) {
            let room = await getRoomByUUID(to);
            if (room) {
                if (room.infos.owner.socketId === socket.id) {
                    room.player.currentId = player.currentId;
                    room.player.playing = player.playing;
                    room.player.currentTime = player.currentTime;

                    pool.query('UPDATE `rooms` SET `player`= ? WHERE id = ?', [room.player, room.id]).then(async status => {
                        if (status.affectedRows) {
                            socket.in(to).emit('update-player', room);
                        }
                    })
                }
            }
        }
    });

    socket.on('song-next', async ({ to }, callback) => {
        let room = await getRoomByUUID(to);
        if (room && room.infos.owner.socketId == socket.id) {
            const currentIndex = room.content.items.findIndex(x => x.trackInfo.videoId == room.player.currentId);
            const nextTrackId = room.content.items[currentIndex + 1].trackInfo.videoId;
            room.player = { currentId: nextTrackId };
            room.content.items[currentIndex].played = true;
            room.content.items[currentIndex].temp = undefined;
            room.content.items.filter(x => x.vote.length == 0);
            pool.query('UPDATE `rooms` SET `content`=?, `player`= ? WHERE id = ?', [room.content, room.player, room.id]).then(async status => {
                if (status.affectedRows) {
                    io.in(to).emit('new-data', room);
                    socket.in(to).emit('update-player', room);
                    callback(nextTrackId);
                }
            })
        }
    })

    socket.on('disconnecting', function () {
        var rooms = Array.from(socket.rooms).filter(room => room !== socket.id);
        if (rooms.length > 0) {
            rooms.forEach(async roomId => {
                let room = await getRoomByUUID(roomId);
                if (room) {
                    var sql = 'UPDATE `rooms` SET `infos`= ? WHERE id = ?', params = [];

                    room.infos.users = room.infos.users.filter(user => user.socketId !== socket.id);
                    if (room.content) {
                        room.content.items.forEach((track, i) => room.content.items[i].vote = track.vote.filter(vote => vote !== socket.id));
                        sql = 'UPDATE `rooms` SET `content`= ?, `infos`= ? WHERE id = ?';
                        params = [room.content]
                    }

                    if (room.infos.owner.socketId === socket.id) {
                        if (room.infos.users.length > 0) {
                            room.infos.owner = room.infos.users[0];
                            await pool.query('UPDATE `rooms_users` SET `isOwner`=true WHERE socketId = ?', room.infos.users[0].socketId);
                        }
                        else room.infos = { status: 'inactive' }
                    }

                    pool.query(sql, [...params, room.infos, room.id]).then(async status => {
                        if (status.affectedRows) {
                            await pool.query('DELETE FROM `rooms_users` WHERE socketId = ?', socket.id);
                            console.log(`${socket.id} has disconnected room ${roomId}`);
                            socket.in(roomId).emit('new-user', await getRoomInerUserById(room.id));
                            socket.to(roomId).emit('new-data', room);
                        }
                    })
                }
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