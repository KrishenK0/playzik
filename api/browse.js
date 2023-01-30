const { reqBrowse } = require('../lib/utils');

export default async function handler(req, res) {
    if (req.query.continuation) {
        reqBrowse(req.headers['x-goog-visitor-id'], req.query.continuation)
            .then(browse => res.json(browse))
            .catch(error => res.status(500).json(error));
    } else {
        reqBrowse(req.headers['x-goog-visitor-id'])
            .then(browse => {
                reqBrowse(req.headers['x-goog-visitor-id'], browse.continuation).then(nextBrowse => {
                    nextBrowse.items.unshift(...browse.items);
                    res.setHeader('Content-Type', 'application/json');
                    res.json(nextBrowse);
                }).catch(error => res.status(500).json(error));
            })
            .catch(error => res.status(500).json(error));
    }
}