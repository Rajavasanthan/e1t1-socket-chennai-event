const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
    fullName: {
        type: String
    }
});

var User = mongoose.model("user", UserSchema);
module.exports = { User };


