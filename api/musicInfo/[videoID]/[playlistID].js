const { reqSongInPlaylist } = require('../../../lib/utils');
const ytdl = require('ytdl-core');

export default function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.query.videoID && ytdl.validateID(req.query.videoID)) {
        reqSongInPlaylist(req.headers['x-goog-visitor-id'], req.query.videoID, req.query.playlistID)
            .then(content => res.json(content))
            .catch(error => res.status(400).json(error))
    } else res.status(400).end("Internal Server Error");
}