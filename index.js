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
var { Message } = require('./models/messages');
const passport = require('passport');

app.set('view engine', 'ejs');
app.set('port', process.env.port || 3005);
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
    if (socket.handshake.session.passport) {
        User.findByIdAndUpdate(socket.handshake.session.passport.user, { $set: { status: 'Online', socketId: socket.id } })
            .populate('friends')
            .populate('friendRequest')
            .then(function (user) {
                io.to(socket.id).emit('userList', user.friends);
                io.to(socket.id).emit('newFriendRequest', user.friendRequest);
                user.friends.forEach(function (friend) {
                    if (friend.socketId !== null) {
                        console.log("newMemberOnline")
                        io.to(friend.socketId).emit('newMemberOnline', user);
                    }
                }, this);
            })
    }

    app.get("/get_msg_by_friendid/:friendId", function (req, res) {
        Message.find({
            participents: {
                $all: [req.user._id, req.params.friendId]
            }
        })
            .populate('sentBy', { _id: 1, userImage: 1 })
            .populate('recivedBy', { _id: 1, userImage: 1 })
            .exec()
            .then((message) => {
                return User.findByIdAndUpdate(req.user._id, { $set: { currentFriend: req.params.friendId } }).then((currentUser) => {
                    return { message }
                });
            })
            .then((data) => {
                res.json(data.message);
            })
    });
    // io.to(socket.id).emit('newFriendRequest','You got new Friend request')

    socket.on('newMessage', (message, callback) => {
        var newMessage = new Message({
            participents: [
                socket.handshake.session.passport.user,
                message.to
            ],
            message: message.message,
            sentBy: socket.handshake.session.passport.user,
            recivedBy: message.to
        });

        newMessage.save().then((savedMessage) => {

            return Message.populate(savedMessage,
                [{
                    path: 'sentBy',
                    select: {
                        _id: 1,
                        userImage: 1
                    }
                },
                {
                    path: 'recivedBy',
                    select: {
                        _id: 1,
                        userImage: 1
                    }
                }]
            ).then((populatedMessage) => {
                // console.log(populatedMessage);
                return populatedMessage
            })
            callback("Done");
        }).then((populatedMessage) => {
            return User.findById(message.to)
                .populate('currentFriend', { _id: 1, socketId: 1 })
                .then((toUser) => {
                    return { toUser, populatedMessage };
                })
        })
            .then((toUserWithPopulatedMessage) => {
                console.log(toUserWithPopulatedMessage.toUser.currentFriend);
                if (toUserWithPopulatedMessage.toUser.currentFriend._id == socket.handshake.session.passport.user) {
                    // console.log('Send Message');
                    io.to(toUserWithPopulatedMessage.toUser.socketId).emit('newMessageRecived', toUserWithPopulatedMessage.populatedMessage);
                } else {
                    io.to(toUserWithPopulatedMessage.toUser.socketId).emit('updateUserList', toUserWithPopulatedMessage.populatedMessage);
                }
                callback(toUserWithPopulatedMessage.populatedMessage);
            })
    });

    socket.on("disconnect", function () {
        if (socket.handshake.session.passport) {
            User.findByIdAndUpdate(socket.handshake.session.passport.user, { $set: { status: 'Offline', socketId: null } })
                .populate('friends')
                .then(function (user) {
                    console.log("User Logged Out");
                    user.friends.forEach(function (friend) {
                        if (friend.socketId !== null) {
                            console.log("newMemberOffline")
                            io.to(friend.socketId).emit('newMemberOffline', user);
                        }
                    }, this);
                })
        }
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


