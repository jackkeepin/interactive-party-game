let Prompts = require("../../models/prompt");

function createNewPrompt(cat, promptsInput) {
    let prompts = new Prompts({
        category: cat,
        questions: promptsInput
    });

    return prompts;
}

function putPromptsToDb(prompts) {
    prompts.save()
        .then(function(result) {
            console.log(result);
            return(result);
        });
}

module.exports.createNewPrompt = createNewPrompt;
module.exports.putPromptsToDb = putPromptsToDb;