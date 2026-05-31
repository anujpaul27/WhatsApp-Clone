const jwt = require('jsonwebtoken');
const response = require('../utils/response.handler');


const authMiddleware = (req,res,next) =>
{
    const token = req.cookies.auth_token;

    if(!token)
    {
        return response(res,401,'Token not found.')
    }

    try 
    {
        const decode = jwt.verify(token,process.env.JWT_SECRET) 
        req.user = decode;
        console.log('From Middle', req.user)
        next()
    }
    catch (err)
    {
        console.error(err.message)
        response(res,401,'invalid or expired token.')
    }
}

module.exports = authMiddleware