const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    phoneNumber: {
        type: String,
        unique: true,
        parse: true,
    },
    phoneSuffix: {
        type: String,
        unique: false,
    },
    username: {type: String},
    email: {
        type: String,
        lowercase: true,
        validate: {
            validator: function (v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: 'Invalid Email Addresss.'
        }
    },
    emailOpt: {type:String},
    emailOptExpiry: {type: Date},
    profilePicture: {type: String},
    about: {type: String},
    lastSeen: {type: Date},
    isonline: {type: Boolean, default: false},
    isVerified: {type: Boolean, default: false},
    agreed: {type: Boolean, default: false},

}, {timestamps: true})


const userModel = mongoose.model('users', userSchema)
module.exports = userModel
