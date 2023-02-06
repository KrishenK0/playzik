const request = require('superagent');
const ytdl = require('ytdl-core');

let ytheader = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:102.0) Gecko/20100101 Firefox/102.0',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.5',
    'Content-Type': 'application/json',
    'X-Goog-AuthUser': '0',
    'x-Origin': 'https://music.youtube.com',
    'Cookie': "YSC=X6GGDuHZufk; CONSENT=YES+cb.20220628-08-p2.fr+FX+651;",
}


export function get_visitor_id() {
    // const cookie = "_gcl_au=1.1.572287292.1656707887; YSC=LiffpvgoLHY; CONSENT=PENDING+868; SID=LwiOUgI_2R3L6hs0pS1Ob6ukB3SZ-_oBay4KyRqNhqrxZPw8HxskHoJGy-iYQF4sLiHsVQ.; __Secure-1PSID=LwiOUgI_2R3L6hs0pS1Ob6ukB3SZ-_oBay4KyRqNhqrxZPw8HJJoFQ0sQizxhvj6vsGY5A.; __Secure-3PSID=LwiOUgI_2R3L6hs0pS1Ob6ukB3SZ-_oBay4KyRqNhqrxZPw8rQZK0tsYDAgBasdkbPpckA.; HSID=AA6JXKrudHan7UpWb; SSID=A0htVYqnMfvp-zBhb; APISID=qtT-INUxHprJ8yKT/AYmVzNPGL1XiFbBVU; SAPISID=d-IzcnG78ED95xU0/AHekoWUo_oJtPS1lQ; __Secure-1PAPISID=d-IzcnG78ED95xU0/AHekoWUo_oJtPS1lQ; __Secure-3PAPISID=d-IzcnG78ED95xU0/AHekoWUo_oJtPS1lQ; LOGIN_INFO=AFmmF2swRQIhAJIIT19YpX4MiLalczCtkwRVm5naal82UIF5bV9D0XxwAiAm-QHNwyv8oLJ0yyJhnJkLggMDx7MQNYGlMj1qMPnefQ:QUQ3MjNmeHVoOGo0aDB3eEI0aHRMcG5zR21iamRjc1Q2YUlCWXB1bUxzVGlMWE9RRjVDOUlQRTlkZlVYNUlOa2hKLTRZTXhYaDVUYkxwQXg3T3N5Ujl5dnowbmxaaXZuNVFFWjVYclNZczRpZDBzNmVTVVdTbzdvT1BZRGFsTHJXUkFsNU5uN2htLWpheWZTdTR2TlRDeDhSQjhfcFdQOW9R; SIDCC=AJi4QfHtCGuzxIH4cC7q9MqZvnxZjzVo0oqPxJHUpyUMUO_z1pQrSwaEYNuvb-xtFAuQKPQ-; __Secure-1PSIDCC=AJi4QfHC-1fk8MkITFZMp8BhOdVMk3v8N9kbt_wXSj5X-XfOZKCs4A8_d-bcLclq_jDrBg6Ikw; __Secure-3PSIDCC=AJi4QfF1BnlWVmTjiXlNNJCzrY2y1ScdJZHn4tRP3NwsO1SfbGWAKT0RAMlMiYXvn7ta3Orr; __Secure-YEC=Cgs3bUxPYUd4OGNiVSj3uv2VBg%3D%3D";
    return request.get('https://music.youtube.com').set(ytheader).then((response) => {
        const matches = response.text.match(/ytcfg\.set\s*\(\s*({.+?})\s*\)\s*;/);
        let visitor_id = "";
        if (matches.length > 0) {
            const ytcfg = JSON.parse(decodeURIComponent(matches[1]));
            visitor_id = ytcfg.VISITOR_DATA;
        }
        return encodeURIComponent(visitor_id);
    })
}

export function getURLVideoID(id) {
    return ytdl.getInfo(id, { quality: 'highestaudio' }).then(info => {
        let audioFormats = ytdl.filterFormats(info.formats, 'audioonly')[0];
        return audioFormats;
    });
}

/**
 * Request
 */

