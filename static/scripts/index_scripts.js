$(function() {

    $("#newGameButton").click(function() {
        console.log("clicked");
        //generate random 4 digit number and store in localstorage
        let gameCode = parseInt(Math.floor(1000 + Math.random() * 9000));

        sessionStorage.setItem("pls", "yes");
        sessionStorage.setItem("gameCode", gameCode);
        sessionStorage.setItem("gameCreator", true);
        location.href = "/game-page";
    });


    $("#joinGameButton").click(function() {
        console.log("clicked join game button");
        //get gamecode from input and store in localstorage
        let gameCode = $("#gameCode").val();

        sessionStorage.setItem("gameCode", gameCode);
        sessionStorage.setItem("gameCreator", false);
        location.href = "/game-page";
    });
});