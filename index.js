const express = require('express');
const app = express();
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

mongoose.connect("mongodb://vasanth:vasanth7788@ds119273.mlab.com:19273/e1t1-chennai-socket");
var { User } = require('./models/user');

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get("/",function(req,res){
    res.send("Hello World!");
});

app.get("/register",function(req,res){
    res.render("register");
});

app.listen(3002,function(){
    console.log("App listening in port 3002")
});


