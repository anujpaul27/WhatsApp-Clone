const userModel = require("../models/user.model");
const optGenerate = require("../utils/opt.generator");
const response = require("../utils/response.handler");


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

        await user.save()
        return response (res,200,'OTP sent your number.', user)
    }
    catch(err)
    {
        console.error(err);
        return response(res,500, 'Internal server error.')
    }

}
