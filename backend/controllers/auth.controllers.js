const userModel = require("../models/user.model");
const sendOtpToEmail = require("../services/email.services");
const optGenerate = require("../utils/opt.generator");
const response = require("../utils/response.handler");
const twilioServices = require('../services/twilio.services');
const createTokenWithJWT = require("../utils/generate.token");
const { uploadFileToCloudinary } = require("../config/cloudinary.config");


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
            user.emailOtp = otp
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
            if (!phoneNumber || !phoneSuffix)
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
        res.cookie('auth_token', token, {
            httpOnly: true,
            maxAge: 1000* 60 * 60 * 24 * 365
        })
        return response(res,200, 'OTP verified successful.', {token,user})
    }
    catch (error)
    {
        console.error(error.message)
        return response(res,500, 'Interval Server Error.')
    }
}


// user profile update
const updateProfile = async (req,res) => 
{
    const {username,agreed, about} = req.body;
    const userId = req.user.userID;
    try
    {
        const user = await  userModel.findById(userId);
        const file = req.file;
        if (file)
        {
            const uploadResult = await uploadFileToCloudinary(file)
            console.log(uploadResult)
            user.profilePicture = uploadResult?.secure_url
        } else if (req.body.profilePicture)
        {
            user.profilePicture = req.body.profilePicture
        }

        if (username) user.username = username
        if (agreed) user.agreed = agreed
        if (about) user.about = about
        await user.save()
        return response(res,200, 'User Profile update successful.',user)
    }
    catch (err)
    {
        console.error(err)
        return response(res,500,'Internal Server Error.')
    }
}


//logOut
const logout = (req,res)=>
{
    try
    {
        res.cookie('auth_token','',{expired: new Date(0)})
        return response(res,200,'user logout successful.')
    }
    catch (err)
    {
        console.error(err.message)
        return response (res, 500, 'Internal server error!.')

    }
}

module.exports = {
    sendOtp,
    verifyOtp,
    updateProfile,
    logout,
}
