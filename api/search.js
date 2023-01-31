const { reqSearch, reqSuggestion } = require('../lib/utils');

export default function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.query.suggestion)
        reqSuggestion(req.headers['x-goog-visitor-id'], req.query.suggestion ?? '')
            .then(content => res.json(content))
            .catch(error => res.status(200).json(error))
    else if (req.query.q)
        reqSearch(req.headers['x-goog-visitor-id'], req.query.q)
            .then(content => res.json(content))
            .catch(error => res.status(400).json(error))
    else res.status(400).end("Internal Server Error");
}