const { reqPlaylist } = require('../../lib/utils');

export default function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.query.playlistID) {
        reqPlaylist(req.headers['x-goog-visitor-id'], req.query.playlistID)
            .then(content => res.json(content))
            .catch(error => res.status(400).json(error))
    } else res.status(400).end("Internal Server Error");
}