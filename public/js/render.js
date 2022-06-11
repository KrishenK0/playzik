const browserId = {
    'APP_home': { url_name: '/', url_api: 'home' },
    'APP_search': { url_name: '/search', url_api: 'search' },
    'APP_profile': { url_name: '/profile', url_api: 'profile' },
    'APP_player': { url_name: '/player', url_api: 'player' }
}


let command = {
    browseEndPoint: { browseId: getBrowseId(window.location.pathname) },
    watchEndPoint: {
        index: null,
        videoId: '',
        playlistId: '',
    }
}

function getBrowseId(url) {
    for (var i in browserId) {
        if (browserId[i].url_name === url) return i;
    }
}

let player = {
    isPlaying: false,
    audio: null,
    index: 0,
    playlist: [],
}

window.AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new AudioContext();
var audio = new Audio();

$(document).ready(() => {

    history.replaceState(command, null, '');

    /* Music */
    $('*[data-xhrmusic]').on('click', function (e) {
        e.preventDefault();
        let url = $(this).attr('data-xhrmusic');
        loadMusic('/music/' + url);
    })


    function loadMusic(url) {
        if ($('#player').length === 0)

            audio.src = url;
        audio.play();
    }

    // function process(data) {
    //     source = context.createBufferSource(); // Create Sound Source
    //     context.decodeAudioData(data, function (buffer) {
    //         source.buffer = buffer;
    //         source.connect(context.destination);
    //         source.start(context.currentTime);

    //     })
    // }

    // // success callback when requesting audio input stream
    // function gotStream(stream) {
    //     window.AudioContext = window.AudioContext || window.webkitAudioContext;
    //     var audioContext = new AudioContext();

    //     // Create an AudioNode from the stream.
    //     var mediaStreamSource = audioContext.createMediaStreamSource(stream);

    //     // Connect it to the destination to hear yourself (or any other node for processing!)
    //     mediaStreamSource.connect(audioContext.destination);
    // }



    /* Sections */
    $('a[data-xhr]').on('click', function (e) {
        e.preventDefault();
        let link = $(this);
        let url = link.attr('data-xhr');
        command.browseEndPoint.browseId = url;
        history.pushState(command, null, browserId[url].url_name);
        ajaxLoadSection('/api/' + browserId[url].url_api);
    })

    function ajaxLoadSection(url, isPlayer = false) {
        $.get(url, {}, (data) => {
            console.log('Content loaded')
            if (!player) {
                $('#contents').html(data);
                $('#footer-btn a').each(function () {
                    if ($(this).attr('data-xhr') == history.state.browseEndPoint.browseId) $(this).addClass('text-secondary');
                    else $(this).removeClass('text-secondary');
                });
            } else {
                $('player').html(data);
            }
        })
    }

    window.onpopstate = (e) => {
        // console.log(e.state);
        if (e.state.browseEndPoint) {
            command.browseEndPoint.browseId = e.state.browseEndPoint.browseId;
            history.replaceState(command, null, browserId[e.state.browseEndPoint.browseId].url_name);
            ajaxLoadSection('/api/' + browserId[e.state.browseEndPoint.browseId].url_api);
        }
    }

});
