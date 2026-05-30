const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    // why it is array?.. participant are two user sender and receiver 
    participants: [{type: mongoose.Schema.Types.ObjectId, ref: 'users'}],
    lastMessage: {type: mongoose.Schema.Types.ObjectId, ref: 'message'},
    unreadCount: {
        type: Number,
        default: 0,
    }
    
}, {timestamp:true})


const conversationModel = mongoose.model('conversation', conversationSchema)
module.exports = conversationModel 