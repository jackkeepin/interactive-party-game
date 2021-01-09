let express = require("express");
let http = require("http");
let path = require("path");
let socketio = require("socket.io");
let mongoose = require("mongoose");
let Prompts = require("./models/prompt")
const port = process.env.PORT || 9000;


let app = express();
let server = http.createServer(app);
let io = socketio(server);

//Connect to MongoDB
let dbURI = "mongodb+srv://jkeepin:Password123@comp3006-cw.qgmz0.mongodb.net/interactive-party-game-prompts?retryWrites=true&w=majority";
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((result) => console.log("connected to db: " + result))
    .catch((err) => console.log("error: " + err));

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
        //if new game has been created and random code is already in use for another room
        else if(isRoomExist == true && gameCreator == "true") {
            socket.leave(gameCode);
            while (isRoomExist == true) {
                gameCode = parseInt(Math.floor(1000 + Math.random() * 9000));
                gameCode = gameCode.toString();
                isRoomExist = (gameCode in users);
            }
            socket.join(gameCode);
            io.to(socketId).emit("new game code", gameCode);
            
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
        let numUsersInRoom = (Object.keys(users[gameCode])).length;
        if (numUsersInRoom >=7) {
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

    socket.on("get categories", function(data){
        let gameCode = data;

        Prompts.find().select("category -_id")
            .then(function(response) {
                let categories = []
                response.forEach(element => {
                    categories.push(element["category"]);
                });
                io.to(socket.id).emit("return categories", categories);
            });
    });

    socket.on("validate game", function(data) {
        let gameCode = data[0];
        let category = data[1];

        //check there are at least 3 players in game
        let numUsersInRoom = (Object.keys(users[gameCode])).length;
        if(numUsersInRoom <= 2) {
            io.to(socket.id).emit("validate game error", "There must be at least three players in the game to start!");
            return;
        }

        //check a cetegory has been selected
        if (category == null) {
            io.to(socket.id).emit("validate game error", "A category must be selected!");
            return;
        }

        //Check all clients have submitted a username
        for (key in users[gameCode]) {
            if (users[gameCode][key] == "") {
                //send error to client that started game and client without nickname
                io.to(socket.id).emit("validate game error", "All players must enter a nickname!");
                io.to(key).emit("validate game error", "You must enter a nickname!")
                return;
            }
        }

        //need to return which client is VIP, maybe do that on different socket event
        io.to(gameCode).emit("start game");
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
            let numUsersInRoom = (Object.keys(users[gameCode])).length;
            if (numUsersInRoom == 0) {
                delete users[gameCode];
            }
        }
        
        io.to(gameCode).emit("return users dict", users[gameCode]);
    });

});



server.listen(port, function() {
    console.log("Listening on port " + port);
});
