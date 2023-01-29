const { reqBrowse } = require('../../lib/utils');

export default function handler(req, res) {
    reqBrowse(req.headers['x-goog-visitor-id'], req.query.continuation)
        .then(browse => res.json(browse))
        .catch(error => res.status(500).json(error));
}