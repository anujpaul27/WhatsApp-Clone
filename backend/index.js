const express = require('express')
const cors = require('cors')
const connectDB = require('./config/db.connect')
require('dotenv').config()
const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Connect to MongoDB
connectDB()


app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`)
})