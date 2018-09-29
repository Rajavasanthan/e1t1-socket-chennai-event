const express = require('express');
const app = express();
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
mongoose.Promise = global.Promise;

mongoose.connect("mongodb://vasanth:vasanth7788@ds119273.mlab.com:19273/e1t1-chennai-socket");
var { User } = require('./models/user');

app.set('view engine', 'ejs');
app.use(express.static('public'));

var chatSession = session({
	secret: 'SomeSecretInformation',
	resave: true,
	saveUninitialized: true,
	store: new MongoStore({ mongooseConnection: mongoose.connection })
});

app.use(chatSession);

app.get("/", function (req, res) {
    res.send("Hello World!");
});

app.get("/register", function (req, res) {
    res.render("register")
});

app.listen(3002, function () {
    console.log("App listening in port 3002")
});


