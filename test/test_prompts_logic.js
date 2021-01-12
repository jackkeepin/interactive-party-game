let chai = require("chai");
let mongoose = require("mongoose");
let Prompts = require("../models/prompt");
let promptsLogic = require("../static/scripts/prompts_logic");

suite("Test prompts_logic", function() {

  test("Test createNewPrompt", function() {
    let cat = "test category";
    let promptInputs = ["first", "second"];

    let prompts = promptsLogic.createNewPrompt(cat, promptInputs);

    chai.assert.equal(prompts["questions"][0], "first", "Prompts incorrect");
    chai.assert.equal(prompts["questions"][1], "second", "Prompts incorrect");
    chai.assert.equal(prompts["category"], "test category", "Category incorrect");

  });

});



