let chai = require("chai");
let mongoose = require("mongoose");
let Prompts = require("../models/prompt");
let promptsLogic = require("../static/scripts/prompts_logic");

let dbURI = "mongodb+srv://jkeepin:Password123@comp3006-cw.qgmz0.mongodb.net/interactive-party-game-prompts-tests?retryWrites=true&w=majority";

suite("Test prompts_logic", function() {

  /**
   * Before tests connect to database and add test data.
   */
  suiteSetup(async function() {
    await mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true });

    let cat = "Test category";
    let promptsInput = ["Question 1", "question 2"];
    let testPrompts = new Prompts({
      category: cat,
      questions: promptsInput
    });
    await testPrompts.save();

    let cat2 = "Second test category";
    let promptsInput2 = ["Question 3", "question 4", "Question 5"];
    testPrompts = new Prompts({
      category: cat2,
      questions: promptsInput2
    });
    await testPrompts.save();
  });

  /**
   * At the end of the tests drop the collection and close the connection.
   */
  suiteTeardown(async function() {
    await mongoose.connection.db.dropCollection("prompts");
    await mongoose.connection.close();
  })

  /**
   * Test function to create prompt using model to store in database.
   */
  test("Test createNewPrompt", function() {
    let cat = "test category";
    let promptInputs = ["first", "second"];

    let prompts = promptsLogic.createNewPrompt(cat, promptInputs);

    chai.assert.equal(prompts["questions"][0], "first", "Prompts incorrect");
    chai.assert.equal(prompts["questions"][1], "second", "Prompts incorrect");
    chai.assert.equal(prompts["category"], "test category", "Category incorrect");
  });

  /**
   * Test getAllCategories by retrieving test data stored in the database
   * during suiteSetup.
   */
  test("Test getAllCategories", async function() {
    let categories = await promptsLogic.getAllCategories();
    let firstCategory = categories[0]["category"];
    let secondCategory = categories[1]["category"];

    chai.assert.equal(firstCategory, "Test category", "Category not correct");
    chai.assert.equal(secondCategory, "Second test category", "Secondcategory not correct");
  });

  /**
   * Test getCategoryPrompts by retrieving prompts from database that were
   * added during suiteSetup.
   */
  test("Test getCategoryPrompts", async function() {
    let category = "Second test category";
    let categoryPrompts = await promptsLogic.getCategoryPrompts(category);

    let questions = categoryPrompts["questions"];
    let firstPrompt = questions[0];
    let secondPrompt = questions[1];
    let thirdPrompt = questions[2];
    
    chai.assert.equal(questions.length, 3, "Length of prompts incorrect");
    chai.assert.equal(firstPrompt, "Question 3", "First prompt incorrect");
    chai.assert.equal(secondPrompt, "question 4", "Second prompt incorrect");
    chai.assert.equal(thirdPrompt, "Question 5", "Third prompt incorrect");
  });

  /**
   * Test putPromptsToDb by creating a prompt set, then adding it to the database.
   * Then retrieve from the database and assert what was added during the test.
   */
  test("Test putPromptsToDb", async function() {
    let cat = "Test category for putPromptsToDb";
    let promptInputs = ["here's a question", "Here's another question."];

    let prompts = promptsLogic.createNewPrompt(cat, promptInputs);
    await promptsLogic.putPromptsToDb(prompts);

    let categoryPrompts = await promptsLogic.getCategoryPrompts(cat);
    let receivedCategory = categoryPrompts["category"];
    let recievedPrompts = categoryPrompts["questions"];

    chai.assert.equal(receivedCategory, "Test category for putPromptsToDb", "Category is incorrect");
    chai.assert.equal(recievedPrompts.length, 2, "Length of prompts incorrect");
    chai.assert.equal(recievedPrompts[0], "here's a question", "First prompt incorrect");
    chai.assert.equal(recievedPrompts[1], "Here's another question.", "Second prompt incorrect");
  });

  /**
   * Test putPromptsToDb by creating a prompt set with a duplicate category, then 
   * trying to add it to the database.
   */
  test("Test putPromptsToDb duplicate category", async function() {
    let cat = "Test category";
    let promptInputs = ["here's a question", "Here's another question."];

    let prompts = promptsLogic.createNewPrompt(cat, promptInputs);
    let response = await promptsLogic.putPromptsToDb(prompts);

    chai.assert.equal(response, "duplicate category error", "Should recieve duplicate category error");
  });

});



