const request = require('superagent');
const fs = require('fs');
const ytdl = require('ytdl-core');
let express = require('express');
let cors = require('cors');
const { response } = require('express');
const { resolve } = require('path');
const { getSystemErrorMap } = require('util');
let router = express.Router();


router.get('/', (req, res) => {
    // res.send({ url: `http://${req.get('host') + req.originalUrl.replace(/api\//, '')}`, status: res.statusCode })
});

let ytheader = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:102.0) Gecko/20100101 Firefox/102.0',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.5',
    'Content-Type': 'application/json',
    'X-Goog-AuthUser': '0',
    'x-Origin': 'https://music.youtube.com',
    'Cookie': "YSC=X6GGDuHZufk; CONSENT=YES+cb.20220628-08-p2.fr+FX+651;",
}

router.get('/musicInfo/:id', (req, res) => {
    if (req.params.id && ytdl.validateID(req.params.id)) {
        ytdl.getInfo(req.params.id, { quality: 'highestaudio' }).then(info => {
            let audioFormats = ytdl.filterFormats(info.formats, 'audioonly')[0];
            res.json({ url: `http://${req.get('host') + req.originalUrl.replace(/api\//, '')}`, status: res.statusCode, format: audioFormats, info: info });
        });
    }
})

router.get('/youtube/musicInfo/:videoID/:playlistID', async (req, res) => {
    if (req.params.videoID && ytdl.validateID(req.params.videoID)) {
        if (!req.session.googleId) req.session.googleId = await get_visitor_id()

        request.post(`https://music.youtube.com/youtubei/v1/player?alt=json&key=AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30`)
            .set(ytheader)
            .set({ 'X-Goog-Visitor-Id': req.session.googleId })
            .send({
                'playlistId': req.params.playlistID,
                'videoId': req.params.videoID,
                'context': { 'client': { 'clientName': 'WEB_REMIX', 'clientVersion': '0.1', 'hl': 'en' }, 'user': {} }
            })
            .then(response => {
                // res.json(sanitizeSearch(JSON.parse(response.text)));
                res.json((JSON.parse(response.text)));
            }).catch(error => {
                res.status(error.status || error.code).json(error);
            })

    } else res.sendStatus(400);
})

router.get('/youtube/musicInfo/:videoID', async (req, res) => {
    if (req.params.videoID && ytdl.validateID(req.params.videoID)) {
        if (!req.session.googleId) req.session.googleId = await get_visitor_id()

        // ytdl.getInfo(req.params.videoID, { quality: 'highestaudio' }).then(info => {
        //     let audioFormats = ytdl.filterFormats(info.formats, 'audioonly')[0];
        //     res.json({ url: `http://${req.get('host') + req.originalUrl.replace(/api\//, '')}`, status: res.statusCode, format: audioFormats, info: info });
        // });

        request.post(`https://music.youtube.com/youtubei/v1/player?alt=json&key=AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30`)
            .set(ytheader)
            .set({ 'X-Goog-Visitor-Id': req.session.googleId })
            .send({
                'videoId': req.params.videoID,
                'context': { 'client': { 'clientName': 'WEB_REMIX', 'clientVersion': '0.1', 'hl': 'en' }, 'user': {} }
            })
            .then(async response => {
                const bestFormat = await getURLVideoID(req.params.videoID);
                // res.json(sanitizeSearch(JSON.parse(response.text)));
                res.json({
                    url: `http://${req.get('host') + req.originalUrl.replace(/api\//, '')}`,
                    status: res.statusCode,
                    format: bestFormat,
                    info: JSON.parse(response.text).videoDetails
                });
            }).catch(error => {
                res.status(error.status || error.code).json(error);
            })

        // res.json(await getURLVideoID(req.params.videoID));
    } else res.sendStatus(400);
})


function getURLVideoID(id) {
    return ytdl.getInfo(id, { quality: 'highestaudio' }).then(info => {
        let audioFormats = ytdl.filterFormats(info.formats, 'audioonly')[0];
        return audioFormats;
    });
}


