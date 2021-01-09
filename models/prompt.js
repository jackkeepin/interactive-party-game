let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let promptsSchema = new Schema({
    category: {
        type: String,
        unique: true,
        required: true
    },
    questions: [{
        type: String,
        required: true
    }]
});

let Prompts = mongoose.model("Prompts", promptsSchema);
module.exports = Prompts;