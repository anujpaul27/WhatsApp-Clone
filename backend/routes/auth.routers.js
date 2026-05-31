const express = require('express')
const authRoute = express.Router()
const authController = require('../controllers/auth.controllers')
const authMiddleware = require('../middleware/auth.middleware')
const { multerMiddleware } = require('../config/cloudinary.config')


// routes
authRoute.post('/send-otp',authController.sendOtp)
authRoute.post('/verify-otp', authController.verifyOtp)
authRoute.get('/logout', authController.logout)


// protected routes
authRoute.put('/update-profile', authMiddleware, multerMiddleware, authController.updateProfile)
authRoute.get('/check-auth', authMiddleware, authController.checkAuthentication)
authRoute.get('/users', authMiddleware, authController.getAllUser)

module.exports = authRoute