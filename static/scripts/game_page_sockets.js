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

    socket.on("start game", function(data) {
        $("#setupGameDiv").hide();
        $("#playGameDiv").show();
    })

    socket.on("validate game error", function(data) {
        let error = data;
        alert(error);
    });

    socket.on("new game code", function(data) {
        //update room code in session storage if room code already in use on server
        sessionStorage.setItem("gameCode", data);
        gameCode = sessionStorage.getItem("gameCode");
        $("#gameCodeTitle").text("Game code: " + gameCode);
    });

    socket.on("invalid game code", function(data) {
        //display warning saying invalid game code and redirect to home
        console.log("invalid game gode warning received");
        alert("Sorry, that is an invalid game code. You will now be redirected back to the home page.");
        location.href = "/";
    });

    socket.on("room full warning", function(data) {
        //display warning and redirect back to home
        console.log("room full warning received game_page_sockets file");
        alert("Sorry, the room is already full. You will now be redirected back to the home page.");
        location.href = "/";
    });

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