export function reqBrowse(googleId, continuation) {
    return new Promise((resolve, reject) => {
        if (googleId) {
            const req = (continuation) ? `https://music.youtube.com/youtubei/v1/browse?ctoken=${continuation}&continuation=${continuation}&type=next&key=AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30`
                : `https://music.youtube.com/youtubei/v1/browse?alt=json&key=AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30`;
            return request.post(req)
                .set(ytheader)
                .set({ 'X-Goog-Visitor-Id': googleId })
                .send({ 'context': { 'client': { 'clientName': 'WEB_REMIX', 'clientVersion': '0.1', 'hl': 'en', 'visitorData': googleId }, 'user': {} } })
                .then(async response => {
                    resolve(await sanitizeBrowse(JSON.parse(response.text)));
                }).catch(error => {
                    reject({ code: 500, error: error.toString() });
                })
        } else reject({ code: 400, error: 'Error: no google ID' });
    })
}

export function reqSongInPlaylist(googleId, videoId, playlistId) {
    return new Promise((resolve, reject) => {
        request.post(`https://music.youtube.com/youtubei/v1/player?alt=json&key=AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30`)
            .set(ytheader)
            .set({ 'X-Goog-Visitor-Id': googleId })
            .send({
                'playlistId': playlistId,
                'videoId': videoId,
                'context': { 'client': { 'clientName': 'WEB_REMIX', 'clientVersion': '0.1', 'hl': 'en' }, 'user': {} }
            })
            .then(response => {
                // res.json(sanitizeSearch(JSON.parse(response.text)));
                resolve(JSON.parse(response.text));
            }).catch(error => {
                reject(error);
            })
    })
}

export function reqSong(googleId, videoId, minimal = false) {
    return new Promise((resolve, reject) => {
        if (googleId) {

            request.post(`https://music.youtube.com/youtubei/v1/player?alt=json&key=AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30`)
                .set(ytheader)
                .set({ 'X-Goog-Visitor-Id': googleId })
                .send({
                    'videoId': videoId,
                    'context': { 'client': { 'clientName': 'WEB_REMIX', 'clientVersion': '0.1', 'hl': 'en' }, 'user': {} }
                })
                .then(async response => {
                    const bestFormat = await getURLVideoID(videoId);
                    // Sanitize thumbnail render
                    var infoPayload = JSON.parse(response.text).videoDetails;
                    infoPayload.thumbnail.thumbnails = [];
                    [...JSON.parse(response.text).videoDetails.thumbnail.thumbnails].forEach(thumbnail => {
                        // thumbnail.url = thumbnail.url.replace(/lh3.googleusercontent.com/, 'yt3.ggpht.com');
                        thumbnail.aspectRatio = parseFloat((thumbnail.width / thumbnail.height).toFixed(2));

                        infoPayload.thumbnail.thumbnails.push(thumbnail);
                    })

                    if (minimal)
                        resolve({
                            info: {
                                thumbnail: infoPayload.thumbnail,
                                videoId: infoPayload.videoId,
                                title: infoPayload.title,
                                author: infoPayload.author,
                            }
                        });

                    resolve({ format: bestFormat, info: infoPayload, });
                }).catch(error => {
                    reject({ code: 500, error: error });
                })
        } else reject({ code: 400, error: 'Error: no google ID' });
    })
}

export function reqSuggestion(googleId, query) {
    return new Promise((resolve, reject) => {
        if (googleId) {
            request.post(`https://music.youtube.com/youtubei/v1/music/get_search_suggestions?key=AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30`)
                .set(ytheader)
                .set({ 'X-Goog-Visitor-Id': googleId })
                .send({ "input": query, 'context': { 'client': { 'clientName': 'WEB_REMIX', 'clientVersion': '0.1', 'hl': 'en' }, 'user': {} } })
                .then(async response => {
                    resolve(await sanitizeResearchSuggestion(JSON.parse(response.text)));
                }).catch(error => {
                    reject(error);
                })
        } else reject({ code: 400, error: 'Error: no google ID' });
    })
}

export function reqSearch(googleId, query) {
    return new Promise((resolve, reject) => {
        if (googleId) {
            request.post(`https://music.youtube.com/youtubei/v1/search?alt=json&key=AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30`)
                .set(ytheader)
                .set({ 'X-Goog-Visitor-Id': googleId })
                .send({ 'query': query, 'context': { 'client': { 'clientName': 'WEB_REMIX', 'clientVersion': '0.1', 'hl': 'en' }, 'user': {} } })
                .then(response => {
                    resolve(sanitizeSearch(JSON.parse(response.text)));
                }).catch(error => {
                    reject({ code: 500, error: error.toString() });
                })
        } else reject({ code: 400, error: 'Error: no google ID' });
    });
}

