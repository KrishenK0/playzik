const { reqNext, reqLyrics } = require('../../../lib/utils');

export default function handler(req, res) {
    if (req.query.videoID) {
        reqNext(req.headers['x-goog-visitor-id'], req.query.videoID).then(response => {
            reqLyrics(req.headers['x-goog-visitor-id'], response.content[0].browseId)
                .then(content => res.json(content))
                .catch(error => res.status(400).json(error))
        }).catch(error => res.status(400).json(error));
    } else res.status(400).end("Internal Server Error");
}