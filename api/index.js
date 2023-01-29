
export default async function handler(req, res) {
    if (!req.headers['x-goog-visitor-id']) {
        res.status(401).send('Please provide a valid visitor ID in the "x-goog-visitor-id" header.');
    } else {
        res.status(200).send('Hello, ' + req.headers['x-goog-visitor-id']);
    }
}