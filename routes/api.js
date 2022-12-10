const ytdl = require('ytdl-core');
let express = require('express');
let router = express.Router();
const utils = require('../utils');


router.all('/*', (req, res, next) => {
    if (!req.headers['x-goog-visitor-id']) {
        req.headers['x-goog-visitor-id'] = utils.get_visitor_id();
        // res.sendStatus(400);
        // return;
    }
    next();
});

router.get('/utils/img2base64', (req, res) => {
    if (req.query.url) {
        utils.reqImg2Base64(req.query.url)
            .then(async response => {
                res.json(response);
            }).catch(error => res.status(400).json(error));
    } else res.sendStatus(400);
})

router.get('/musicInfo/:id', (req, res) => {
    if (req.params.id && ytdl.validateID(req.params.id)) {
        ytdl.getInfo(req.params.id, { quality: 'highestaudio' }).then(info => {
            let audioFormats = ytdl.filterFormats(info.formats, 'audioonly')[0];
            res.json({ url: `http://${req.get('host') + req.originalUrl.replace(/api\//, '')}`, status: res.statusCode, format: audioFormats, info: info });
        });
    }
})

router.get('/youtube/musicInfo/:videoID/:playlistID', async (req, res) => {
    if (req.params.videoID && ytdl.validateID(req.params.videoID)) {
        utils.reqSongInPlaylist(req.headers['x-goog-visitor-id'], req.params.videoID, req.params.playlistID)
            .then(content => res.json(content))
            .catch(error => res.status(400).json(error))
    } else res.sendStatus(400);
})

router.get('/youtube/musicInfo/:videoID', async (req, res) => {
    if (req.params.videoID && ytdl.validateID(req.params.videoID)) {
        utils.reqSong(req.headers['x-goog-visitor-id'], req.params.videoID)
            .then(content => res.json(content))
            .catch(error => res.status(400).json(error))
    } else res.sendStatus(400);
})


router.get('/youtube/researchSuggestion', async (req, res) => {
    const query = (req.query.q) ? req.query.q : '';
    utils.reqSuggestion(req.headers['x-goog-visitor-id'], query)
        .then(content => res.json(content))
        .catch(error => res.status(200).json(error))
})

router.get('/youtube/search', async (req, res) => {
    if (req.query.q) {
        utils.reqSearch(req.headers['x-goog-visitor-id'], req.query.q)
            .then(content => res.json(content))
            .catch(error => res.status(400).json(error))
    } else res.sendStatus(400);
})

router.get('/youtube/lyrics/:videoID', (req, res) => {
    if (req.params.videoID) {
        utils.reqNext(req.headers['x-goog-visitor-id'], req.params.videoID).then(response => {
            utils.reqLyrics(req.headers['x-goog-visitor-id'], response.content[0].browseId)
                .then(content => res.json(content))
                .catch(error => res.status(400).json(error))
        }).catch(error => res.status(400).json(error));
    } else res.sendStatus(400);

})

router.get('/youtube/related/:videoID', async (req, res) => {
    if (req.params.videoID) {
        utils.reqNext(req.headers['x-goog-visitor-id'], req.params.videoID)
            .then(response => {
                if (response.content[1]) {
                    utils.reqRelated(req.headers['x-goog-visitor-id'], response.content[1].browseId)
                        .then(content => res.json(content))
                        .catch(error => res.status(400).json(error))
                } else res.status(400).json({ code: 400, error: { msg: 'No browse ID found' } })
            })
            .catch(error => res.status(400).json(error));
    } else res.sendStatus(400);
})

router.get('/youtube/next/:videoID', async (req, res) => {
    if (req.params.videoID) {
        utils.reqNext(req.headers['x-goog-visitor-id'], req.params.videoID)
            .then(response => res.json(response))
            .catch(error => res.status(400).json(error));
    } else res.sendStatus(400);
})

router.get('/youtube/nextSong/:videoID', async (req, res) => {
    if (req.params.videoID) {
        utils.reqNext(req.headers['x-goog-visitor-id'], req.params.videoID)
            .then(async response => {
                res.json(await reqNext(req.headers['x-goog-visitor-id'], req.params.videoID, response.radioId));
            })
            .catch(error => res.status(400).json(error));
    } else res.sendStatus(400);
})

router.get('/youtube/browse', async (req, res) => {
    utils.reqBrowse(req.headers['x-goog-visitor-id'])
        .then(browse => {
            utils.reqBrowse(req.headers['x-goog-visitor-id'], browse.continuation).then(nextBrowse => {
                nextBrowse.items.unshift(...browse.items);
                res.json(nextBrowse);
            }).catch(error => res.status(500).json(error));
        })
        .catch(error => res.status(500).json(error));
})

