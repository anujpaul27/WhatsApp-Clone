const twilio = require('twilio')

const accountSid = process.env.TWILIO_ACCOUNT_SID
const serviceSid = process.env.TWILIO_SERVICE_SID
const authToken = process.env.TWILIO_AUTH_TOKEN

const client = twilio(accountSid,authToken)

//send OTP to phone number
const sendOtpPhoneNumber = async (phoneNumber) =>
{
    try
    {
        console.log('Sending OTP to this number', phoneNumber);
        if (!phoneNumber)
        {
            throw new Error ('Phone Number is required.')
        }
        const response = await client.verify.v2.services(serviceSid).verifications.create({
            to: phoneNumber,
            channel: 'sms'
        })
        console.log('This is my otp send response', response);
        return response 
    }
    catch (err)
    {
        console.log('Failed send to OTP');
        throw new Error('Failed send to OTP')
    }
}

// OTP verify 
const otpVerify =  (phoneNumber, otp)=>
{
    try
    {
        console.log('This is my opt ',otp )
        console.log('This is my phone number ',phoneNumber )

        const response = await client.verify.v2.services(serviceSid).verificationChecks.create({
            to: phoneNumber,
            code: otp,
        })
        console.log('This is my otp verify response', response )
        return response 
    }
    catch(err)
    {
        console.error(err)
        throw new Error ('Otp verification failed')
    }
}

module.exports = {
    sendOtpPhoneNumber,
    otpVerify
}