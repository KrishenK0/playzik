const { reqNext } = require('../../lib/utils');

export default function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.query.videoID) {
        reqNext(req.headers['x-goog-visitor-id'], req.query.videoID)
            .then(response => res.json(response))
            .catch(error => res.status(400).json(error));
    } else res.status(400).end("Internal Server Error");
}