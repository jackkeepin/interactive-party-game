// import "/socket.io/socket.io.js"
import "https://ajax.googleapis.com/ajax/libs/jquery/3.4.0/jquery.min.js"

$(function() {
    
    let socket = io();
    // let socket = io("http://localhost:9000");
    console.log(socket)


    //index page
    let gameCode = parseInt(Math.floor(1000 + Math.random() * 9000));

    socket.emit("create room", gameCode);

    $("#gameCodeTitle").text("Game code: " + gameCode);

    socket.on("users dict test", function(data) {
        console.log("recieved users dict from server, look below");
        console.log(data);
    });
    //end of index page


    //new_game page
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
    //end of new_game page

    
    //index page
    $("#joinGameButton").click(function() {
        let gameCode = $("#gameCode").val();
        let nickname = $("#nickname").val();

        socket.emit("join game", [gameCode, nickname]);
    });

}); 

