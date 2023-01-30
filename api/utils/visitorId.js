const { reqBrowse, get_visitor_id } = require('../../lib/utils');

export default function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(200).end();
    get_visitor_id()
        .then(browse => res.json(browse))
        .catch(error => res.status(500).json(error));
}