// const path = require('path');
// const fs = require('fs');

const ytdl = require('ytdl-core');
const axios = require('axios').default;



exports.Search = () => new Promise((resolve, reject) => {

    const id = '9_gkpYORQLU';
    //const filepath = path.resolve(__dirname, 'info.json');

    ytdl.getInfo(id, { quality: 'highestaudio' }).then(info => {
        // console.log('title:', info.videoDetails.title);
        // console.log('rating:', info.player_response.videoDetails.averageRating);
        // console.log('uploaded by:', info.videoDetails.author.name);
        //const json = JSON.stringify(info, null, 2);

        let audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
        // console.log(audioFormats[0].audioQuality);
        // console.log(`${audioFormats[0].container} (${audioFormats[0].audioCodec})`);
        // console.log(audioFormats[0].url);
        // console.log('Formats with only audio: ' + audioFormats.length);

        console.log(audioFormats[0].url);
        axios.get(audioFormats[0].url, { responseType: 'arraybuffer' }).then(response => {
            const buffer = Buffer.from(response.data, "utf-8");
            resolve(buffer);
        }).catch(err => {
            console.warn(err);
        });
    });
});