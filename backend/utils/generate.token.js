const jwt = require('jsonwebtoken')

const createTokenWithJWT = (userId) =>
{
    const token = jwt.sign(
        {userId},
        process.env.JWT_SECRET,
        {expiresIn: '1y'}
    )
    return token
}

module.exports = createTokenWithJWT
