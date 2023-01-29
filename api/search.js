const { reqSearch } = require('../lib/utils');

export default function handler(req, res) {
    if (req.query.q) {
        reqSearch(req.headers['x-goog-visitor-id'], req.query.q)
            .then(content => res.json(content))
            .catch(error => res.status(400).json(error))
    } else res.status(400).end("Internal Server Error");
}