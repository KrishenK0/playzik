const { get_visitor_id } = require('../../lib/utils');

export default function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(200).end();
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    get_visitor_id()
        .then(browse => res.json(browse))
        .catch(error => res.status(500).json(error));
}