let chai = require("chai");
let gameLogic = require("../static/scripts/game_logic");

suite("Test test", function() {

    test("Quick test", function() {
      // Initialise a counter.
      let counter = 0;
  
      for (let i=0; i<100; i++) {
          counter++;
      }
  
      chai.assert.equal(counter, 100, "Answer should be 100");
    });


    test("Test newGameCode", function() {
      let gameCode = 3311;
      let users = {gameCode: {} };

      let newGeneratedCode = gameLogic.newGameCode(true, users);


      chai.assert.notEqual(gameCode, newGeneratedCode, "new code should be different");
      chai.assert.equal(newGeneratedCode.length, 4, "new code should be 4 digits long");
    });

    test("Test setNickname", function() {
      let gameCode = 2211;
      let socketId = "MqQO_C6wMAqbrVD6AAAH";
      
      let users = {
        2211: {
          "users": {
            "MqQO_C6wMAqbrVD6AAAH": "",
            "5kkrIkItghrjIS5KAAAJ": "",
            "O0NjCjqmpMChxFo9AAAL": ""
          }
        }
      }

      gameLogic.setNickname(gameCode, "test nickname", socketId, users)

      chai.assert.equal(users[gameCode]["users"][socketId], "test nickname", "Nickname not set");
    });

    test("Test validateGame fail player count", function() {
      let cat = "Random";
      let gameCode = 4021;
      let users = {
        4021: {
          "users": {
            "qX4ylqadvprl3fITAAAB": 'Player 1',
            "xKKSEm75Xx_mLLqGAAAD": 'Player 2'
          }
        }  
      }

      let err = gameLogic.validateGame(cat, gameCode, users);

      chai.assert.equal(err, "Not enough players error", "Should get player count error!");
    });

    test("Test validateGame fail category", function() {
      let cat = null;
      let gameCode = 9427;
      let users = {
        9427: {
          users: {
            v97784HU_tNEPw6UAAAF: 'Player 1',
            GAm_6sz3JTNX3YUQAAAH: '',
            ncYQCAkMKJ5vA3xJAAAJ: 'Player 3'
          }
        }
      }

      let err = gameLogic.validateGame(cat, gameCode, users);

      chai.assert.equal(err, "No category error", "Should get player category error!");
    });

    test("Test validateGame fail username", function() {
      let cat = "Random";
      let gameCode = 9427;
      let users = {
        9427: {
          users: {
            v97784HU_tNEPw6UAAAF: 'Player 1',
            GAm_6sz3JTNX3YUQAAAH: '',
            ncYQCAkMKJ5vA3xJAAAJ: 'Player 3'
          }
        }
      }

      let err = gameLogic.validateGame(cat, gameCode, users);

      chai.assert.equal(err, "Username error", "Should get player category error!");
    });

    test("Test readyDictForGame", function() {
      let category = "Random";
      let gameCode = 2660;
      users = {
        2660: {
          "users": {
            '9e-OHgsWSBd60jbbAAAB': 'player one',
            "BEflthMRp9pD8y53AAAD": 'player two',
            "V1jyXOhS3zT2mok5AAAF": 'player three'
          }
        }
      }

      gameLogic.readyDictForGame(users, gameCode, category);
      
      let lengthOfScores = Object.keys(users[gameCode]["scores"]).length;
      let lengthOfVip = Object.keys(users[gameCode]["vip"]).length;
      
      
      let submittedAnswersInDict = false;
      if ("submittedAnswers" in users[gameCode]) {
        submittedAnswersInDict = true;
      }

      chai.assert.equal(lengthOfScores, 3, "Scores added incorrectly");
      chai.assert.equal(users[gameCode]["scores"]["9e-OHgsWSBd60jbbAAAB"], 0, "Score added incorrectly");
      chai.assert.equal(users[gameCode]["scores"]["BEflthMRp9pD8y53AAAD"], 0, "Score added incorrectly");
      chai.assert.equal(users[gameCode]["scores"]["V1jyXOhS3zT2mok5AAAF"], 0, "Score added incorrectly");
      chai.assert.equal(lengthOfVip, 3, "Vip added incorrectly");
      chai.assert.equal(users[gameCode]["vip"][0], "9e-OHgsWSBd60jbbAAAB", "Score added incorrectly");
      chai.assert.equal(users[gameCode]["vip"][1], "BEflthMRp9pD8y53AAAD", "Score added incorrectly");
      chai.assert.equal(users[gameCode]["vip"][2], "V1jyXOhS3zT2mok5AAAF", "Score added incorrectly");
      chai.assert.equal(submittedAnswersInDict, true, "submittedAnswers added incorrectly");
      chai.assert.equal(users[gameCode]["category"], category, "Category added incorrectly");
    });
  
  });