export function reqLyrics(googleId, browseId) {
    return new Promise((resolve, reject) => {
        request.post(`https://music.youtube.com/youtubei/v1/browse?alt=json&key=AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30`)
            .set(ytheader)
            .set({ 'X-Goog-Visitor-Id': googleId })
            .send({ 'browseId': browseId, 'context': { 'client': { 'clientName': 'WEB_REMIX', 'clientVersion': '0.1', 'hl': 'en' }, 'user': {} } })
            .then(async response => {
                resolve(await sanitizeLyrics(JSON.parse(response.text)));
            }).catch(error => {
                reject(error);
            })
    });
}

export function reqRelated(googleId, browseId) {
    return new Promise((resolve, reject) => {
        request.post(`https://music.youtube.com/youtubei/v1/browse?alt=json&key=AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30`)
            .set(ytheader)
            .set({ 'X-Goog-Visitor-Id': googleId })
            .send({ 'browseId': browseId, 'context': { 'client': { 'clientName': 'WEB_REMIX', 'clientVersion': '0.1', 'hl': 'en' }, 'user': {} } })
            .then(async response => {
                resolve(await sanitizeBrowse(JSON.parse(response.text)));
            }).catch(error => {
                reject(error);
            })
    });
}

export function reqNext(googleId, videoID, radioPlaylist = undefined) {
    return new Promise((resolve, reject) => {
        if (googleId && videoID) {
            const payload = (radioPlaylist) ? { playlistId: radioPlaylist } : { 'videoId': videoID };
            request.post(`https://music.youtube.com/youtubei/v1/next?alt=json&key=AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30`)
                .set(ytheader)
                .set({ 'X-Goog-Visitor-Id': googleId })
                .send({ ...payload, tunerSettingValue: "AUTOMIX_SETTING_NORMAL", 'context': { 'client': { 'clientName': 'WEB_REMIX', 'clientVersion': '0.1', 'hl': 'en', 'visitorData': googleId }, 'user': {} } })
                .then(async response => {
                    if (!radioPlaylist)
                        resolve(await sanitizeNext(JSON.parse(response.text)));
                    else
                        resolve(await sanitizeNextSong(JSON.parse(response.text)));
                }).catch(error => {
                    reject(error);
                })
        } else reject({ error: 'Error: no google/video ID ' });
    })
}

export function reqPlaylist(googleId, browseId) {
    return new Promise((resolve, reject) => {
        request.post(`https://music.youtube.com/youtubei/v1/browse?alt=json&key=AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30`)
            .set(ytheader)
            .set({ 'X-Goog-Visitor-Id': googleId })
            .send({ 'browseId': browseId, 'context': { 'client': { 'clientName': 'WEB_REMIX', 'clientVersion': '0.1', 'hl': 'en' }, 'user': {} } })
            .then(async response => {
                resolve(await sanitizePlaylist(JSON.parse(response.text)));
            }).catch(error => {
                reject(error);
            })
    });
}

export function reqAlbum(googleId, browseId) {
    return new Promise((resolve, reject) => {
        request.post(`https://music.youtube.com/youtubei/v1/browse?alt=json&key=AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30`)
            .set(ytheader)
            .set({ 'X-Goog-Visitor-Id': googleId })
            .send({ 'browseId': browseId, 'context': { 'client': { 'clientName': 'WEB_REMIX', 'clientVersion': '0.1', 'hl': 'en' }, 'user': {} } })
            .then(async response => {
                resolve(await sanitizeAlbum(JSON.parse(response.text)));
            }).catch(error => {
                reject(error);
            })
    });
}

/**
 * Sanitize
 */