// router.get('/test', async (req, res) => {
//     const cookie = "_gcl_au=1.1.572287292.1656707887; YSC=LiffpvgoLHY; CONSENT=PENDING+868; SID=LwiOUgI_2R3L6hs0pS1Ob6ukB3SZ-_oBay4KyRqNhqrxZPw8HxskHoJGy-iYQF4sLiHsVQ.; __Secure-1PSID=LwiOUgI_2R3L6hs0pS1Ob6ukB3SZ-_oBay4KyRqNhqrxZPw8HJJoFQ0sQizxhvj6vsGY5A.; __Secure-3PSID=LwiOUgI_2R3L6hs0pS1Ob6ukB3SZ-_oBay4KyRqNhqrxZPw8rQZK0tsYDAgBasdkbPpckA.; HSID=AA6JXKrudHan7UpWb; SSID=A0htVYqnMfvp-zBhb; APISID=qtT-INUxHprJ8yKT/AYmVzNPGL1XiFbBVU; SAPISID=d-IzcnG78ED95xU0/AHekoWUo_oJtPS1lQ; __Secure-1PAPISID=d-IzcnG78ED95xU0/AHekoWUo_oJtPS1lQ; __Secure-3PAPISID=d-IzcnG78ED95xU0/AHekoWUo_oJtPS1lQ; LOGIN_INFO=AFmmF2swRQIhAJIIT19YpX4MiLalczCtkwRVm5naal82UIF5bV9D0XxwAiAm-QHNwyv8oLJ0yyJhnJkLggMDx7MQNYGlMj1qMPnefQ:QUQ3MjNmeHVoOGo0aDB3eEI0aHRMcG5zR21iamRjc1Q2YUlCWXB1bUxzVGlMWE9RRjVDOUlQRTlkZlVYNUlOa2hKLTRZTXhYaDVUYkxwQXg3T3N5Ujl5dnowbmxaaXZuNVFFWjVYclNZczRpZDBzNmVTVVdTbzdvT1BZRGFsTHJXUkFsNU5uN2htLWpheWZTdTR2TlRDeDhSQjhfcFdQOW9R; SIDCC=AJi4QfHtCGuzxIH4cC7q9MqZvnxZjzVo0oqPxJHUpyUMUO_z1pQrSwaEYNuvb-xtFAuQKPQ-; __Secure-1PSIDCC=AJi4QfHC-1fk8MkITFZMp8BhOdVMk3v8N9kbt_wXSj5X-XfOZKCs4A8_d-bcLclq_jDrBg6Ikw; __Secure-3PSIDCC=AJi4QfF1BnlWVmTjiXlNNJCzrY2y1ScdJZHn4tRP3NwsO1SfbGWAKT0RAMlMiYXvn7ta3Orr; __Secure-YEC=Cgs3bUxPYUd4OGNiVSj3uv2VBg%3D%3D";
//     request.post(`https://music.youtube.com/youtubei/v1/search?alt=json&key=AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30`)
//         .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:72.0) Gecko/20100101 Firefox/72.0')
//         .set('Accept', '*/*')
//         .set('Accept-Language', 'en-US,en;q=0.5')
//         .set('Content-Type', 'application/json')
//         .set('X-Goog-AuthUser', '0')
//         .set('x-origin', 'https://music.youtube.com')
//         .set('Cookie', cookie)
//         .set('X-Goog-Visitor-Id', await get_visitor_id())
//         .set('Authorization', get_authorization(cookie))
//         .send({ 'query': 'Just Like You', 'context': { 'client': { 'clientName': 'WEB_REMIX', 'clientVersion': '0.1', 'hl': 'en' }, 'user': {} } })
//         .then(response => {
//             res.json(JSON.parse(response.text))
//         }).catch(error => {
//             console.log(error.response.req._header)
//             res.status(error.status || error.code).json(error);
//         })
// })

router.get('/youtube/researchSuggestion', async (req, res) => {
    if (!req.session.googleId) req.session.googleId = await get_visitor_id()
    const query = (req.query.q) ? req.query.q : '';
    request.post(`https://music.youtube.com/youtubei/v1/music/get_search_suggestions?key=AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30`)
        .set(ytheader)
        .set({ 'X-Goog-Visitor-Id': req.session.googleId })
        .send({ "input": query, 'context': { 'client': { 'clientName': 'WEB_REMIX', 'clientVersion': '0.1', 'hl': 'en' }, 'user': {} } })
        .then(async response => {
            res.json(await sanitizeResearchSuggestion(JSON.parse(response.text)));
        }).catch(error => {
            res.status(error.status || error.code).json(error);
        })

})

