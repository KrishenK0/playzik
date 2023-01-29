const { reqBrowse } = require('../lib/utils');

export default async function handler(req, res) {
    try {
        reqBrowse(req.headers['x-goog-visitor-id'])
        .then(browse => {
            reqBrowse(req.headers['x-goog-visitor-id'], browse.continuation).then(nextBrowse => {
                nextBrowse.items.unshift(...browse.items);
                res.setHeader('Content-Type', 'application/json');
                res.json(nextBrowse);
            }).catch(error => res.status(500).json(error));
        })
        .catch(error => res.status(500).json(error));
    } catch (err) {
        console.log(err);
        res.status(501).send("Unable to scrape.");
    }
}