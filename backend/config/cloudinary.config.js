const cloudinary = require('cloudinary')
require('dotenv').config()
const fs = require('fs')
const multer = require('multer')

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
})

const uploadFileToCloudinary = (file) =>
{
    const option = {
        resource_type: file.mimetype.startWith('video') ? 'video' : 'image'
    }

    return new Promise((resolve,reject )=> {
        const uploader = file.mimetype.startWith('video') ? cloudinary.uploader.upload_large : cloudinary.uploader.upload;
        uploader(file.path, option, (error, result)=>{
            fs.unlink(file.path, ()=> {})
            if (error)
            {
                return reject(error)
            }
            resolve(result)
        })
    })
}

const multerMiddleware = multer({dest:'uploads'}).single('media');

module.exports = {
    uploadFileToCloudinary,
    multerMiddleware
}