const request = require('superagent');
const tmp = require('tmp');
const fs = require('fs');
const ytdl = require('ytdl-core');
let express = require('express');
const { PassThrough } = require('stream');
let router = express.Router();


router.get('/', (req, res) => {
    res.render('index');
});



router.get('/music/:id', (req, res) => {

    if (!ytdl.validateID(req.params.id)) res.sendStatus(400).end();
    else {
        const id = req.params.id;

        ytdl.getInfo(id, { quality: 'highestaudio' }).then(info => {
            let audioFormats = ytdl.filterFormats(info.formats, 'audioonly')[0];

            // console.log(audioFormats);
            // console.log(audioFormats.url);

            const size = audioFormats.contentLength;
            if (req.headers.range) {
                const range = req.headers.range;
                const parts = range.replace(/bytes=/, '').split('-');
                const partialStart = parts[0];
                const partialEnd = parts[1];

                // TODO: should do it ?
                // const CHUNK_SIZE = 10 ** 6;
                //const start = Number(range.replace(/\D/g, ""));
                //const end = Math.min(start + CHUNK_SIZE, size - 1);
                const start = parseInt(partialStart, 10);
                const end = partialEnd ? parseInt(partialEnd, 10) : size - 1;
                const contentLength = end - start + 1;

                // console.log(start, end, contentLength);
                res.writeHead(206, {
                    'accept-ranges': 'bytes',
                    'content-range': 'bytes ' + start + '-' + end + '/' + size,
                    'content-length': contentLength,
                    'content-type': 'audio/webm',
                });
                request.get(audioFormats.url).query({ 'range': `${start}-${end}` }).pipe(res);
            } else {
                res.writeHead(200, { 'content-length': size, 'content-type': 'audio/webm' });
                request.get(audioFormats.url).pipe(res);
            }
        }).catch(err => {
            res.status(404).send(`404 - ${err.message}`);
        });

    }
});

module.exports = router;