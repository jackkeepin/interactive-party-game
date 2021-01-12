let chai = require("chai");
let gameLogic = require("../static/scripts/game_logic");

suite("Test game_logic", function() {

  /**
   * Test function to generate new game code if the previously generated on
   * is already in use.
   */
  test("Test generateNewGameCode", function() {
    let gameCode = 3311;
    let users = {gameCode: {} };

    let newGeneratedCode = gameLogic.generateNewGameCode(true, users);


    chai.assert.notEqual(gameCode, newGeneratedCode, "new code should be different");
    chai.assert.equal(newGeneratedCode.length, 4, "new code should be 4 digits long");
  });

  /**
   * Test function to validate clients joining a game with no errors.
   */
  test("Test validateJoinGame new game", function() {
    let users = {};
    let gameCode = 2211;
    let gameCreator = "true";

    let validateJoinGameResponse = gameLogic.validateJoinGame(gameCode, users, gameCreator);

    let isRoomExist = (gameCode in users);

    chai.assert.equal(validateJoinGameResponse, null, "Should recieve null")
    chai.assert.equal(isRoomExist, true, "The room code has not beed added to the dictionary");
  });

  /**
   * Test function to validate clients joining a game with game code alreday in use error.
   */
  test("Test validateJoinGame new game code", function() {
    let users = {2211: {}};
    let gameCode = 2211;
    let gameCreator = "true";

    let validateJoinGameResponse = gameLogic.validateJoinGame(gameCode, users, gameCreator);

    let isRoomExist = (gameCode in users);

    chai.assert.equal(validateJoinGameResponse[0], "new game code", "Should recieve new game code")
    chai.assert.equal(validateJoinGameResponse[1].length, 4, "New game code should be 4 digits")
    chai.assert.equal(isRoomExist, true, "The room code has not beed added to the dictionary");
  });

  /**
   * Test function to validate clients joining a game with invalid game code error.
   */
  test("Test validateJoinGame invalid game code", function() {
    let users = {2211: {}};
    let gameCode = 3311;
    let gameCreator = "false";

    let validateJoinGameResponse = gameLogic.validateJoinGame(gameCode, users, gameCreator);

    chai.assert.equal(validateJoinGameResponse[0], "invalid game code", "Should recieve invalid game code")
  });

  /**
   * Test function to set nickname of a client.
   */
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

  /**
   * Test function to validate starting a game if there are no errors.
   */
  test("Test validateGame", function() {
    let cat = "Random";
    let gameCode = 4021;
    let users = {
      4021: {
        "users": {
          "qX4ylqadvprl3fITAAAB": 'Player 1',
          "xKKSEm75Xx_mLLqGAAAD": 'Player 2',
          "ncYQCAkMKJ5vA3xJAAAJ": 'Player 3'
        },
        "category": "Random",
      }  
    }

    let err = gameLogic.validateGame(cat, gameCode, users);

    chai.assert.equal(err, null, "There should be no errors.")
  });

  /**
   * Test function to validate starting a game if there aren't enough players.
   */
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

  /**
   * Test function to validate starting a game if a category hasn't been selected.
   */
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

  /**
   * Test function to validate starting a game if a username hasn't been selected.
   */
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

  /**
   * Test function that adds attributes to users dict to use in a game.
   */
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

  /**
   * Test function to get the socketId of the cleient that is the VIP.
   */
  test("Test getVipSocketId", function() {
    let gameCode = 5490;
    let users = {
      5490: {
        users: {
          Y7KAWy6VnGkMeF6fAAAH: 'oone',
          bT3qIPITx_gzorYVAAAJ: 'two',
          R8NnhBhJzo98DzleAAAL: 'three'
        },
        scores: {
          Y7KAWy6VnGkMeF6fAAAH: 0,
          bT3qIPITx_gzorYVAAAJ: 0,
          R8NnhBhJzo98DzleAAAL: 0
        },
        vip: [
          'Y7KAWy6VnGkMeF6fAAAH',
          'bT3qIPITx_gzorYVAAAJ',
          'R8NnhBhJzo98DzleAAAL'
        ],
        submittedAnswers: {},
        category: 'Random',
        prompts: [
          "What do dogs frequently think about?",
          "What would you never want to hear during a pilot announcement?",
          "If you were to start a candle making company, what would your speciality scent be?",
          "What’s a good sign that your house is haunted?",
          "What’s a rejected flavour of crisps by Walkers?",
          "Aliens are here. They want ___.",
          "Ew, grandpa smells like ___.",
          "All I want for Christmas is ___.",
          "What’s fun and games until someone gets hurt?",
          "In yet another lockdown, my friends and I once again started playing online ___."
        ]
      }
    }

    let vipSocketId = gameLogic.getVipSocketId(gameCode, users);

    let vipSocketIdInVip = (vipSocketId  in users[gameCode]["vip"]);

    let vipSocketIdInCurrentVip = false
    if (users[gameCode]["currentVip"] != "") {
      vipSocketIdInCurrentVip = true;
    }

    chai.assert.equal(vipSocketIdInVip, false, "vip socket id should have been removed from vip key");
    chai.assert.equal(vipSocketIdInCurrentVip, true, "vip socket id should be in new currentVip key");
  });

  /**
   * Test function that selects a random prompt.
   */
  test("Test selectRandomPrompt", function() {
    let gameCode = 5490;
    let users = {
      5490: {
        users: {
          Y7KAWy6VnGkMeF6fAAAH: 'oone',
          bT3qIPITx_gzorYVAAAJ: 'two',
          R8NnhBhJzo98DzleAAAL: 'three'
        },
        scores: {
          Y7KAWy6VnGkMeF6fAAAH: 0,
          bT3qIPITx_gzorYVAAAJ: 0,
          R8NnhBhJzo98DzleAAAL: 0
        },
        vip: [ 'Y7KAWy6VnGkMeF6fAAAH', 'R8NnhBhJzo98DzleAAAL' ],
        submittedAnswers: {},
        category: 'Random',
        prompts: [
          "What do dogs frequently think about?",
          "What would you never want to hear during a pilot announcement?",
          "What’s a good sign that your house is haunted?",
          "What’s a rejected flavour of crisps by Walkers?",
          "All I want for Christmas is ___.",
          "What’s fun and games until someone gets hurt?",
        ],
        currentVip: 'bT3qIPITx_gzorYVAAAJ'
      }
    }

    let promptsLengthBefore = users[gameCode]["prompts"].length;
    let selectedPrompt = gameLogic.selectRandomPrompt(gameCode, users);
    let promptsLengthAfter = users[gameCode]["prompts"].length

    let promtpLengthDiff = promptsLengthBefore - promptsLengthAfter;

    chai.assert.equal(promtpLengthDiff, 1, "selected prompt not removed from prompts key");
    chai.assert.isNotNull(selectedPrompt, "Selected prompt should not be null");
    chai.assert.notEqual(selectedPrompt, "", "Selected prompt should not be empty");
  });

  /**
   * Test function that handles situation when there are no prompts left to select.
   */
  test("Test selectRandomPrompt no prompts left", function() {
    let gameCode = 5490;
    let users = {
      5490: {
        users: {
          Y7KAWy6VnGkMeF6fAAAH: 'oone',
          bT3qIPITx_gzorYVAAAJ: 'two',
          R8NnhBhJzo98DzleAAAL: 'three'
        },
        scores: {
          Y7KAWy6VnGkMeF6fAAAH: 0,
          bT3qIPITx_gzorYVAAAJ: 0,
          R8NnhBhJzo98DzleAAAL: 0
        },
        vip: [ 'Y7KAWy6VnGkMeF6fAAAH', 'R8NnhBhJzo98DzleAAAL' ],
        submittedAnswers: {},
        category: 'Random',
        prompts: [],
        currentVip: 'bT3qIPITx_gzorYVAAAJ'
      }
    }

    let selectedPrompt = gameLogic.selectRandomPrompt(gameCode, users);

    chai.assert.equal(selectedPrompt, "_End Game Event_", "Should get end game event");
  });

  /**
   * Test function that stores a submitted answer from a client but 
   * other clients are yet to submit their answers.
   */
  test("Test storeSubmittedAnswer not all answers", function() {
    let category = "Random";
    let gameCode = 2660;
    let answer = "Answer 1";
    let socketId = "EsjpDj7ljrfnFqu_AAAH";

    users = {
      2660: {
        "users": {
          '9e-OHgsWSBd60jbbAAAB': 'player one',
          "EsjpDj7ljrfnFqu_AAAH": 'player two',
          "V1jyXOhS3zT2mok5AAAF": 'player three'
        }
      }
    }

    gameLogic.readyDictForGame(users, gameCode, category);

    let isAnswersReceived = gameLogic.storeSubmittedAnswer(gameCode, users, answer, socketId);
    let storedAnswer = users[gameCode]["submittedAnswers"][socketId];


    chai.assert.equal(isAnswersReceived, false, "Not all answers recieved yet");
    chai.assert.equal(storedAnswer, answer, "Stored answer isn't the same as what was recieved");
  });

  /**
   * Test function that stores a submitted answer and all clients have now 
   * submitted their answers.
   */
  test("Test storeSubmittedAnswer all answers", function() {
    let category = "Random";
    let gameCode = 2660;
    let answer = "Answer 1";
    let socketId = "BEflthMRp9pD8y53AAAD";
    let answer2 = "Answer 2";
    let socketId2 = "V1jyXOhS3zT2mok5AAAF";

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

    let isAnswersReceived = gameLogic.storeSubmittedAnswer(gameCode, users, answer, socketId);
    
    isAnswersReceived = gameLogic.storeSubmittedAnswer(gameCode, users, answer2, socketId2);

    let numOfAnswers = Object.keys(users[gameCode]["submittedAnswers"]).length;

    chai.assert.equal(isAnswersReceived, true, "All answers should be recieved");
    chai.assert.equal(numOfAnswers, 2, "There should be two answers");
    chai.assert.equal(users[gameCode]["submittedAnswers"][socketId], answer, "First answer doesn't match what was submitted");
    chai.assert.equal(users[gameCode]["submittedAnswers"][socketId2], answer2, "Second answer doesn't match what was submitted");
  });

  /**
   * Test functon to sort the scoes in descending order to be displayed in order
   * by the clients.
   */
  test("Test sort scores", function() {
    let scores = {
      "LkQ8YQR94HkOl_S4AAAH": 2,
      "O0da1pPsObddb4rIAAAJ": 1,
      "lkIIqeKz-tQDq_GpAAAL": 3
    }

    let expected = [
      ["lkIIqeKz-tQDq_GpAAAL", 3],
      ["LkQ8YQR94HkOl_S4AAA", 2],
      ["O0da1pPsObddb4rIAAAJ", 1],
    ]

    sortedScores = gameLogic.sortScores(scores);

    chai.assert(sortedScores, expected, "Scored not sorted correctly");
  });

  });