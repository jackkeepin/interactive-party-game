
$(function() {

    let socket = io();

    $(document).on("click", ".addPromptButton", function() {
        let promptImp = $(this).prev("input").val();
        if (promptImp == "") {
            return;
        }
        $("#newPromptDataBox").append('<div class="promptInputDiv"><input type="text" maxLength="100" class="promptInput" placeholder="Enter question" value="' + promptImp + ' "><button class="removePromptButton">-</button></div>');
        $(this).prev("input").val("");
    });

    $(document).on("click", ".removePromptButton", function() {
        $(this).closest(".promptInputDiv").remove();
    });

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

    socket.on("prompt created", function(data) {
        alert("Prompt set sucesfully created! You will now be redirected to the home page.");
        location.href = "/";
    });
}); 