function sanitizeResearchSuggestion(datas) {
    return new Promise((resolve, reject) => {
        try {
            if (datas.contents) {
                searchSuggestions = [];
                [...datas.contents[0].searchSuggestionsSectionRenderer.contents].forEach(suggestion => {

                    var searchSuggestion = {
                        suggestion: suggestion.searchSuggestionRenderer.suggestion.runs,
                        query: suggestion.searchSuggestionRenderer.navigationEndpoint.searchEndpoint.query,
                    }

                    searchSuggestions.push(searchSuggestion);

                })

                resolve({ code: 200, 'searchSuggestions': searchSuggestions });

            } else reject({ code: 200, message: 'No suggestion :(' /*, 'searchSuggestions': null */ });
        } catch (error) {
            reject({ code: 500, error: { msg: `Error while parsing (${error})`, content: datas } });
        }
    })
}

router.get('/youtube/search', async (req, res) => {
    if (!req.session.googleId) req.session.googleId = await get_visitor_id()
    if (req.query.q) {

        request.post(`https://music.youtube.com/youtubei/v1/search?alt=json&key=AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30`)
            .set(ytheader)
            .set({ 'X-Goog-Visitor-Id': req.session.googleId })
            .send({ 'query': req.query.q, 'context': { 'client': { 'clientName': 'WEB_REMIX', 'clientVersion': '0.1', 'hl': 'en' }, 'user': {} } })
            .then(response => {
                res.json(sanitizeSearch(JSON.parse(response.text)));
            }).catch(error => {
                res.status(error.status || error.code).json(error);
            })
    } else res.sendStatus(400);
})

function sanitizeSearch(datas) {
    var content = [];
    var SECTIONS = datas.contents.tabbedSearchResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents;

    for (const index in SECTIONS) {
        if (SECTIONS[index].itemSectionRenderer) continue;
        const element = SECTIONS[index].musicShelfRenderer;

        let items = [];
        [...element.contents].forEach(x => {
            const content = x.musicResponsiveListItemRenderer;

            const thumbnails = content.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails;
            let id;

            if (content.playlistItemData)
                id = {
                    browseId: content.playlistItemData.videoId,
                    context: "MUSIC_PAGE_TYPE_SONG"
                };
            else if (content.navigationEndpoint)
                id = {
                    browseId: content.navigationEndpoint.browseEndpoint.browseId,
                    context: content.navigationEndpoint.browseEndpoint.browseEndpointContextSupportedConfigs.browseEndpointContextMusicConfig.pageType
                };

            let label = {
                title: content.flexColumns[0].musicResponsiveListItemFlexColumnRenderer.text.runs[0].text,
                label: [],
            };
            [...content.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs].slice(2).forEach(y => {
                label.label.push(y.text);
            })


            let item = {
                id: id,
                thumbnail: thumbnails,
                labels: label
            }
            items.push(item);
        })


        let section = {
            sectionTitle: element.title.runs[0].text,
            sectionContents: items,
        }

        content.push(section);

    }

    return { 'items': content };
}

router.get('/youtube/lyrics/:videoID', async (req, res) => {
    if (!req.session.googleId) req.session.googleId = await get_visitor_id()
    if (req.params.videoID) {
        reqNext(req.session.googleId, req.params.videoID).then(response => {
            request.post(`https://music.youtube.com/youtubei/v1/browse?alt=json&key=AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30`)
                .set(ytheader)
                .set({ 'X-Goog-Visitor-Id': req.session.googleId })
                .send({ 'browseId': response.content[0].browseId, 'context': { 'client': { 'clientName': 'WEB_REMIX', 'clientVersion': '0.1', 'hl': 'en' }, 'user': {} } })
                .then(async response => {
                    res.json(await sanitizeLyrics(JSON.parse(response.text)));
                }).catch(error => {
                    res.status(error.status || error.code).json(error);
                })
        }).catch(error => res.status(400).json(error));
    } else res.sendStatus(400);

})

