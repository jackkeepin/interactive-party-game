// import "/socket.io/socket.io.js"
import "https://ajax.googleapis.com/ajax/libs/jquery/3.4.0/jquery.min.js"

$(function() {
    
    console.log('good start')
    let socket = io();
    // let socket = io("http://localhost:9000");

    let gameCode = sessionStorage.getItem("gameCode");
    let gameCreator = sessionStorage.getItem("gameCreator");
    console.log('game code below from local storage')
    console.log(gameCode)

    console.log("socketid cleint side below")
    console.log(socket.id);

    socket.emit("join room", [gameCode, gameCreator]);

    $("#gameCodeTitle").text("Game code: " + gameCode);

  
    $("#nicknameButton").click(function() {
        let nickname = $("#nicknameInput").val();
        if (nickname.length > 10 || nickname.length <= 0) {
            console.log("thats a nickname error");
            $("#nicknameWarning").css("display", "inline-block");
        }
        else {
            $("#nicknameWarning").css("display", "");
            socket.emit("set nickname", [gameCode, nickname]);
        }
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
        alert("Sorry,the room is already full. You will now be redirected back to the home page.");
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

