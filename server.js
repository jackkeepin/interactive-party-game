let express = require("express");
let http = require("http");
let path = require("path");
let socketio = require("socket.io");
let mongoose = require("mongoose");

let app = express();
let server = http.createServer(app);

app.use(express.static(path.join(__dirname, "resources")));

server.listen(9000, function() {
    console.log("Server listening on port 9000");
});

let io = socketio(server);

io.sockets.on("connection", function(socket) {
    socket.on("create", function(room) {
        socket.join(room);
    });
});