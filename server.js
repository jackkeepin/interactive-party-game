let express = require("express");
let http = require("http");
let path = require("path");
let socketio = require("socket.io");
let mongoose = require("mongoose");
let Prompts = require("./models/prompt");
let gameLogic = require("./static/scripts/game_logic")
let promptsLogic = require("./static/scripts/prompts_logic")
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

app.get("/create-prompt", function(request, response) {
    response.render("create_prompts");
});


//Data structure to be used to rooms and information
var users = {};

//Set number of points required to win a game
var maxPoints = 3;

io.on("connection", function(socket) {
    socket.emit("confirm connection", "successfully connected - from server");

    //when client sends join room event, validate options and allow socket to join room
    socket.on("join room", function(data) {
        let gameCode = data[0];
        let gameCreator = data[1];

        socket.join(gameCode);
        let socketId = socket.id;
        
        //validate before allowing client to join room
        let validateJoinGameResponse = gameLogic.validateJoinGame(gameCode, users, gameCreator);
        if (validateJoinGameResponse == null) {}
        else if (validateJoinGameResponse[0] == "new game code") {
            gameCode = validateJoinGameResponse[1];
            socket.leave(gameCode);
            socket.join(gameCode);
            io.to(socketId).emit("new game code", gameCode);
        }
        else if(validateJoinGameResponse == "invalid game code") {
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


    //when client sends request to set their nickname
    socket.on("set nickname", function(data) {
        let gameCode = data[0];
        let nickname = data[1];

        //assign nickname to socketId in users dict
        gameLogic.setNickname(gameCode, nickname, socket.id, users)
        
        io.to(gameCode).emit("return users dict", users[gameCode]["users"]);
    });


    //when client requests categories from the database
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

    //when client wants to start a game, validate the game options and send start game event
    socket.on("validate game", function(data) {
        let gameCode = data[0];
        let category = data[1];

        let err = gameLogic.validateGame(category, gameCode, users);
        if (err == "Not enough players error") {
            io.to(socket.id).emit("validate game error", "There must be at least three players in the game to start!");
            return;
        }
        else if(err == "No category error") {
            io.to(socket.id).emit("validate game error", "A category must be selected!");
            return;
        }
        else if(err == "Username error") {
            //send error to client that started game and client without nickname
            io.to(socket.id).emit("validate game error", "All players must enter a nickname!");
            io.to(key).emit("validate game error", "You must enter a nickname!");
            return
        }

        //add scores to users dict ready for game as well as socket id's to VIP array
        gameLogic.readyDictForGame(users, gameCode, category);

        Prompts.find({"category": category})
            .then(function(response) {
                users[gameCode]["prompts"] = response[0]["questions"];
                io.to(gameCode).emit("start game");
            });

    });


    //Get a prompt and select a client to be VIP
    socket.on("get prompt", function(data) {
       let gameCode =  data;
 
        let vipSocketId = gameLogic.getVipSocketId(gameCode, users);
        let promptToReturn = gameLogic.selectRandomPrompt(gameCode, users);

        if (promptToReturn == "_End Game Event_") {
            let usersInGame = users[gameCode]["users"]
            let finalScores = users[gameCode]["scores"];
            let sortedScores = gameLogic.sortScores(finalScores);
            io.to(gameCode).emit("end game", [sortedScores, usersInGame]);
            return;
        }

       io.to(gameCode).emit("return prompt", [promptToReturn, vipSocketId]);
    });

    //when answer received from client save it until all other clients have answered
    socket.on("submit answer", function(data) {
        let answer = data[0];
        let gameCode = data[1];
        let socketId = socket.id;

        let vipSocketId = users[gameCode]["currentVip"];

        let isAnswersReceived = gameLogic.storeSubmittedAnswer(gameCode, users, answer, socketId, vipSocketId);

        let usersInGame = users[gameCode]["users"];
        let submittedAnswers = users[gameCode]["submittedAnswers"];

        if (isAnswersReceived == true) {
            io.to(gameCode).emit("all answers", [submittedAnswers, vipSocketId, usersInGame]);
        }
    });

    //add a point to the user that submitted the winning answer
    socket.on("selected answer", function(data) {
        let gameCode = data[0];
        let winnerSocketId = data[1];

        users[gameCode]["scores"][winnerSocketId]++;

        //check if any users have reached required points to win
        for (let [socketID, score] of Object.entries(users[gameCode]["scores"])) {
            if (score == maxPoints) {
                let usersInGame = users[gameCode]["users"]
                let finalScores = users[gameCode]["scores"];
                let sortedScores = gameLogic.sortScores(finalScores);

                io.to(gameCode).emit("end game", [sortedScores, usersInGame]);
                return;
            }
        }

        let roundWinnerUsername = users[gameCode]["users"][winnerSocketId];
        let roundWinnerAnswer = users[gameCode]["submittedAnswers"][winnerSocketId];

        //clear submited answers ready for next round
        users[gameCode]["submittedAnswers"] = {};

        io.to(gameCode).emit("winner of round", [roundWinnerUsername, roundWinnerAnswer])
    });


    //when a client disconnects from the server, remove from room is users dict and return clients still connected
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

        //return users in room if room is still open
        if (gameCode in users) {
            io.to(gameCode).emit("return users dict", users[gameCode]["users"]);
        }
    });

    //when client submits a new prompt set, save in the database
    socket.on("create prompt set", function(data) {
        let cat = data[0];
        let promptInputs = data[1];

        let prompts = promptsLogic.createNewPrompt(cat, promptInputs);

        prompts.save()
        .then(function(result) {
            io.to(socket.id).emit("prompt created")
        })
        
    });

});



server.listen(port, function() {
    console.log("Listening on port " + port);
});