router.get('/youtube/related/:videoID', async (req, res) => {
    if (!req.session.googleId) req.session.googleId = await get_visitor_id()
    if (req.params.videoID) {
        reqNext(req.session.googleId, req.params.videoID)
            .then(response => {
                if (response.content[1]) {
                    request.post(`https://music.youtube.com/youtubei/v1/browse?alt=json&key=AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30`)
                        .set(ytheader)
                        .set({ 'X-Goog-Visitor-Id': req.session.googleId })
                        .send({ 'browseId': response.content[1].browseId, 'context': { 'client': { 'clientName': 'WEB_REMIX', 'clientVersion': '0.1', 'hl': 'en' }, 'user': {} } })
                        .then(async response => {
                            res.json(await sanitizeBrowse(JSON.parse(response.text)));
                        }).catch(error => {
                            res.status(error.status || error.code || 400).json(error);
                        })
                } else res.status(400).json({ code: 400, error: { msg: 'No browse ID found' } })
            })
            .catch(error => res.status(400).json(error));
    } else res.sendStatus(400);
})

router.get('/youtube/next/:videoID', async (req, res) => {
    if (!req.session.googleId) req.session.googleId = await get_visitor_id()
    if (req.params.videoID) {
        reqNext(req.session.googleId, req.params.videoID)
            .then(response => res.json(response))
            .catch(error => res.status(400).json(error));
    } else res.sendStatus(400);
})

function reqNext(googleId, videoID) {
    return new Promise((resolve, reject) => {
        if (googleId && videoID) {
            return request.post(`https://music.youtube.com/youtubei/v1/next?alt=json&key=AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30`)
                .set(ytheader)
                .set({ 'X-Goog-Visitor-Id': googleId })
                .send({ 'videoId': videoID, tunerSettingValue: "AUTOMIX_SETTING_NORMAL", 'context': { 'client': { 'clientName': 'WEB_REMIX', 'clientVersion': '0.1', 'hl': 'en', 'visitorData': googleId }, 'user': {} } })
                .then(async response => {
                    resolve(await sanitizeNext(JSON.parse(response.text)));
                }).catch(error => {
                    reject(error);
                })
        } else reject({ error: 'Error: no google/video ID ' });
    })
}

function sanitizeNext(datas) {
    return new Promise((resolve, reject) => {
        try {
            if (datas.contents) {
                tabs = [];
                [...datas.contents.singleColumnMusicWatchNextResultsRenderer.tabbedRenderer.watchNextTabbedResultsRenderer.tabs].forEach(tab => {
                    if (tab.tabRenderer.endpoint) {
                        tabs.push({
                            title: tab.tabRenderer.title,
                            browseId: tab.tabRenderer.endpoint.browseEndpoint.browseId
                        })
                    }
                })

                resolve({ code: 200, 'content': tabs });

            } else reject({ code: 200, message: 'No next :(' /*, 'searchSuggestions': null */ });
        } catch (error) {
            reject({ code: 500, error: { msg: `Error while parsing (${error})`, content: datas } });
        }
    })
}

function sanitizeLyrics(datas) {
    return new Promise((resolve, reject) => {
        try {
            if (datas.contents.sectionListRenderer) {
                content = {};
                [...datas.contents.sectionListRenderer.contents].forEach(lyric => {
                    content.lyrics = lyric.musicDescriptionShelfRenderer.description.runs[0].text;
                    content.footer = lyric.musicDescriptionShelfRenderer.footer.runs[0].text;
                })

                resolve({ code: 200, 'content': content });

            } else reject({
                code: 200,
                'content': {
                    'lyrics': datas.contents.messageRenderer.text.runs[0].text,
                    'footer': datas.contents.messageRenderer.subtext.messageSubtextRenderer.text.runs[0].text
                }
            });
        } catch (error) {
            reject({ code: 500, error: { msg: `Error while parsing (${error})`, content: datas } });
        }
    })
}

router.get('/youtube/browse', async (req, res) => {
    if (!req.session.googleId) req.session.googleId = await get_visitor_id()
    reqBrowse(req.session.googleId)
        .then(browse => {
            reqBrowse(req.session.googleId, browse.continuation).then(nextBrowse => {
                nextBrowse.items.unshift(...browse.items);
                res.json(nextBrowse);
            }).catch(error => res.status(500).json(error));
        })
        .catch(error => res.status(500).json(error));

})

router.get('/youtube/browse/:continuation', async (req, res) => {
    if (!req.session.googleId) req.session.googleId = await get_visitor_id()
    reqBrowse(req.session.googleId, req.params.continuation)
        .then(browse => res.json(browse))
        .catch(error => res.status(500).json(error));
})

