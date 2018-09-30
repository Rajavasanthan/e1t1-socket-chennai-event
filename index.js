const express = require('express');
const app = express();
const mongoose = require('mongoose');

const socketIO = require('socket.io');
const http = require('http');
const server = http.createServer(app);
const io = socketIO(server);
const sharedSession = require('express-socket.io-session');


const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const FacebookStatergy = require('passport-facebook').Strategy;
mongoose.Promise = global.Promise;

mongoose.connect("mongodb://vasanth:vasanth7788@ds119273.mlab.com:19273/e1t1-chennai-socket");
var { User } = require('./models/user');
const passport = require('passport');

app.set('view engine', 'ejs');
app.set('port', 3005);
app.use(express.static('public'));

var chatSession = session({
    secret: 'SomeSecretInformation',
    resave: true,
    saveUninitialized: true,
    store: new MongoStore({ mongooseConnection: mongoose.connection })
});


io.use(sharedSession(chatSession, {
    autoSave: true
}));

io.on('connection', function (socket) {
    console.log("Connected");
    if(socket.handshake.session.passport){
        User.findByIdAndUpdate(socket.handshake.session.passport.user, { $set: { status: 'Online', socketId: socket.id } })
        .populate('friends')
        .populate('friendRequest')
        .then(function (user) {
            io.to(socket.id).emit('userList', user.friends);
            io.to(socket.id).emit('newFriendRequest', user.friendRequest);
            user.friends.forEach(function (friend) {
                if (friend.socketId !== null) {
                    io.to(friend.socketId).emit('newMemberOnline', user);
                }
            }, this);
        })
    }

    // io.to(socket.id).emit('newFriendRequest','You got new Friend request')

    socket.on("disconnect", function () {
        console.log("Disconnected");
    });
});

app.use(chatSession);
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    });
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.redirect('/register');
}

passport.use(new FacebookStatergy({
    clientID: process.env.FB_CLIENT_ID || '369458576832405',
    clientSecret: process.env.FB_SECRET || 'ec7a902660045d79e3606088dfe8389d',
    profileFields: ['email', 'displayName', 'photos'],
    callbackURL: process.env.FB_CALLBACK || 'http://localhost:' + app.get('port') + '/auth/facebook/callback',
    passReqToCallback: true,
    enableProof: true
}, (req, token, refreshToken, profile, done) => {
    User.findOne({ facebook: profile.id }).then((user) => {
        if (user) {
            return done(null, user);
        } else {
            var newUser = new User({
                facebook: profile.id,
                fullName: profile.displayName,
                email: profile._json.email,
                userImage: 'https://graph.facebook.com/' + profile.id + '/picture?type=large',
            });
            newUser.fbTokens.push({ token: token });
            newUser.save().then((user) => {
                done(null, user);
            }).catch((err) => {
                console.log(err);
            });
        }
    }).catch((err) => {
        console.log(err);
    });
}));

app.get("/", isLoggedIn, function (req, res) {
    res.render("chat");
});

app.get("/register", function (req, res) {
    res.render("register")
});

app.get('/auth/facebook', passport.authenticate('facebook', {
    scope: 'email'
}));

app.get('/auth/facebook/callback', passport.authenticate('facebook', {
    successRedirect: '/',
    failureRedirect: '/register'
}));

app.get('/logout', (req, res) => {
    req.logout();
    req.session.destroy();
    return res.redirect('/register');
});

server.listen(app.get('port'), function () {
    console.log("App listening in port " + app.get('port'))
});


