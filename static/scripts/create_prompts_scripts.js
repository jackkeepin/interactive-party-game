
$(function() {

    let socket = io();

    //When the user clicks the plus button add a new text input
    $(document).on("click", ".addPromptButton", function() {
        let promptImp = $(this).prev("input").val();
        if (promptImp == "") {
            return;
        }
        $("#newPromptDataBox").append('<div class="promptInputDiv"><input type="text" maxLength="100" class="promptInput" placeholder="Enter question" value="' + promptImp + ' "><button class="removePromptButton">-</button></div>');
        $(this).prev("input").val("");
    });

    //When the user clicks the minus button remove the question next to it
    $(document).on("click", ".removePromptButton", function() {
        $(this).closest(".promptInputDiv").remove();
    });

    //When the client clicks submit, validate the data and send to server
    $(document).on("click", "#submitPromptDataButton", function() {
        let cat = $("#categoryInput").val();
        if (cat == "") {
            alert("You must enter a category!");
            return;
        }

        let inpPrompts = [];
        $(".promptInputDiv .promptInput").each(function() {
            let dat = $(this).val();
            if (dat != "") {
                inpPrompts.push(dat)
            }
        });

        if (inpPrompts.length == 0) {
            alert("You haven't entered any questions!")
            return;
        }
        
        socket.emit("create prompt set", [cat, inpPrompts]);
    });

    //If the server sends duplicate category error, display error to user
    socket.on("duplicate category error", function(data) {
        alert("That category already exists! Please enter a new category name.");
    });

    //When the server has sucessfully added to the database, display message to user and return to home page
    socket.on("prompt created", function(data) {
        alert("Prompt set sucesfully created! You will now be redirected to the home page.");
        location.href = "/";
    });
}); 