export function sanitizeResearchSuggestion(datas) {
    return new Promise((resolve, reject) => {
        try {
            if (datas.contents) {
                let searchSuggestions = [];
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

export function sanitizeNavigationEndPoint(data) {
    if (data == undefined) return;
    data = data.watchEndpoint || data.browseEndpoint || data;
    data.browseId = data.videoId || data.browseId;
    data.videoId = undefined;
    if (data.clickTrackingParams) data.clickTrackingParams = undefined;
    if (data.loggingContext) data.loggingContext = undefined;
    if (data.watchEndpointMusicSupportedConfigs) {
        data.context = data.watchEndpointMusicSupportedConfigs.watchEndpointMusicConfig.musicVideoType;
        data.watchEndpointMusicSupportedConfigs = undefined;
    }
    if (data.params) data.params = undefined;
    if (data.browseEndpointContextSupportedConfigs) {
        data.context = data.browseEndpointContextSupportedConfigs.browseEndpointContextMusicConfig.pageType;
        data.browseEndpointContextSupportedConfigs = undefined;
    }
    return data;
}

export function sanitizeLabel(labels) {
    let output = [];
    for (let label of labels.runs) {
        label.navigationEndpoint = sanitizeNavigationEndPoint(label.navigationEndpoint);
        output.push(label);
    }
    return output;
}

export function sanitizePlaylist(datas) {
    return new Promise((resolve, reject) => {
        try {
            let headerSection = datas.header.musicDetailHeaderRenderer;
            let description;
            if (headerSection.description) description = headerSection.description.runs[0].text;
            const header = {
                title: headerSection.title.runs[0],
                subtitle: headerSection.subtitle.runs,
                subsubtitle: headerSection.secondSubtitle.runs,
                thumbnail: headerSection.thumbnail.croppedSquareThumbnailRenderer.thumbnail.thumbnails,
                description: description,
            }

            let output = {
                header,
                content: []
            };

            const contents = datas.contents.singleColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents[0].musicPlaylistShelfRenderer.contents;
            contents.forEach(data => {
                data = data.musicResponsiveListItemRenderer;

                let labels = [];
                data.flexColumns.forEach(element => {
                    let runs = []
                    if (element.musicResponsiveListItemFlexColumnRenderer.text.runs) {
                        for (let label of element.musicResponsiveListItemFlexColumnRenderer.text.runs) {
                            if (label.navigationEndpoint) label.navigationEndpoint = sanitizeNavigationEndPoint(label.navigationEndpoint);
                            runs.push(label);
                        }
                        labels.push(runs);
                    }
                });

                let music = {
                    id: sanitizeNavigationEndPoint(data.overlay.musicItemThumbnailOverlayRenderer.content.musicPlayButtonRenderer.playNavigationEndpoint),
                    thumbnail: data.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails,
                    labels: labels,
                };

                output.content.push(music);
            });
            // resolve({ code: 200, 'items': output, 'continuation': continuation });
            resolve({ code: 200, 'items': output });
        } catch (error) {
            reject({ code: 500, error: { msg: `Error while parsing (${error})`, content: datas } });
        }
    })
}

export function sanitizeAlbum(datas) {
    return new Promise((resolve, reject) => {
        try {
            let headerSection = datas.header.musicDetailHeaderRenderer;
            let headerBadge;
            if (headerSection.subtitleBadges)
                headerBadge = headerSection.subtitleBadges[0].musicInlineBadgeRenderer.icon;

            const header = {
                title: headerSection.title.runs[0],
                subtitle: sanitizeLabel(headerSection.subtitle),
                subsubtitle: headerSection.secondSubtitle.runs,
                thumbnail: headerSection.thumbnail.croppedSquareThumbnailRenderer.thumbnail.thumbnails,
                badges: headerBadge,
            }

            let output = {
                header,
                content: []
            };

            const contents = datas.contents.singleColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents[0].musicShelfRenderer.contents;
            contents.forEach(data => {
                data = data.musicResponsiveListItemRenderer;

                let labels = [];
                data.flexColumns.forEach(element => {
                    if (element.musicResponsiveListItemFlexColumnRenderer.text.runs) {
                        labels.push(sanitizeLabel(element.musicResponsiveListItemFlexColumnRenderer.text));
                    } else
                        labels.push({ text: '' })
                });
                let badge;
                if (data.badges) badge = data.badges[0].musicInlineBadgeRenderer.icon.iconType;

                let music = {
                    id: sanitizeNavigationEndPoint(data.overlay.musicItemThumbnailOverlayRenderer.content.musicPlayButtonRenderer.playNavigationEndpoint),
                    index: data.index.runs[0].text,
                    labels: labels,
                    badge: badge,
                };

                output.content.push(music);
            });
            // resolve({ code: 200, 'items': output, 'continuation': continuation });
            resolve({ code: 200, 'items': output });
        } catch (error) {
            reject({ code: 500, error: { msg: `Error while parsing (${error})`, content: datas } });
        }
    })
}

export function sanitizeSearch(datas) {
    return new Promise((resolve, reject) => {
        try {
            if (datas.contents) {

                var content = [];
                var SECTIONS = datas.contents.tabbedSearchResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents;

                // TODO : Add compatiability with musicCardShelfRenderer
                for (const index in SECTIONS) {
                    if (SECTIONS[index].itemSectionRenderer) continue;
                    if (!SECTIONS[index].musicShelfRenderer) continue;
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

                resolve({ 'items': content });
            }
        } catch (error) {
            console.log(error);
            reject({ error });
        }
    });
}

export function sanitizeNext(datas) {
    return new Promise((resolve, reject) => {
        try {
            if (datas.contents) {
                let tabs = [], radioId = undefined;
                [...datas.contents.singleColumnMusicWatchNextResultsRenderer.tabbedRenderer.watchNextTabbedResultsRenderer.tabs].forEach(tab => {
                    try {
                        if (tab.tabRenderer.content)
                            radioId = tab.tabRenderer.content.musicQueueRenderer.content.playlistPanelRenderer.contents[1].automixPreviewVideoRenderer.content.automixPlaylistVideoRenderer.navigationEndpoint.watchPlaylistEndpoint.playlistId;
                    } catch (error) { console.log(error) }
                    if (tab.tabRenderer.endpoint) {
                        tabs.push({
                            title: tab.tabRenderer.title,
                            browseId: tab.tabRenderer.endpoint.browseEndpoint.browseId
                        })
                    }
                })

                resolve({ code: 200, 'content': tabs, 'radioId': radioId });

            } else reject({ code: 200, message: 'No next :(' /*, 'searchSuggestions': null */ });
        } catch (error) {
            reject({ code: 500, error: { msg: `Error while parsing (${error})`, content: datas } });
        }
    })
}

export function sanitizeNextSong(datas) {
    return new Promise((resolve, reject) => {
        try {
            if (datas.contents) {
                let tabs = [], radioId = undefined;
                [...datas.contents.singleColumnMusicWatchNextResultsRenderer.tabbedRenderer.watchNextTabbedResultsRenderer.tabs[0].tabRenderer.content.musicQueueRenderer.content.playlistPanelRenderer.contents].forEach(info => {
                    const song = info.playlistPanelVideoRenderer;
                    tabs.push({
                        title: song.title.runs[0].text,
                        author: song.shortBylineText.runs[0].text,
                        fullInfo: song.longBylineText.runs.map(x => x.text),
                        thumbnail: song.thumbnail,
                        videoId: song.videoId,
                        playlistId: song.navigationEndpoint.watchEndpoint.playlistId,
                        index: song.navigationEndpoint.watchEndpoint.index,
                    })
                })

                resolve({ code: 200, 'content': tabs, 'radioId': radioId });

            } else reject({ code: 200, message: 'No next :(' /*, 'searchSuggestions': null */ });
        } catch (error) {
            reject({ code: 500, error: { msg: `Error while parsing (${error})`, content: datas } });
        }
    })
}

export function sanitizeLyrics(datas) {
    return new Promise((resolve, reject) => {
        try {
            if (datas.contents.sectionListRenderer) {
                let content = {};
                [...datas.contents.sectionListRenderer.contents].forEach(lyric => {
                    content.lyrics = lyric.musicDescriptionShelfRenderer.description.runs[0].text;
                    content.footer = lyric.musicDescriptionShelfRenderer.footer.runs[0].text;
                })

                resolve({ code: 200, 'content': content });
            } else resolve({
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

export function sanitizeBrowse(datas) {
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
                            sectionContext: 'musicDescriptionShelfRenderer',
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

export function reqImg2Base64(url) {
    return new Promise((resolve, reject) => {
        request.get(url).end(function (err, res) {
            try {
                resolve({ content: "data:image/png;base64," + Buffer.from(res.body).toString('base64') });
            } catch (error) {
                resolve({ error: error });
            }
        });
    })
}