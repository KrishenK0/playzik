const { reqPlaylist } = require('../../lib/utils');

export default function handler(req, res) {
    if (req.query.videoID) {
        reqPlaylist(req.headers['x-goog-visitor-id'], req.query.videoID)
            .then(content => res.json(content))
            .catch(error => res.status(400).json(error))
    } else res.status(400).end("Internal Server Error");
}