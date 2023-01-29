const { reqImg2Base64 } = require('../../lib/utils');


export default async function handler(req, res) {
    if (req.query.url) {
        reqImg2Base64(req.query.url)
            .then(async response => {
                res.json(response);
            }).catch(error => res.status(400).json(error));
    } else res.status(400).end('Internal Server Error');
}