function reqBrowse(googleId, continuation) {
    return new Promise((resolve, reject) => {
        if (googleId) {
            req = (continuation) ? `https://music.youtube.com/youtubei/v1/browse?ctoken=${continuation}&continuation=${continuation}&type=next&key=AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30`
                : `https://music.youtube.com/youtubei/v1/browse?alt=json&key=AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30`;
            return request.post(req)
                .set(ytheader)
                .set({ 'X-Goog-Visitor-Id': googleId })
                .send({ 'context': { 'client': { 'clientName': 'WEB_REMIX', 'clientVersion': '0.1', 'hl': 'en', 'visitorData': googleId }, 'user': {} } })
                .then(async response => {
                    resolve(await sanitizeBrowse(JSON.parse(response.text)));
                }).catch(error => {
                    reject(error);
                })
        } else reject({ error: 'Error: no google ID' });
    })
}

function sanitizeBrowse(datas) {
    return new Promise((resolve, reject) => {
        let output = [], SECTIONS, continuation;
        if (datas.continuationContents) {
            SECTIONS = datas.continuationContents.sectionListContinuation.contents;
            if (datas.continuationContents.sectionListContinuation.continuations)
                continuation = datas.continuationContents.sectionListContinuation.continuations[0].nextContinuationData.continuation;
        } else if (datas.contents.sectionListRenderer) {
            SECTIONS = datas.contents.sectionListRenderer.contents;
        } else {
            SECTIONS = datas.contents.singleColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents;
            continuation = datas.contents.singleColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.continuations[0].nextContinuationData.continuation;
        }


        try {
            for (const index in SECTIONS) {
                const element = SECTIONS[index];
                let section;

                for (var k in element) {
                    let items = [], content, thumbnails, id, labels;
                    if (k === 'musicTastebuilderShelfRenderer') continue;

                    if (k != 'musicDescriptionShelfRenderer') {
                        [...element[k].contents].forEach(x => {
                            if (x.musicResponsiveListItemRenderer) {
                                content = x.musicResponsiveListItemRenderer;

                                thumbnails = content.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails;

                                if (content.playlistItemData)
                                    id = {
                                        browseId: content.playlistItemData.videoId,
                                        context: "MUSIC_PAGE_TYPE_SONG"
                                    };
                                else if (content.navigationEndpoint)
                                    id = {
                                        browseId: content.navigationEndpoint.browseEndpoint.browseId,
                                        context: content.navigationEndpoint.browseEndpoint.browseEndpointContextSupportedConfigs.browseEndpointContextMusicConfig.pageType
                                    };

                                labels = [];
                                [...content.flexColumns].forEach(y => {
                                    if (y.musicResponsiveListItemFlexColumnRenderer.text.runs) {
                                        labels.push(y.musicResponsiveListItemFlexColumnRenderer.text.runs.shift().text);
                                    }
                                });
                            } else if (x.musicTwoRowItemRenderer) {
                                content = x.musicTwoRowItemRenderer;
                                thumbnails = content.thumbnailRenderer.musicThumbnailRenderer.thumbnail.thumbnails;
                                id = {};

                                if (content.navigationEndpoint && content.navigationEndpoint.browseEndpoint)
                                    id = {
                                        browseId: content.navigationEndpoint.browseEndpoint.browseId,
                                        context: content.navigationEndpoint.browseEndpoint.browseEndpointContextSupportedConfigs.browseEndpointContextMusicConfig.pageType
                                    };
                                else if (content.navigationEndpoint && content.navigationEndpoint.watchEndpoint)
                                    id = {
                                        browseId: {
                                            videoId: content.navigationEndpoint.watchEndpoint.videoId,
                                            playlistId: content.navigationEndpoint.watchEndpoint.playlistId,
                                        },
                                        context: content.navigationEndpoint.watchEndpoint.watchEndpointMusicSupportedConfigs.watchEndpointMusicConfig.musicVideoType
                                    };

                                labels = {
                                    title: content.title.runs[0].text,
                                    subtitle: [],
                                };
                                [...content.subtitle.runs].forEach(y => {
                                    labels.subtitle.push(y.text);
                                })
                            } else if (x.musicCarouselShelfRenderer) {

                            }

                            let item = {
                                id: id,
                                thumbnail: thumbnails,
                                'labels': labels
                            }
                            items.push(item);
                        })

                        section = {
                            sectionTitle: element[k].header.musicCarouselShelfBasicHeaderRenderer.title.runs[0].text,
                            sectionContext: Object.keys(element[k].contents[0])[0],
                            sectionContents: items,
                        }
                    } else if (k === 'musicDescriptionShelfRenderer') {
                        section = {
                            sectionTitle: element[k].header.runs[0].text,
                            sectionContents: element[k].description.runs[0].text,
                        }
                    }


                    output.push(section);
                }

            }

            resolve({ code: 200, 'items': output, 'continuation': continuation });
        } catch (error) {
            reject({ code: 500, error: { msg: `Error while parsing (${error})`, content: datas } });
        }
    })
}

