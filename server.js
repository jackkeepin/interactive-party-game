let express = require("express");
let http = require("http");
let path = require("path");
let socketio = require("socket.io");
let mongoose = require("mongoose");
const port = process.env.PORT || 9000;


let app = express();
let server = http.createServer(app);
let io = socketio(server);


//Setup app to use EJS templates
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

//Set up static files
app.use(express.static(path.join(__dirname, "static")));


app.get("/", function(request, response) {
    response.render("index");
});

app.get("/new-game", function(request, response) {
    response.render("new_game");
})

var users = {};
io.on("connection", function(socket) {
    socket.emit("confirm connection", "successfully connected - from server");

    socket.on("create room", function(gameCode) {
        socket.join(gameCode);
        console.log("joined")
        console.log(socket.id)
;
        let socketId = socket.id;

        //if the room is newly created add an empty dict as a value to the gameCode key
        let isRoomExist = (gameCode in users);
        if (isRoomExist == false) {
            users[gameCode] = {};
        }
        
        //add socket id and empty username because it has not been set to users dict
        users[gameCode][socketId] = "";
        
        //send back users, but only clients in the same room
        io.to(gameCode).emit("users dict test", users[gameCode]);
    });

    socket.on("set nickname", function(data) {
        console.log("socket.id below on 'set nickname' event");
        console.log(socket.id);
        console.log(data);
        let gameCode = data[0];
        let nickname = data[1];

        //assign nickname to socket and update users dict
        socket.username = nickname;
        users[gameCode][socket.id] = socket.username;
        io.to(gameCode).emit("users dict test", users[gameCode]);

    });

    socket.on("join game", function(data) {
        console.log("join game event now");
        console.log(socket.id);
        console.log(data);
        let gameCode = data[0];
        let nickname = data[1];

        //Socket joins room and add details to users dict
        socket.join(gameCode);
        socket.username = nickname;
        users[gameCode][socket.id] = socket.username;
        io.to(gameCode).emit("users dict test", users[gameCode]);
    });
});



server.listen(port, function() {
    console.log("Listening on port " + port);
});
