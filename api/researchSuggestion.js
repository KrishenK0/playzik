const { reqSuggestions } = require('../../lib/utils');

export default function handler(req, res) {
    const query = (req.query.q) ? req.query.q : '';
    reqSuggestion(req.headers['x-goog-visitor-id'], query)
        .then(content => res.json(content))
        .catch(error => res.status(200).json(error))
}