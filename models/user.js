const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
    fullName: {
        type: String
    },
    email: {
        type: String
    },
    status : {
        type : String
    },
    userImage: {
        type: String,
        default: 'default.png'
    },
    facebook: {
        type: String,
        default: ''
    },
    fbTokens: Array
});

var User = mongoose.model("user", UserSchema);
module.exports = { User };


