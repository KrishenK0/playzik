const { get_visitor_id } = require('../lib/utils');

export default async function handler(req, res) {
    try {
        get_visitor_id()
        .then(browse => {
            res.json(browse);
        })
        .catch(error => res.status(500).json(error));
    } catch (err) {
        console.log(err);
        res.status(501).send("Unable to scrape.");
    }
}
