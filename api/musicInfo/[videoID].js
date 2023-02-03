const { reqSong } = require('../../lib/utils');
const ytdl = require('ytdl-core');

// TODO : test the request

export default function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.query.videoID && ytdl.validateID(req.query.videoID)) {
        reqSong(req.headers['x-goog-visitor-id'], req.query.videoID)
            .then(content => res.json(content))
            .catch(error => res.status(error.code).json(error))
    } else res.status(400).end("Internal Server Error");
}