function get_visitor_id() {
    // const cookie = "_gcl_au=1.1.572287292.1656707887; YSC=LiffpvgoLHY; CONSENT=PENDING+868; SID=LwiOUgI_2R3L6hs0pS1Ob6ukB3SZ-_oBay4KyRqNhqrxZPw8HxskHoJGy-iYQF4sLiHsVQ.; __Secure-1PSID=LwiOUgI_2R3L6hs0pS1Ob6ukB3SZ-_oBay4KyRqNhqrxZPw8HJJoFQ0sQizxhvj6vsGY5A.; __Secure-3PSID=LwiOUgI_2R3L6hs0pS1Ob6ukB3SZ-_oBay4KyRqNhqrxZPw8rQZK0tsYDAgBasdkbPpckA.; HSID=AA6JXKrudHan7UpWb; SSID=A0htVYqnMfvp-zBhb; APISID=qtT-INUxHprJ8yKT/AYmVzNPGL1XiFbBVU; SAPISID=d-IzcnG78ED95xU0/AHekoWUo_oJtPS1lQ; __Secure-1PAPISID=d-IzcnG78ED95xU0/AHekoWUo_oJtPS1lQ; __Secure-3PAPISID=d-IzcnG78ED95xU0/AHekoWUo_oJtPS1lQ; LOGIN_INFO=AFmmF2swRQIhAJIIT19YpX4MiLalczCtkwRVm5naal82UIF5bV9D0XxwAiAm-QHNwyv8oLJ0yyJhnJkLggMDx7MQNYGlMj1qMPnefQ:QUQ3MjNmeHVoOGo0aDB3eEI0aHRMcG5zR21iamRjc1Q2YUlCWXB1bUxzVGlMWE9RRjVDOUlQRTlkZlVYNUlOa2hKLTRZTXhYaDVUYkxwQXg3T3N5Ujl5dnowbmxaaXZuNVFFWjVYclNZczRpZDBzNmVTVVdTbzdvT1BZRGFsTHJXUkFsNU5uN2htLWpheWZTdTR2TlRDeDhSQjhfcFdQOW9R; SIDCC=AJi4QfHtCGuzxIH4cC7q9MqZvnxZjzVo0oqPxJHUpyUMUO_z1pQrSwaEYNuvb-xtFAuQKPQ-; __Secure-1PSIDCC=AJi4QfHC-1fk8MkITFZMp8BhOdVMk3v8N9kbt_wXSj5X-XfOZKCs4A8_d-bcLclq_jDrBg6Ikw; __Secure-3PSIDCC=AJi4QfF1BnlWVmTjiXlNNJCzrY2y1ScdJZHn4tRP3NwsO1SfbGWAKT0RAMlMiYXvn7ta3Orr; __Secure-YEC=Cgs3bUxPYUd4OGNiVSj3uv2VBg%3D%3D";
    return request.get('https://music.youtube.com')
        .set(ytheader)
        .then((response) => {
            const matches = response.text.match(/ytcfg\.set\s*\(\s*({.+?})\s*\)\s*;/);
            let visitor_id = "";
            if (matches.length > 0) {
                const ytcfg = JSON.parse(decodeURIComponent(matches[1]));
                visitor_id = ytcfg.VISITOR_DATA;
            }
            return encodeURIComponent(visitor_id);
        })
}


// function get_authorization(cookie) {
//     var crypto = require('crypto');

