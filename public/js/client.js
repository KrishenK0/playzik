let storage = document.getElementById('storage');
const socket = new WebSocket("ws://localhost:8080");

socket.addEventListener('open', (event) => {
    // socket.send('Hello Server!');
});

socket.addEventListener('message', (event) => {
    storage.innerHTML += `Message from server : ${event.data}\n`;
})