router.get('/youtube/browse/:continuation', async (req, res) => {
    utils.reqBrowse(req.headers['x-goog-visitor-id'], req.params.continuation)
        .then(browse => res.json(browse))
        .catch(error => res.status(500).json(error));
})


// function get_authorization(cookie) {
//     var crypto = require('crypto');

//     const auth = cookie.match(/(?<=__Secure-3PAPISID=).*?(?=;)/)[0] + "https://music.youtube.com";
//     var shasum = crypto.createHash('sha1');
//     const unix_timestamp = Math.floor(new Date() / 1000);
//     shasum.update((unix_timestamp + ' ' + auth), 'utf-8');
//     return "SAPISIDHASH " + unix_timestamp + "_" + shasum.digest('hex');
// }


// DEBUG: if it's illegal
/*
router.get('/api/myPlaylist', (req, res) => {
    const authorization = req.headers.authorization;
    if (authorization) {
        if (req.query.key) {
            utils.request.get('https://youtube.googleapis.com/youtube/v3/playlists?part=id%2C%20snippet%2C%20contentDetails%2C%20status&mine=true&maxResults=50')
                .query({ 'key': req.query.key }).set('Accept', 'application/json').set('Authorization', authorization).type('json').then(response => {
                    const output = JSON.parse(JSON.stringify(response.body));
                    res.json(
                        {
                            url: `http://${req.get('host') + req.originalUrl.replace(/api\//, '')}`,
                            status: res.statusCode,
                            pageInfo: output.pageInfo,
                            nextPageToken: output.nextPageToken,

                            items: [...output.items].map(x => new Object({
                                'id': x.id,
                                'privacyStatus': x.status.privacyStatus,
                                'title': x.snippet.title,
                                'description': x.snippet.description,
                                'channelTitle': x.snippet.channelTitle,
                                'publishAt': x.snippet.videoPublishedAt,
                                'itemCount': x.contentDetails.itemCount,
                                'thumbnail': Object.assign(x.snippet.thumbnails.standard || x.snippet.thumbnails.high, { isLoaded: false }),
                            }))
                        }
                    );
                }).catch(error => {
                    res.status(500).json(error)
                });
        } else res.sendStatus(400);

    } else res.sendStatus(400);
})

router.get('/api/ListKeyword', (req, res) => {
    const keywords = req.query.q ? req.query.q : 'rap';
    if (req.query.key) {
        utils.request.get('https://youtube.googleapis.com/youtube/v3/search?part=id%2C%20snippet&maxResults=50&regionCode=FR&type=playlist%2C%20channel%2C%20video&videoDimension=2d')
            .query({ 'key': req.query.key, 'q': keywords }).set('Accept', 'application/json').type('json').then(response => {
                const output = JSON.parse(JSON.stringify(response.body));
                const items = {
                    info: [...output.items].filter(x => x.snippet.liveBroadcastContent !== 'live').map(x => new Object({
                        'id': x.id.videoId,
                        'title': x.snippet.title,
                        'description': x.snippet.description,
                        'channelTitle': x.snippet.channelTitle,
                        'publishAt': x.snippet.publishedAt,
                        'thumbnail': { url: `https://i.ytimg.com/vi/${x.id.videoId}/sddefault.jpg`, width: 640, height: 480, isLoaded: false },
                    }))
                }
                console.log(items);
                res.json(
                    {
                        url: `http://${req.get('host') + req.originalUrl.replace(/api\//, '')}`,
                        status: res.statusCode,
                        pageInfo: output.pageInfo,
                        nextPageToken: output.nextPageToken,
                        items: items,
                    }
                );
            }).catch(error => {
                res.status(500).json(error)
            });
    } else res.sendStatus(400);
})

router.get('/api/topList', (req, res) => {
    if (req.query.key) {
        utils.request.get('https://youtube.googleapis.com/youtube/v3/playlistItems?part=id%2C%20snippet%2C%20contentDetails&maxResults=50&playlistId=PL4fGSI1pDJn7bK3y1Hx-qpHBqfr6cesNs')
            .query({ 'key': req.query.key }).set('Accept', 'application/json').type('json').then(response => {
                const output = JSON.parse(JSON.stringify(response.body));
                res.json(
                    {
                        url: `http://${req.get('host') + req.originalUrl.replace(/api\//, '')}`,
                        status: res.statusCode,
                        pageInfo: output.pageInfo,
                        nextPageToken: output.nextPageToken,
                        items: [...output.items].map(x => new Object({
                            'id': x.contentDetails.videoId,
                            'title': x.snippet.title,
                            'description': x.snippet.description,
                            'channelTitle': x.snippet.channelTitle,
                            'publishAt': x.contentDetails.videoPublishedAt,
                            'thumbnail': { url: `https://i.ytimg.com/vi/${x.contentDetails.videoId}/sddefault.jpg`, width: 640, height: 480, isLoaded: false },
                        }))
                    }
                );
            });
    } else {
        res.sendStatus(400);
    }
})

router.get('/api/mostPopular', (req, res) => {
    if (req.query.key) {
        utils.request.get('https://youtube.googleapis.com/youtube/v3/videos?part=id%2C%20snippet%2C%20statistics%2C%20contentDetails&chart=mostPopular&maxResults=50&regionCode=fr&videoCategoryId=10')
            .query({ 'key': req.query.key }).set('Accept', 'application/json').type('json').then(response => {
                const output = JSON.parse(JSON.stringify(response.body));
                // console.log(output.kind);
                // let output = { 
                //     url: `http://${req.get('host') + req.originalUrl.replace(/api\//, '')}`, 
                //     status: res.statusCode, 
                //     info: [...response] 
                // }
                function convertDuration(duration) {
                    const map = new Map(Object.entries(/P(?:(?<days>\d*)D)?T(?:(?<hours>\d*)H)?(?:(?<minutes>\d*)M)?(?:(?<seconds>\d*)S)/.exec(duration)['groups']));
                    var output = map.get('seconds') ? map.get('seconds') : 0;
                    output += (map.get('days') ? map.get('days') : 0) * 86400;
                    output += (map.get('hours') ? map.get('hours') : 0) * 3600;
                    output += (map.get('minutes') ? map.get('minutes') : 0) * 60;
                    return parseInt(output);
                }

                res.json(
                    {
                        url: `http://${req.get('host') + req.originalUrl.replace(/api\//, '')}`,
                        status: res.statusCode,
                        nextPageToken: output.nextPageToken,
                        pageInfo: output.pageInfo,
                        items: [...output.items].map(x => new Object({
                            'id': x.id,
                            'title': x.snippet.title,
                            'description': x.snippet.description,
                            'channelTitle': x.snippet.channelTitle,
                            'publishAt': x.snippet.videoPublishedAt,
                            'thumbnail': { url: `https://i.ytimg.com/vi/${x.id}/sddefault.jpg`, width: 640, height: 480, isLoaded: false },
                            'viewCount': parseInt(x.statistics.viewCount),
                            'duration': convertDuration(x.contentDetails.duration), // ISO 8601 (string) -> seconds (int)

                        })),
                    }
                );
            });
    } else {
        res.sendStatus(400);
    }
})
*/


