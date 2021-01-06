// import "/socket.io/socket.io.js"
import "https://ajax.googleapis.com/ajax/libs/jquery/3.4.0/jquery.min.js"

$(function() {
    
    console.log('good start')
    // let socket = io();
    let socket = io("http://localhost:9000");

    let gameCode = localStorage.getItem("gameCode");
    console.log('game code below from local storage')
    console.log(gameCode)

    socket.emit("join room", gameCode);

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
        console.log(players);
    });

}); 

