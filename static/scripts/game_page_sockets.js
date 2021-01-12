// import "/socket.io/socket.io.js"
import "https://ajax.googleapis.com/ajax/libs/jquery/3.4.0/jquery.min.js"

$(function() {
    
    let socket = io();

    //when a client is navigated to game page retrieve gameCode gameCreator bool
    let gameCode = sessionStorage.getItem("gameCode");
    let gameCreator = sessionStorage.getItem("gameCreator");

    //display start game button to game creator
    if (gameCreator == "true") {
        $("#startGameButtonDiv").append("<button id='startGameButton'>Start game</button>");
    }

    //send game creator bool and game code to server
    socket.emit("join room", [gameCode, gameCreator]);

    //display game code on the page
    $("#gameCodeTitle").text("Game code: " + gameCode);

    //if the client opened the game, request categories from server
    if (gameCreator == "true") {
        socket.emit("get categories", gameCode);
        $("#selectCategoryBox").append("<p id='categoriesHeader'>Select a category:</p>");
    }    

    //when available categories recieved from server (from database), display for user to select
    socket.on("return categories", function(data) {
        let categories = data;
        for (let category of categories) {
            $("#selectCategoryBox").append('<input type="radio" name="categoryRadio" id="categorySelection" value="' + category + '">' + category);
        }
    });
  
    //When user clicks submit nickname button, assign nickname to socket on server
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

    //When client that opened to game clicks start game, send chosen category to server to validate game settings before starting
    $("#startGameButton").click(function(){
        let category = $("input[name='categoryRadio']:checked").val();

        socket.emit("validate game", [gameCode, category]);
    });

    //When server starts game retrieve prompt and show/hide necessary elements on page
    socket.on("start game", function(data) {
        $("#setupGameDiv").hide();
        $("#playGameDiv").show();
        if (gameCreator == "true") {
            socket.emit("get prompt", gameCode);
        }
    })

    //when prompt is recieved from server display it and input elements to non-vip clients
    socket.on("return prompt", function(data) {
        $("#displayPromptDiv").empty();
        $("#viewAnswersDiv").empty();

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

    //when user submits answer, remove input elements and send answer to server
    $(document).on("click", "#answerButton", function() {
        let answer = $("#answerInput").val();
        if (answer.length < 1) {
            //show warning if no input
            if (!$("#answerInputWarning").length == true) {
                $("#answerInput").after("<p id='answerInputWarning'>You must submit an answer!</p>");
            }    
        }
        else {
            $("#answerInput").remove();
            $("#answerButton").remove();
            $("#answerInputWarning").remove();
            $("#answerInputDiv").append("<h1 id='waitMessage'>Please wait for other players to submit their answers!<h1>")
    
            socket.emit("submit answer", [answer, gameCode]);
        }
        
    });

    //when all answers from clients are recieved from server, display as text to non-vip clients and buttons to vip
    socket.on("all answers", function(data) {
        $("#answerInputDiv").empty();
        $("#vipMessageDiv").empty();
        let answers = data[0];
        let vipSocketId = data[1];
        let users = data[2];

        if (socket.id == vipSocketId) {
            $("#selectAnswerDiv").append("<h1>Select your favourite answer!</h1>");
            for (let [socketID, answer] of Object.entries(answers)) {
                $("#selectAnswerDiv").append("<button id='selectAnswerButton' value='" + socketID +"'>" + answer + "</button>");
            }
        }
        else {
            for (let [socketID, answer] of Object.entries(answers)) {
                $("#viewAnswersDiv").append("<p id='displayAnswer'><strong>" + users[socketID] + "</strong>: " + answer + "</p>");
            }
        }
    });

    //when answer is selected by vip, send the socketId of the user that submitted the winning answer to server
    $(document).on("click", "#selectAnswerButton", function() {
        let selectedAnswerSocketId = $(this).val();
        socket.emit("selected answer", [gameCode, selectedAnswerSocketId]);

        $("#viewAnswersDiv").empty();
        $("#selectAnswerDiv").empty();
    });

    //When winner of round is recieved from server, dislay the winner's username and answer
    socket.on("winner of round", function(data) {
        $("#viewAnswersDiv").empty();
        $("#selectAnswerDiv").empty();
        let username = data[0];
        let answer = data[1];

        $("#viewAnswersDiv").append("<h1 id='winnerOfRoundUsername'>" + username + " wins the round!</h1>");
        $("#viewAnswersDiv").append("<h2 id='winnerOfRoundAnswer'>" + answer + "</h2>");
        if (gameCreator == "true") {
            $("#viewAnswersDiv").append("<button id='nextRoundButton'>Next round</button>");
        }
    });

    //start next round when button is clicked
    $(document).on("click", "#nextRoundButton", function() {        
        let gameCreator = sessionStorage.getItem("gameCreator");
        if (gameCreator == "true") {
            socket.emit("get prompt", gameCode);
        }
    })   

    //Display results when the score limit is reached or the server runs out of prompts
    socket.on("end game", function(data) {
        let scores = data[0];
        let users = data[1];
        $("#displayPromptDiv").empty();
        $("#viewAnswersDiv").empty();
        $("#selectAnswerDiv").empty();

        $("#displayResultsDiv").append("<h1 id='winnerMessage'>" + users[scores[0][0]] + " is the winner!" + "</h1><br>");
        for (let score of scores) {
            $("#displayResultsDiv").append("<p id='playerScore'><strong>" + users[score[0]] + "</strong> achieved " + score[1] + " points!" +  "</p><br>");
        }
        $("#displayResultsDiv").append("<button id='quitGameButton'>Quit</button>");

    })

    //return to home page when quit button is clicked
    $(document).on("click", "#quitGameButton", function() {
        location.href = "/";
    });

    //if validation to start game fails display error
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

    //if invalid game code is entered, display error
    socket.on("invalid game code", function(data) {
        alert("Sorry, that is an invalid game code. You will now be redirected back to the home page.");
        location.href = "/";
    });

    //if game is full, dislpay error and redirect to home page to try again
    socket.on("room full warning", function(data) {
        alert("Sorry, the room is already full. You will now be redirected back to the home page.");
        location.href = "/";
    });

    //if server sends dict with users currently in the room, display the clients connected to the room
    socket.on("return users dict", function(data) {
        $("#playersList").empty();
        let players = []
        for (var key in data) {
            players.push(data[key]);
            if (data[key] != "") {
                $("#playersList").append("<p id='displayPlayer'>" + data[key] +"</p>");
            }
           
        }
        $("#connectedPlayers").text("Connected players: " + players.length + "/6")
    });

}); 

