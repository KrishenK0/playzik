const express = require('express');
const path = require('path');
const index = require('./routes/index');
const cors = require('cors');
const fs = require('fs');

const app = express();
// DEBUG: set a ssl certificat (https)
// const options = {
//     key: fs.readFileSync('./extra/key.pem'),
//     cert: fs.readFileSync('./extra/cert.pem')
// };
// const server = require('https').createServer(option, app);
const server = require('http').createServer(app);

const WebSocket = require('ws');
const wss = new WebSocket.Server({ server: server });

// view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/img', express.static(path.join(__dirname, 'public/img')));

// Websocket
wss.on('connection', function connection(ws) {
    console.log('[+] client connection.');
    ws.send('Welcome new client!');

    ws.on('message', function incoming(message) {
        console.log('Received: %s', message);
        //ws.send('Message received : ' + message);

        // BROADCAST (ignore client sender)
        wss.clients.forEach(function each(client) {
            if(client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(`[BROADCAST] ${client.name} send "${message}" to the server`);
            }
        })
    });
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