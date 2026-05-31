const express = require('express')
const authRoute = express.Router()
const authController = require('../controllers/auth.controllers')

authRoute.post('/send-otp',authController.sendOtp)
authRoute.post('/verify-otp', authController.verifyOtp)


module.exports = authRoute