const { reqNext } = require('../../../lib/utils');

export default function handler(req, res) {
    if (req.query.videoID) {
        reqNext(req.headers['x-goog-visitor-id'], req.query.videoID)
            .then(async response => {
                res.json(await reqNext(req.headers['x-goog-visitor-id'], req.query.videoID, response.radioId));
            })
            .catch(error => res.status(400).json(error));
    } else res.status(400).end("Internal Server Error");
}