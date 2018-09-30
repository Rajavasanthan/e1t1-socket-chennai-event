var socket = io();
$(document).ready(function () {
    socket.on('connect', function () {
        console.log("Connected");
    });
})