
let audio = document.createElement('audio');

var socket = io('http://localhost:8080');

socket.on('start', function (data) {
    console.log("start");
    console.log(data);
    // socket.emit('my other event', { my: 'data' });
    // socket.emit('stream', { range: 'bytes=0-' });
    console.log("");
    ss(socket).on('audio-stream', function (stream, data) {
        parts = [];
        console.log("DATA -->> ")
        stream.on('data', (chunk) => {
            console.log(chunk.length);
            parts.push(chunk);
           
        });
        // stream.on('end', function () {
        //     var audio = document.getElementById('audio');
        //     audio.src = (window.URL || window.webkitURL).createObjectURL(new Blob(parts));
        //     audio.play();
        // });
    });
});

function createAudioContext() {
    const audioContext = window.AudioContext || window.webkitAudioContext;
    const context = new audioContext();
}