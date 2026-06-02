const mongoose = require('mongoose')

const statusSchema = new mongoose.Schema({
    user: {
        type:mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    contentType: {
        type: String,
        enum: ['image','video','text']
    },
    viewers: [{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'users',
    }],
    expiresAt: {
        type: Date,
        required:true
    }
},{timesStamp: true})

const statusModel = mongoose.model('status',statusSchema)

module.exports = statusModel