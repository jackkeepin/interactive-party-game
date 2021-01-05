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
        
        //temp username for development
        socket.username = "this the username";
        let socketId = socket.id;
        let socketUsername = socket.username;

        //if the room is newly created add an empty dict as a value to the gameCode key
        let isRoomExist = (gameCode in users);
        if (isRoomExist == false) {
            users[gameCode] = {};
        }
        
        //add socket id and associated username to users dict
        users[gameCode][socketId] = socketUsername;
        
        //send back users, but only clients in the same room
        io.to(gameCode).emit("users dict test", users[gameCode]);
    });
});



server.listen(port, function() {
    console.log("Listening on port " + port);
});
