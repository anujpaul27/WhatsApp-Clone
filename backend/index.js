const express = require('express')
const cors = require('cors')
const connectDB = require('./config/db.connect')
require('dotenv').config()
const app = express()
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const authRoute = require('./routes/auth.routers')
const chatRoute = require('./routes/chat.routers')
const http = require('http')
const initializeSocket = require('./services/socket.services')

const corsOptions = {
    origin: process.env.FRONTEND_URL,
    credentials: true,     // Allow cookies to be sent
}
app.use(cors(corsOptions)) // request from another API



// Middleware
app.use(express.json()) // parse body data 
app.use(cookieParser()) // parse toke on every request 
app.use(bodyParser.urlencoded({extended: true})) // 



// Create HTTP server and initialize Socket.io
const server = http.createServer(app)
const io=initializeSocket(server)

// apply socket middleware before routes
app.use((req,res,next)=> {
    req.io = io;
    req.socketUserMap = io.socketUserMap;
    next();
})




// Connect to MongoDB
connectDB()


// routes 
app.use('/api/auth', authRoute)
app.use('/api/chat', chatRoute)


app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`)
})