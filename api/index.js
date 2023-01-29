const ytdl = require('ytdl-core');
let express = require('express');
let router = express.Router();
const utils = require('../utils');

router.all('/*', async (req, res, next) => {
    if (!req.headers['x-goog-visitor-id']) {
        req.headers['x-goog-visitor-id'] = await utils.get_visitor_id();
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

router.get('/youtube/playlist/:videoID', (req, res) => {
    if (req.params.videoID) {
        utils.reqPlaylist(req.headers['x-goog-visitor-id'], req.params.videoID)
            .then(content => res.json(content))
            .catch(error => res.status(400).json(error))
    } else res.sendStatus(400);

})

router.get('/youtube/album/:videoID', (req, res) => {
    if (req.params.videoID) {
        utils.reqAlbum(req.headers['x-goog-visitor-id'], req.params.videoID)
            .then(content => res.json(content))
            .catch(error => res.status(400).json(error))
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

module.exports = router;