// import "/socket.io/socket.io.js"
import "https://ajax.googleapis.com/ajax/libs/jquery/3.4.0/jquery.min.js"

$(function() {
    
    let socket = io();

    let gameCode = sessionStorage.getItem("gameCode");
    let gameCreator = sessionStorage.getItem("gameCreator");

    if (gameCreator == "true") {
        $("#startGameButtonDiv").append("<button id='startGameButton'>Start game</button>");
    }

    console.log('game code below from local storage')
    console.log(gameCode)

    socket.emit("join room", [gameCode, gameCreator]);

    $("#gameCodeTitle").text("Game code: " + gameCode);

    if (gameCreator == "true") {
        console.log("about to get categories")
        socket.emit("get categories", gameCode);
        $("#selectCategoryBox").append("<p id='categoriesHeader'>Select a category:</p>");
        
    }    

    //when available categories recieved from server, display for user to select
    socket.on("return categories", function(data) {
        let categories = data;
        for (let category of categories) {
            $("#selectCategoryBox").append("<input type='radio' name='categoryRadio' id='categorySelection' value='" + category + "'>" + category);
        }
    });
  
    $("#nicknameButton").click(function() {
        let nickname = $("#nicknameInput").val();
        $("#nicknameWarning").remove();
        if (nickname.length <= 0) {
            $("#nicknameInput").after("<p id='nicknameWarning'>You must enter a nickname!</p>");
        }
        else if (nickname.length > 20) {
            $("#nicknameInput").after("<p id='nicknameWarning'>Nickname can't be longer than 20 characters</p>");
        }
        else {
            $("#nicknameWarning").remove();
            socket.emit("set nickname", [gameCode, nickname]);
        }
    });

    $("#startGameButton").click(function(){

        let category = $("input[name='categoryRadio']:checked").val();
        if (category == null) {
            console.log("hell yeah")
        }
        socket.emit("validate game", [gameCode, category]);

        console.log("end of start click");
        
    });

    //When server starts game
    socket.on("start game", function(data) {
        $("#setupGameDiv").hide();
        $("#playGameDiv").show();
        if (gameCreator == "true") {
            console.log(gameCode)
            console.log("about to get prompt event")
            socket.emit("get prompt", gameCode);
        }
    })

    //when prompt is recieved from server
    socket.on("return prompt", function(data) {
        console.log("prompt recieved from server!!")

        let prompt = data[0];

        //by default, no client is vip unless one received vip event from server
        let vipSocketId = data[1];
        let isVip = "false";
        if (socket.id == vipSocketId) {
            isVip =  "true"
        }

        $("#displayPromptDiv").append("<h1 id='displayPrompt'>" + prompt +"</div>");

        if (isVip == "false") {
            //display inputs
            $("#answerInputDiv").append("<input type='text' maxlength='80'  id='answerInput' placeholder='Enter your answer'><br>")
            $("#answerInputDiv").append("<button id='answerButton'>Confirm answer</button>")
        }
        else {
            //display message to wait for other inputs
            $("#vipMessageDiv").append("<h1 id='waitMessage'>You're the VIP! Wait for other users to submit their answers!</h1>")
        }
    });

    //when user submits answer, remove input elements and send response to server
    $(document).on("click", "#answerButton", function() {
        let answer = $("#answerInput").val();
        $("#answerInput").remove();
        $("#answerButton").remove();
        $("#answerInputDiv").append("<h1 id='waitMessage'>Please wait for other players to submit their answers!<h1>")

        socket.emit("submit answer", [answer, socket.id, gameCode]);
    });

    socket.on("all answers", function(data) {
        $("#answerInputDiv").empty();
        $("#vipMessageDiv").empty();
        let answers = data[0];
        let vipSocketId = data[1];
        let users = data[2];

        if (socket.id == vipSocketId) {
            console.log("youre still vip bro");
            $("#selectAnswerDiv").append("<h1>Select your favourite answer!</h1>");
            for (let [socketID, answer] of Object.entries(answers)) {
                $("#selectAnswerDiv").append("<button id='selectAnswerButton' value='" + socketID +"'>" + answer + "</button>");
            }
        }
        else {
            console.log("you still aint vip");
            for (let [socketID, answer] of Object.entries(answers)) {
                $("#viewAnswersDiv").append("<p id='displayAnswer'><strong>" + users[socketID] + "</strong>: " + answer + "</p>");
            }
        }
    });

    //send the socketId of the user that submitted the winning answer
    $(document).on("click", "#selectAnswerButton", function() {
        console.log("epiccc");
        let selectedAnswerSocketId = $(this).val();
        console.log(selectedAnswerSocketId);
        socket.emit("selected answer", [gameCode, selectedAnswerSocketId]);
        $("#displayPromptDiv").empty();
        $("#viewAnswersDiv").empty();
        $("#selectAnswerDiv").empty();
    });

    //start the next round by getting the next prompt
    socket.on("next round", function(data) {
        $("#displayPromptDiv").empty();
        $("#viewAnswersDiv").empty();
        $("#selectAnswerDiv").empty();
        
        let gameCreator = sessionStorage.getItem("gameCreator");
        if (gameCreator == "true") {
            socket.emit("get prompt", gameCode);
        }
        
    });

    socket.on("end game", function(data) {
        let scores = data[0];
        let users = data[1];
        $("#displayPromptDiv").empty();
        $("#viewAnswersDiv").empty();
        $("#selectAnswerDiv").empty();

        $("#displayResultsDiv").append("<h1 id='winnerMessage'>" + users[scores[0][0]] + " is the winner!" + "</h1><br>");
        for (let score of scores) {
            console.log(score);
            $("#displayResultsDiv").append("<p id='playerScore'><strong>" + users[score[0]] + "</strong> achieved " + score[1] + " points!" +  "</p><br>");
        }
        $("#displayResultsDiv").append("<button id='quitGameButton'>Quit</button>");

    })

    $(document).on("click", "#quitGameButton", function() {
        console.log("quit game button clicked");
        location.href = "/";
    });

    //if validation to start game fails
    socket.on("validate game error", function(data) {
        let error = data;
        alert(error);
    });

    //if a game code is already in use, replace gameCode in sessionstorage with new code
    socket.on("new game code", function(data) {
        sessionStorage.setItem("gameCode", data);
        gameCode = sessionStorage.getItem("gameCode");
        $("#gameCodeTitle").text("Game code: " + gameCode);
    });

    //if invalid game code is entered
    socket.on("invalid game code", function(data) {
        console.log("invalid game gode warning received");
        alert("Sorry, that is an invalid game code. You will now be redirected back to the home page.");
        location.href = "/";
    });

    //if game is full
    socket.on("room full warning", function(data) {
        console.log("room full warning received game_page_sockets file");
        alert("Sorry, the room is already full. You will now be redirected back to the home page.");
        location.href = "/";
    });

    //if server sends dict with users currently in the room
    socket.on("return users dict", function(data) {
        console.log("recieved users dict from server, look below");
        console.log(data);
        $("#playersList").empty();
        let players = []
        for (var key in data) {
            players.push(data[key]);
            if (data[key] != "") {
                $("#playersList").append("<p id='displayPlayer'>" + data[key] +"</p>");
            }
           
        }
        $("#connectedPlayers").text("Connected players: " + players.length + "/6")
        console.log(players);
    });

}); 

