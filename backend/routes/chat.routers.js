const express = require('express')
const chatRouter = express.Router()
const chatController = require('../controllers/chat.controller')
const authMiddleware = require('../middleware/auth.middleware')
const { multerMiddleware } = require('../config/cloudinary.config')

// private routes
chatRouter.post('/send-message', authMiddleware,multerMiddleware, chatController.sendMessage)
chatRouter.get('/conversations', authMiddleware, chatController.getConversation)
chatRouter.get('/conversations/:conversationId/message', authMiddleware, chatController.getMessage)

chatRouter.put('/message/read', authMiddleware, chatController.markAsRead)
chatRouter.delete('/message/:messageId', authMiddleware, chatController.deleteMessage)

module.exports = chatRouter