//     const auth = cookie.match(/(?<=__Secure-3PAPISID=).*?(?=;)/)[0] + "https://music.youtube.com";
//     var shasum = crypto.createHash('sha1');
//     const unix_timestamp = Math.floor(new Date() / 1000);
//     shasum.update((unix_timestamp + ' ' + auth), 'utf-8');
//     return "SAPISIDHASH " + unix_timestamp + "_" + shasum.digest('hex');
// }


// DEBUG: if it's illegal
/*
router.get('/api/myPlaylist', (req, res) => {
    const authorization = req.headers.authorization;
    if (authorization) {
        if (req.query.key) {
            request.get('https://youtube.googleapis.com/youtube/v3/playlists?part=id%2C%20snippet%2C%20contentDetails%2C%20status&mine=true&maxResults=50')
                .query({ 'key': req.query.key }).set('Accept', 'application/json').set('Authorization', authorization).type('json').then(response => {
                    const output = JSON.parse(JSON.stringify(response.body));
                    res.json(
                        {
                            url: `http://${req.get('host') + req.originalUrl.replace(/api\//, '')}`,
                            status: res.statusCode,
                            pageInfo: output.pageInfo,
                            nextPageToken: output.nextPageToken,

                            items: [...output.items].map(x => new Object({
                                'id': x.id,
                                'privacyStatus': x.status.privacyStatus,
                                'title': x.snippet.title,
                                'description': x.snippet.description,
                                'channelTitle': x.snippet.channelTitle,
                                'publishAt': x.snippet.videoPublishedAt,
                                'itemCount': x.contentDetails.itemCount,
                                'thumbnail': Object.assign(x.snippet.thumbnails.standard || x.snippet.thumbnails.high, { isLoaded: false }),
                            }))
                        }
                    );
                }).catch(error => {
                    res.status(500).json(error)
                });
        } else res.sendStatus(400);

    } else res.sendStatus(400);
})

router.get('/api/ListKeyword', (req, res) => {
    const keywords = req.query.q ? req.query.q : 'rap';
    if (req.query.key) {
        request.get('https://youtube.googleapis.com/youtube/v3/search?part=id%2C%20snippet&maxResults=50&regionCode=FR&type=playlist%2C%20channel%2C%20video&videoDimension=2d')
            .query({ 'key': req.query.key, 'q': keywords }).set('Accept', 'application/json').type('json').then(response => {
                const output = JSON.parse(JSON.stringify(response.body));
                const items = {
                    info: [...output.items].filter(x => x.snippet.liveBroadcastContent !== 'live').map(x => new Object({
                        'id': x.id.videoId,
                        'title': x.snippet.title,
                        'description': x.snippet.description,
                        'channelTitle': x.snippet.channelTitle,
                        'publishAt': x.snippet.publishedAt,
                        'thumbnail': { url: `https://i.ytimg.com/vi/${x.id.videoId}/sddefault.jpg`, width: 640, height: 480, isLoaded: false },
                    }))
                }
                console.log(items);
                res.json(
                    {
                        url: `http://${req.get('host') + req.originalUrl.replace(/api\//, '')}`,
                        status: res.statusCode,
                        pageInfo: output.pageInfo,
                        nextPageToken: output.nextPageToken,
                        items: items,
                    }
                );
            }).catch(error => {
                res.status(500).json(error)
            });
    } else res.sendStatus(400);
})

router.get('/api/topList', (req, res) => {
    if (req.query.key) {
        request.get('https://youtube.googleapis.com/youtube/v3/playlistItems?part=id%2C%20snippet%2C%20contentDetails&maxResults=50&playlistId=PL4fGSI1pDJn7bK3y1Hx-qpHBqfr6cesNs')
            .query({ 'key': req.query.key }).set('Accept', 'application/json').type('json').then(response => {
                const output = JSON.parse(JSON.stringify(response.body));
                res.json(
                    {
                        url: `http://${req.get('host') + req.originalUrl.replace(/api\//, '')}`,
                        status: res.statusCode,
                        pageInfo: output.pageInfo,
                        nextPageToken: output.nextPageToken,
                        items: [...output.items].map(x => new Object({
                            'id': x.contentDetails.videoId,
                            'title': x.snippet.title,
                            'description': x.snippet.description,
                            'channelTitle': x.snippet.channelTitle,
                            'publishAt': x.contentDetails.videoPublishedAt,
                            'thumbnail': { url: `https://i.ytimg.com/vi/${x.contentDetails.videoId}/sddefault.jpg`, width: 640, height: 480, isLoaded: false },
                        }))
                    }
                );
            });
    } else {
        res.sendStatus(400);
    }
})

router.get('/api/mostPopular', (req, res) => {
    if (req.query.key) {
        request.get('https://youtube.googleapis.com/youtube/v3/videos?part=id%2C%20snippet%2C%20statistics%2C%20contentDetails&chart=mostPopular&maxResults=50&regionCode=fr&videoCategoryId=10')
            .query({ 'key': req.query.key }).set('Accept', 'application/json').type('json').then(response => {
                const output = JSON.parse(JSON.stringify(response.body));
                // console.log(output.kind);
                // let output = { 
                //     url: `http://${req.get('host') + req.originalUrl.replace(/api\//, '')}`, 
                //     status: res.statusCode, 
                //     info: [...response] 
                // }
                function convertDuration(duration) {
                    const map = new Map(Object.entries(/P(?:(?<days>\d*)D)?T(?:(?<hours>\d*)H)?(?:(?<minutes>\d*)M)?(?:(?<seconds>\d*)S)/.exec(duration)['groups']));
                    var output = map.get('seconds') ? map.get('seconds') : 0;
                    output += (map.get('days') ? map.get('days') : 0) * 86400;
                    output += (map.get('hours') ? map.get('hours') : 0) * 3600;
                    output += (map.get('minutes') ? map.get('minutes') : 0) * 60;
                    return parseInt(output);
                }

                res.json(
                    {
                        url: `http://${req.get('host') + req.originalUrl.replace(/api\//, '')}`,
                        status: res.statusCode,
                        nextPageToken: output.nextPageToken,
                        pageInfo: output.pageInfo,
                        items: [...output.items].map(x => new Object({
                            'id': x.id,
                            'title': x.snippet.title,
                            'description': x.snippet.description,
                            'channelTitle': x.snippet.channelTitle,
                            'publishAt': x.snippet.videoPublishedAt,
                            'thumbnail': { url: `https://i.ytimg.com/vi/${x.id}/sddefault.jpg`, width: 640, height: 480, isLoaded: false },
                            'viewCount': parseInt(x.statistics.viewCount),
                            'duration': convertDuration(x.contentDetails.duration), // ISO 8601 (string) -> seconds (int)

                        })),
                    }
                );
            });
    } else {
        res.sendStatus(400);
    }
})
*/


