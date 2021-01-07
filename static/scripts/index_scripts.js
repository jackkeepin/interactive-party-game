$(function() {

    $("#newGameButton").click(function() {
        console.log("clicked");
        //generate random 4 digit number and store in localstorage
        let gameCode = parseInt(Math.floor(1000 + Math.random() * 9000));
        localStorage.setItem("gameCode", gameCode)
        location.href = "/game-page";
    });

    
    $("#joinGameButton").click(function() {
        console.log("clicked join game button");
        //get gamecode from input and store in localstorage
        let gameCode = $("#gameCode").val();

        localStorage.setItem("gameCode", gameCode);
        location.href = "/game-page";
    });
});