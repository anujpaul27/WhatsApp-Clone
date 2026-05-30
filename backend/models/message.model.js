const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
    conversation: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'conversation',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'users',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'users',
        required: true
    },
    content: {type: String},
    imageOrVideoUrl: {type:String},
    contentType: {type: String, enum: ['image', 'video', 'text']},
    reaction: [{
        user: {type: mongoose.Schema.Types.ObjectId, ref: 'users'},
        emoji: {type: String}
    }],
    messageStatus: {type: String, default: 'send'}
}, {timeStamp: true})

const messageModel = mongoose.model('message', messageSchema)
module.exports = messageModel 