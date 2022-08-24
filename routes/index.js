const request = require('superagent');
const fs = require('fs');
const ytdl = require('ytdl-core');
let express = require('express');
let cors = require('cors');
const { response } = require('express');
let router = express.Router();


router.get('/', (req, res) => {
    res.render('template');
    // res.render('index', { session: req.session });
});

router.get('/search', (req, res) => {
    res.render('template', { template: 'search' });
});

router.get('/player', (req, res) => {
    res.render('template', { player: 'player' });
});

router.get('/profile', (req, res) => {
    res.render('template', { template: 'profile' });
});


router.get('/api/music/:id', (req, res) => {
    if (req.params.id && ytdl.validateID(req.params.id)) {
        ytdl.getInfo(req.params.id, { quality: 'highestaudio' }).then(info => {
            let audioFormats = ytdl.filterFormats(info.formats, 'audioonly')[0];
            res.json({ url: `http://${req.get('host') + req.originalUrl.replace(/api\//, '')}`, status: res.statusCode, info: audioFormats });
        });
    }
})

router.get('/api/:page', (req, res) => {
    res.status(200);
    res.render('pages/' + req.params.page);
})



router.get('/music/:id', (req, res) => {

    if (!ytdl.validateID(req.params.id)) res.sendStatus(400).end();
    else {
        const id = req.params.id;

        ytdl.getInfo(id, { quality: 'highestaudio' }).then(info => {
            let audioFormats = ytdl.filterFormats(info.formats, 'audioonly')[0];

            // console.log(audioFormats);
            // console.log(audioFormats.url);

            const size = audioFormats.contentLength;
            if (req.headers.range) {
                const range = req.headers.range;
                const parts = range.replace(/bytes=/, '').split('-');
                const partialStart = parts[0];
                const partialEnd = parts[1];

                // TODO: should do it ?
                // const CHUNK_SIZE = 10 ** 6;
                //const start = Number(range.replace(/\D/g, ""));
                //const end = Math.min(start + CHUNK_SIZE, size - 1);
                const start = parseInt(partialStart, 10);
                const end = partialEnd ? parseInt(partialEnd, 10) : size - 1;
                const contentLength = end - start + 1;

                // console.log(start, end, contentLength);
                res.writeHead(206, {
                    'accept-ranges': 'bytes',
                    'content-range': 'bytes ' + start + '-' + end + '/' + size,
                    'content-length': contentLength,
                    'content-type': 'audio/webm',
                });
                request.get(audioFormats.url).query({ 'range': `${start}-${end}` }).pipe(res);
            } else {
                res.writeHead(200, { 'content-length': size, 'content-type': 'audio/webm' });
                request.get(audioFormats.url).pipe(res);
            }
        }).catch(err => {
            res.status(404).send(`404 - ${err.message}`);
        });

    }
});


router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

router.get('/login', (req, res) => {
    res.render('login');
});

router.get('/login/youtube', (req, res) => {
    var { google } = require('googleapis');
    var OAuth2 = google.auth.OAuth2;

    // If modifying these scopes, delete your previously saved credentials
    // at ~/.credentials/youtube-nodejs-quickstart.json
    var SCOPES = ['https://www.googleapis.com/auth/youtube.readonly'];
    var TOKEN_DIR = './.credentials/';
    var TOKEN_PATH = TOKEN_DIR + 'youtube-cred.json';


    // Load client secrets from a local file.
    fs.readFile(TOKEN_DIR + 'client_secret.json', function processClientSecrets(err, content) {
        if (err) {
            console.log('Error loading client secret file: ' + err);
            return;
        }
        // Authorize a client with the loaded credentials, then call the YouTube API.
        authorize(JSON.parse(content), getChannel);
    });



    /**
     * Create an OAuth2 client with the given credentials, and then execute the
     * given callback function.
     *
     * @param {Object} credentials The authorization client credentials.
     * @param {function} callback The callback to call with the authorized client.
     */
    function authorize(credentials, callback) {
        var clientSecret = credentials.web.client_secret;
        var clientId = credentials.web.client_id;
        var redirectUrl = credentials.web.redirect_uris[0];
        var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

        // Check if we have previously stored a token.
        if (req.query.code) {
            oauth2Client.getToken(req.query.code, function (err, token) {
                if (err) {
                    console.log('Error while trying to retrieve access token', err);
                    req.redirect('/login');
                    return;
                }
                oauth2Client.credentials = token;
                storeToken(token);
                // res.redirect('/');
            });
        } else {

            if (req.session.ytoken == undefined) {
                getNewToken(oauth2Client, callback);
            } else {
                oauth2Client.credentials = req.session.ytoken;
                callback(oauth2Client);
            }

        }
    }

    /**
     * Get and store new token after prompting for user authorization, and then
     * execute the given callback with the authorized OAuth2 client.
     *
     * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
     * @param {getEventsCallback} callback The callback to call with the authorized
     *     client.
     */
    function getNewToken(oauth2Client, callback) {
        var authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES
        });
        // console.log('Authorize this app by visiting this url: ', authUrl);
        res.redirect(authUrl);
    }

    /**
     * Store token to disk be used in later program executions.
     *
     * @param {Object} token The token to store to disk.
     */
    function storeToken(token) {
        console.log(token);
        req.session.ytoken = token;
        console.log('Token stored to the session');
        console.log(req.session);
        if (req.session.ytoken.access_token == undefined) throw new Error('Token is not stored');
    }

    /**
     * Lists the names and IDs of up to 10 files.
     *
     * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
     */
    function getChannel(auth) {
        console.log(auth);
        var service = google.youtube('v3');
        service.channels.list({
            auth: auth,
            part: 'snippet,contentDetails,statistics',
            forUsername: 'GoogleDevelopers'
        }, function (err, response) {
            if (err) {
                console.log('The API returned an error: ' + err);
                return;
            }
            var channels = response.data.items;
            if (channels.length == 0) {
                console.log('No channel found.');
            } else {
                console.log('This channel\'s ID is %s. Its title is \'%s\', and ' +
                    'it has %s views.',
                    channels[0].id,
                    channels[0].snippet.title,
                    channels[0].statistics.viewCount);
            }
        });
    }
});

module.exports = router;