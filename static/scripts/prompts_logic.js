let Prompts = require("../../models/prompt");

function createNewPrompt(cat, promptsInput) {
    let prompts = new Prompts({
        category: cat,
        questions: promptsInput
    });

    return prompts;
}

async function getAllCategories() {
    let categories = Prompts.find().select("category -_id");
    return categories;
}

async function getCategoryPrompts(selectedCategory) {
    let questions = await Prompts.findOne({category: selectedCategory});
    return questions;
}

async function putPromptsToDb(promptInputs) {
    await promptInputs.save();
}

module.exports.createNewPrompt = createNewPrompt;
module.exports.getAllCategories = getAllCategories;
module.exports.getCategoryPrompts = getCategoryPrompts;
module.exports.putPromptsToDb = putPromptsToDb;