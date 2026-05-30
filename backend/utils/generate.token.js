const jwt = require('jsonwebtoken')

const createTokenWithJWT = (userID) =>
{
    const token = jwt.sign(
        {userID},
        process.env.JWT_SECRET,
        {expiresIn: '1y'}
    )
    return token
}

module.exports = createTokenWithJWT