// router.get('/music/:id', (req, res) => {

//     if (!ytdl.validateID(req.params.id)) res.sendStatus(400).end();
//     else {
//         const id = req.params.id;

//         ytdl.getInfo(id, { quality: 'highestaudio' }).then(info => {
//             let audioFormats = ytdl.filterFormats(info.formats, 'audioonly')[0];

//             // console.log(audioFormats);
//             // console.log(audioFormats.url);

//             const size = audioFormats.contentLength;
//             if (req.headers.range) {
//                 const range = req.headers.range;
//                 const parts = range.replace(/bytes=/, '').split('-');
//                 const partialStart = parts[0];
//                 const partialEnd = parts[1];

//                 // TODO: should do it ?
//                 // const CHUNK_SIZE = 10 ** 6;
//                 //const start = Number(range.replace(/\D/g, ""));
//                 //const end = Math.min(start + CHUNK_SIZE, size - 1);
//                 const start = parseInt(partialStart, 10);
//                 const end = partialEnd ? parseInt(partialEnd, 10) : size - 1;
//                 const contentLength = end - start + 1;

//                 // console.log(start, end, contentLength);
//                 res.writeHead(206, {
//                     'accept-ranges': 'bytes',
//                     'content-range': 'bytes ' + start + '-' + end + '/' + size,
//                     'content-length': contentLength,
//                     'content-type': 'audio/webm',
//                 });
//                 utils.request.get(audioFormats.url).query({ 'range': `${start}-${end}` }).pipe(res);
//             } else {
//                 res.writeHead(200, { 'content-length': size, 'content-type': 'audio/webm' });
//                 utils.request.get(audioFormats.url).pipe(res);
//             }
//         }).catch(err => {
//             res.status(404).send(`404 - ${err.message}`);
//         });

//     }
// });

module.exports = router;