// router.get('/music/:id', (req, res) => {

//     if (!ytdl.validateID(req.params.id)) res.sendStatus(400).end();
//     else {
//         const id = req.params.id;

//         ytdl.getInfo(id, { quality: 'highestaudio' }).then(info => {
//             let audioFormats = ytdl.filterFormats(info.formats, 'audioonly')[0];

//             // console.log(audioFormats);
//             // console.log(audioFormats.url);

//             const size = audioFormats.contentLength;
//             if (req.headers.range) {
//                 const range = req.headers.range;
//                 const parts = range.replace(/bytes=/, '').split('-');
//                 const partialStart = parts[0];
//                 const partialEnd = parts[1];

//                 // TODO: should do it ?
//                 // const CHUNK_SIZE = 10 ** 6;
//                 //const start = Number(range.replace(/\D/g, ""));
//                 //const end = Math.min(start + CHUNK_SIZE, size - 1);
//                 const start = parseInt(partialStart, 10);
//                 const end = partialEnd ? parseInt(partialEnd, 10) : size - 1;
//                 const contentLength = end - start + 1;

//                 // console.log(start, end, contentLength);
//                 res.writeHead(206, {
//                     'accept-ranges': 'bytes',
//                     'content-range': 'bytes ' + start + '-' + end + '/' + size,
//                     'content-length': contentLength,
//                     'content-type': 'audio/webm',
//                 });
//                 request.get(audioFormats.url).query({ 'range': `${start}-${end}` }).pipe(res);
//             } else {
//                 res.writeHead(200, { 'content-length': size, 'content-type': 'audio/webm' });
//                 request.get(audioFormats.url).pipe(res);
//             }
//         }).catch(err => {
//             res.status(404).send(`404 - ${err.message}`);
//         });

//     }
// });

module.exports = router;