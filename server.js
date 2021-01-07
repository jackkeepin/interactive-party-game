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

app.get("/game-page", function(request, response) {
    response.render("game_page");
})

var users = {};
io.on("connection", function(socket) {
    socket.emit("confirm connection", "successfully connected - from server");

    socket.on("join room", function(data) {
        let gameCode = data[0];
        let gameCreator = data[1];

        socket.join(gameCode);
        let socketId = socket.id;

        //if the room is newly created add an empty dict as a value to the gameCode key
        let isRoomExist = (gameCode in users);
        
        //if client clicked new game
        if (isRoomExist == false && gameCreator == "true") {
            users[gameCode] = {};
        }
        //if client trying to join room that doesn't exist
        else if (isRoomExist == false && gameCreator == "false") {
            io.to(socketId).emit("invalid game code", "The game code is incorrect");
            return;
        }
        
        //add socket id and empty username (because it has not been set) to users dict
        users[gameCode][socketId] = "";

        //If the user that just joined results in too many players joining the room, remove from users dict and return warning
        let usersInRoom = (Object.keys(users[gameCode])).length;
        if (usersInRoom >=7) {
            console.log("room at max capacity")
            delete users[gameCode][socketId];
            io.to(socketId).emit("room full warning", "The room is already full");
            // at this point the client will send disconnecting event to server
            return;
        }

        //send back users, but only clients in the same room
        io.to(gameCode).emit("return users dict", users[gameCode]);
    });


    socket.on("set nickname", function(data) {
        let gameCode = data[0];
        let nickname = data[1];

        //assign nickname to socket and update users dict
        socket.username = nickname;
        users[gameCode][socket.id] = socket.username;
        io.to(gameCode).emit("return users dict", users[gameCode]);

    });

    socket.on("disconnecting", function(data) {
        //when a user disconnects from a game, remove from users dict
        let rooms = socket.rooms;
        rooms = rooms.values();
        let socketId = rooms.next().value;
        let gameCode = rooms.next().value;

        let isRoomExist = (gameCode in users);

        //remove socket from users dict and socketio room
        if (isRoomExist == true) {
            if (socketId in users[gameCode]){
                delete users[gameCode][socketId];
                socket.leave(gameCode);
            }
        }
       
        //If all users leave a room, remove room from users dict
        if (isRoomExist == true) {
            let usersInRoom = (Object.keys(users[gameCode])).length;
            if (usersInRoom == 0) {
                delete users[gameCode];
            }
        }
        
        io.to(gameCode).emit("return users dict", users[gameCode]);
    });

});



server.listen(port, function() {
    console.log("Listening on port " + port);
});
