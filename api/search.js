const { reqSearch, reqSuggestion } = require('../lib/utils');

export default function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.query.suggestion || req.query.suggestion == '')
        reqSuggestion(req.headers['x-goog-visitor-id'], req.query.suggestion ?? '')
            .then(content => res.json(content))
            .catch(error => res.status(error.code).json(error))
    else if (req.query.q || req.query.q == '')
        reqSearch(req.headers['x-goog-visitor-id'], req.query.q)
            .then(content => res.json(content))
            .catch(error => res.status(error.code).json(error))
    else res.status(500).end("Internal Server Error");
}