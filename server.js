let express = require("express");
let http = require("http");
let path = require("path");
let socketio = require("socket.io");
let mongoose = require("mongoose");
const port = process.env.PORT || 9000;


let app = express();
// let server = http.createServer(app);

//Setup app to use EJS templates
app.set("views", path.join(__dirname, "resources/views"));
app.set("view engine", "ejs");

//Set up static files
app.use(express.static(path.join(__dirname, "resources/static")));


app.get("/", function(request, response) {
    response.render("index");
});

app.get("/new-game", function(request, response) {
    response.render("new_game");
})

app.get("/hello", function(request, response) {
    response.send("it worked oh yeah");
});

app.listen(port, function() {
    console.log("Listening on port " + port);
});


// let io = socketio(server);

// io.sockets.on("connection", function(socket) {
//     socket.on("create", function(room) {
//         socket.join(room);
//     });
// });