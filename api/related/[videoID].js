const { reqNext, reqRelated } = require('../../lib/utils');

export default function handler(req, res) {
    if (req.query.videoID) {
        reqNext(req.headers['x-goog-visitor-id'], req.query.videoID)
            .then(response => {
                if (response.content[1]) {
                    reqRelated(req.headers['x-goog-visitor-id'], response.content[1].browseId)
                        .then(content => res.json(content))
                        .catch(error => res.status(400).json(error))
                } else res.status(400).json({ code: 400, error: { msg: 'No browse ID found' } })
            })
            .catch(error => res.status(400).json(error));
    } else res.status(400).end("Internal Server Error");
}