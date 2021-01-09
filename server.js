let express = require("express");
let http = require("http");
let path = require("path");
let socketio = require("socket.io");
let mongoose = require("mongoose");
let Prompts = require("./models/prompt");
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

//Data structure to be used to rooms and information
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
            users[gameCode] = {"users": {}};
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
            
            users[gameCode] = {"users": {}};
        }
        //if client trying to join room that doesn't exist
        else if (isRoomExist == false && gameCreator == "false") {
            io.to(socketId).emit("invalid game code", "The game code is incorrect");
            return;
        }
        
        //add socket id and empty username (because it has not been set) to users dict
        users[gameCode]["users"][socketId] = "";

        //If the user that just joined results in too many players joining the room, remove from users dict and return warning
        let numUsersInRoom = (Object.keys(users[gameCode]["users"])).length;
        if (numUsersInRoom >=7) {
            delete users[gameCode]["users"][socketId];
            io.to(socketId).emit("room full warning", "The room is already full");
            // at this point the client will send disconnecting event to server
            return;
        }

        //send back users, but only clients in the same room
        io.to(gameCode).emit("return users dict", users[gameCode]["users"]);
    });


    socket.on("set nickname", function(data) {
        let gameCode = data[0];
        let nickname = data[1];

        //assign nickname to socket and update users dict
        socket.username = nickname;
        users[gameCode]["users"][socket.id] = socket.username;

        io.to(gameCode).emit("return users dict", users[gameCode]["users"]);
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
        let numUsersInRoom = (Object.keys(users[gameCode]["users"])).length;
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
        for (key in users[gameCode]["users"]) {
            if (users[gameCode]["users"][key] == "") {
                //send error to client that started game and client without nickname
                io.to(socket.id).emit("validate game error", "All players must enter a nickname!");
                io.to(key).emit("validate game error", "You must enter a nickname!")
                return;
            }
        }

        //add scores to users dict ready for game as well as socket id's to VIP array
        users[gameCode]["scores"] = {};
        users[gameCode]["vip"] = []
        for (key in users[gameCode]["users"]) {
            users[gameCode]["scores"][key] = 0;
            users[gameCode]["vip"].push(key);
        }

        //add the category being used by the players to users dict
        users[gameCode]["category"] =  category;

        Prompts.find({"category": category})
            .then(function(response) {
                users[gameCode]["prompts"] = response[0]["questions"];
                io.to(gameCode).emit("start game");
            });

    });

    //Get a prompt and select a client to be VIP
    socket.on("get prompt", function(data) {
       let gameCode =  data;

       let numOfPotentialVip = (users[gameCode]["vip"].length) - 1;
       //if all users have been vip, refill vip array and pick again
       if (numOfPotentialVip < 0) {
           for (key in users[gameCode]["users"]) {
               users[gameCode]["vip"].push(key);
            }
            numOfPotentialVip = (users[gameCode]["vip"].length) - 1;
       }

       let vipIndex = Math.floor(Math.random() * numOfPotentialVip);
       let vipSocketId = users[gameCode]["vip"][vipIndex];
       users[gameCode]["vip"].splice(vipIndex, 1)

       //select a random prompt and remove it from array so it isn't used again
       let numOfPrompts = (users[gameCode]["prompts"].length) - 1;
       let index = Math.floor(Math.random() * numOfPrompts);
       let promptToReturn = users[gameCode]["prompts"][index];       
       users[gameCode]["prompts"].splice(index, 1)

       io.to(gameCode).emit("return prompt", promptToReturn)
       io.to(vipSocketId).emit("vip event", "you're the VIP!")

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
            if (socketId in users[gameCode]["users"]){
                delete users[gameCode]["users"][socketId];
                socket.leave(gameCode);
            }
        }
       
        //If all users leave a room, remove room from users dict
        if (isRoomExist == true) {
            let numUsersInRoom = (Object.keys(users[gameCode]["users"])).length;
            if (numUsersInRoom == 0) {
                delete users[gameCode];
            }
        }

    });

});



server.listen(port, function() {
    console.log("Listening on port " + port);
});
