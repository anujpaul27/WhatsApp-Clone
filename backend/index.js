const express = require('express')
const cors = require('cors')
const connectDB = require('./config/db.connect')
require('dotenv').config()
const app = express()
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const authRoute = require('./routes/auth.routers')
const chatRoute = require('./routes/chat.routers')

// Middleware
app.use(cors())         // request from another API
app.use(express.json()) // parse body data 
app.use(cookieParser()) // parse toke on every request 
app.use(bodyParser.urlencoded({extended: true})) // 

// Connect to MongoDB
connectDB()


// routes 
app.use('/api/auth', authRoute)
app.use('/api/chat', chatRoute)


app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`)
})