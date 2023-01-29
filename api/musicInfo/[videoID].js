const { reqSong } = require('../../lib/utils');
const ytdl = require('ytdl-core');

export default function handler(req, res) {
    if (req.params.videoID && ytdl.validateID(req.params.videoID)) {
        reqSong(req.headers['x-goog-visitor-id'], req.params.videoID)
            .then(content => res.json(content))
            .catch(error => res.status(400).json(error))
    } else res.status(400).end("Internal Server Error");
}