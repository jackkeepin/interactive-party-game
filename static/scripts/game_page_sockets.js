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
        if (nickname.length > 10 || nickname.length <= 0) {
            $("#nicknameWarning").css("display", "inline-block");
        }
        else {
            $("#nicknameWarning").css("display", "");
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

    $(document).on("click", "#answerButton", function() {
        let answer = $("#answerInput").val();

        socket.emit("submit answer", [answer, socket.id])
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

