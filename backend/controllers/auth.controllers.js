const userModel = require("../models/user.model");
const sendOtpToEmail = require("../services/email.services");
const optGenerate = require("../utils/opt.generator");
const response = require("../utils/response.handler");
const twilioServices = require('../services/twilio.services');
const createTokenWithJWT = require("../utils/generate.token");


// step-1 send OPT 
const sendOtp = async (req,res) =>
{
    const {phoneNumber,phoneSuffix,email} =req.body;
    const otp = optGenerate()
    const expiry = new Date(Date.now() + 5 * 60 *1000)
    let user;
    try{
        if (email)
        {
            user = await userModel.findOne({email})

            if (!user)
            {
                user = new userModel({email})
            }
            user.emailOtp = opt
            user.emailOtpExpire = expiry
            await user.save()
            await sendOtpToEmail(email,otp)
            return response(res,200,`OTP send to your email`, {email})
        }

        if (!phoneNumber || !phoneSuffix )
        {
            return response (res,400,'Phone number and phone suffix is required.')
        }

        const fullNumber = `${phoneSuffix}${phoneNumber}`
        user = await userModel.findOne({phoneNumber})

        if (!user)
        {
            user = await  new userModel({phoneNumber,phoneSuffix})
        }
        await twilioServices.sendOtpPhoneNumber(fullNumber)
        await user.save()
        return response (res,200,'OTP sent your number.', user)
    }
    catch(err)
    {
        console.error(err);
        return response(res,500, 'Internal server error.')
    }

}


// verify email OTP
const verifyOtp = async (req,res)=>
{
    const {phoneNumber,phoneSuffix,email,otp} = req.body;

    try
    {
        let user ;
        if (email)
        {
            user = await userModel.findOne({email})
            if (!user)
            {
                return response(res,404,'This email not register.')
            }
            const newDate = new Date()
            if (!user.emailOtp || String(user.emailOtp) !== String(otp) || newDate > new Date(user.emailOtpExpiry)) 
            {
                return response (res,400,'Invalid or expired otp')
            }
            user.isVerified = true;
            user.emailOtp = null;
            user.emailOtpExpiry = null;
            await user.save();
        }
        else 
        {
            if (!phoneNumber || phoneSuffix)
            {
                return response (res,400, 'Phone Number and phone suffix is required.')
            }

            const fullNumber = `${phoneSuffix}${phoneNumber}`
            user = await userModel.findOne({phoneNumber})

            if (!user)
            {
                return response(res,404,'User Not Found.')
            }
            const result = await twilioServices.otpVerify(fullNumber,otp)
            if (result.status !== 'approved')
            {
                return response (res,400, 'Invalid OTP')
            }
            user.isVerified = true,
            await user.save();
        }
        const token = createTokenWithJWT(user?._id)
    }
    catch (error)
    {

    }
}
