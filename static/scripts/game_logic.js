const { get } = require("mongoose");

function newGameCode(isRoomExist, users) {
    while (isRoomExist == true) {
        gameCode = parseInt(Math.floor(1000 + Math.random() * 9000));
        gameCode = gameCode.toString();
        isRoomExist = (gameCode in users);
    }
    return gameCode;
}

function setNickname(gameCode, nickname, socketId, users) {
    users[gameCode]["users"][socketId] = nickname;
}

function validateGame(category, gameCode, users) {
    //check there are at least 3 players in game
    let numUsersInRoom = (Object.keys(users[gameCode]["users"])).length;
    if(numUsersInRoom <= 2) {
        return "Not enough players error";
    }

    //check a cetegory has been selected
    if (category == null) {
        return "No category error";
    }

    //Check all clients have submitted a username
    for (key in users[gameCode]["users"]) {
        if (users[gameCode]["users"][key] == "") {
            return "Username error";
        }
    }
}

function readyDictForGame(users, gameCode, category) {
    //add scores to users dict ready for game as well as socket id's to VIP array
    users[gameCode]["scores"] = {};
    users[gameCode]["vip"] = [];
    users[gameCode]["submittedAnswers"] = {};
    for (key in users[gameCode]["users"]) {
        users[gameCode]["scores"][key] = 0;
        users[gameCode]["vip"].push(key);
    }

    //add the category being used by the players to users dict
    users[gameCode]["category"] = category;

}

function getVipSocketId(gameCode, users) {
    let numOfPotentialVip = (users[gameCode]["vip"].length);// -1 here
    //if all users have been vip, refill vip array and pick again
    if (numOfPotentialVip <= 0) {
        for (key in users[gameCode]["users"]) {
            users[gameCode]["vip"].push(key);
         }
         numOfPotentialVip = (users[gameCode]["vip"].length);// -1 here
    }

    let vipIndex = Math.floor(Math.random() * numOfPotentialVip);

    let vipSocketId = users[gameCode]["vip"][vipIndex];
    users[gameCode]["vip"].splice(vipIndex, 1)

    users[gameCode]["currentVip"] = vipSocketId;

    console.log("look here");
    return vipSocketId;
    
}

function selectRandomPrompt(gameCode, users) {
       //select a random prompt and remove it from array so it isn't used again
       let numOfPrompts = (users[gameCode]["prompts"].length); // -1 here

       //if there are no prompts left, end the game
       if (numOfPrompts == 0) {
           return "_End Game Event_";
       }

       let index = Math.floor(Math.random() * numOfPrompts);
       let promptToReturn = users[gameCode]["prompts"][index];       
       users[gameCode]["prompts"].splice(index, 1)

       return promptToReturn;
}

module.exports.newGameCode = newGameCode;
module.exports.setNickname = setNickname;
module.exports.validateGame = validateGame;
module.exports.readyDictForGame = readyDictForGame;
module.exports.getVipSocketId = getVipSocketId;
module.exports.selectRandomPrompt = selectRandomPrompt;