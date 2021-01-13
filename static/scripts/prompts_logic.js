let Prompts = require("../../models/prompt");

/**
 * Create a new prompt object using the Prompt model/
 * 
 * @param {string} cat The name of the category.
 * @param {array} promptsInput The questions.
 * @returns {object} The prompt object to save to the database.
 */
function createNewPrompt(cat, promptsInput) {
    let prompts = new Prompts({
        category: cat,
        questions: promptsInput
    });

    return prompts;
}

/**
 * Get all of the categories in the database.
 * 
 * @returns {object} All of the categories in the database.
 */
async function getAllCategories() {
    let categories = Prompts.find().select("category -_id");
    return categories;
}

/**
 * Get the questions of the specified category.
 * 
 * @param {string} selectedCategory The category selected by the client.
 * @returns {object} The document containing the questions in the category.
 */
async function getCategoryPrompts(selectedCategory) {
    let questions = await Prompts.findOne({category: selectedCategory});
    return questions;
}

/**
 * Store the custom question set and category title in the database as a new document.
 * 
 * @param {object} promptInputs The prompt object created by the createNewPropt function.
 * @returns {string} If there is a duplicate error return an error string.
 */
async function putPromptsToDb(promptInputs) {
    try {
        await promptInputs.save();
    }
    catch (err) {
        if (err.code == 11000) {
            return "duplicate category error";
        }
    }
}

module.exports.createNewPrompt = createNewPrompt;
module.exports.getAllCategories = getAllCategories;
module.exports.getCategoryPrompts = getCategoryPrompts;
module.exports.putPromptsToDb = putPromptsToDb;