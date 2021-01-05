// import "/socket.io/socket.io.js"
import "https://ajax.googleapis.com/ajax/libs/jquery/3.4.0/jquery.min.js"

$(function() {
    
    let socket = io();
    // let socket = io("http://localhost:9000");

    socket.on("confirm connection", function(data) {
        console.log("nice")
        console.log(data)
    });

    let gameCode = parseInt(Math.floor(1000 + Math.random() * 9000));

    socket.emit("create room", gameCode);

    $("#gameCodeTitle").text("Game code: " + gameCode);

    socket.on("users dict test", function(data) {
        console.log("recieved users dict from server, look below");
        console.log(data);
    });
}); 
