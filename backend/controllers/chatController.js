const { uploadFileToCloudinary } = require('../config/cloudinary.config');
const Conversation = require('../models/conversation.model');
const response = require('../utils/response.handler');
const Message = require('../models/message.model')


exports.sendMessage = async (req,res) => 
{
    try
    {
        const {senderId, receiverId, content, messageStatus } = req.body;
        const file = req.file;

        const participants = [senderId, receiverId].sort()

        // check if conversation allready exist 

        let conversation = await Conversation.findOne({
            participants,
        })

        if (!conversation)
        {
            conversation = new Conversation({participants})
            await conversation.save()
        }
        let imageOrVideoUrl = null;
        let contentType = null;

        // handle file upload 
        if (file)
        {
            const uploadFile = await uploadFileToCloudinary(file)

            if (!uploadFile?.secure_url)
            {
                return response(res,400, 'Failed Image upload to cloudinary ')
            }
            imageOrVideoUrl = uploadFile?.secure_url

            if (file.mimetype.startwith('image'))
            {
                contentType='image'
            }
            else if (file.mimetype.startwith('video'))
            {
                contentType = 'video'
            }
            else 
            {
                return response(res,400, 'Unsupported file type')
            }
        }
        else if (content?.trim())
        {
            contentType = 'text'
        }
        else 
        {
            return response(res,400, 'Message Content user is required.')
        }

        const message = new Message({
            conversation: conversation?._id,
            sender: senderId,
            receiver: receiverId,
            content,
            contentType,
            imageOrVideoUrl,
            messageStatus
        })
        await message.save()

        if (message?.content)
        {
            conversation.lastMessage = message?.id
        }
        conversation.unreadCount+=1;
        await conversation.save()

        const populateMessage = await Message.findOne(message?._id)
        .populate("sender", "username profilePicture")
        .populate("receiver", "username profilePicture")

        return response(res,201,'Message send successfully.', {populateMessage})
    }
    catch (err )
    {
        console.error(err)
        return response(res,500,'Internal Server Error!.')
    }
}

