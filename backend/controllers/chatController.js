const { uploadFileToCloudinary } = require("../config/cloudinary.config");
const Conversation = require("../models/conversation.model");
const response = require("../utils/response.handler");
const Message = require("../models/message.model");

exports.sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, content, messageStatus } = req.body;
    const file = req.file;

    const participants = [senderId, receiverId].sort();

    // check if conversation allready exist

    let conversation = await Conversation.findOne({
      participants,
    });

    if (!conversation) {
      conversation = new Conversation({ participants });
      await conversation.save();
    }
    let imageOrVideoUrl = null;
    let contentType = null;

    // handle file upload
    if (file) {
      const uploadFile = await uploadFileToCloudinary(file);

      if (!uploadFile?.secure_url) {
        return response(res, 400, "Failed Image upload to cloudinary ");
      }
      imageOrVideoUrl = uploadFile?.secure_url;

      if (file.mimetype.startwith("image")) {
        contentType = "image";
      } else if (file.mimetype.startwith("video")) {
        contentType = "video";
      } else {
        return response(res, 400, "Unsupported file type");
      }
    } else if (content?.trim()) {
      contentType = "text";
    } else {
      return response(res, 400, "Message Content user is required.");
    }

    const message = new Message({
      conversation: conversation?._id,
      sender: senderId,
      receiver: receiverId,
      content,
      contentType,
      imageOrVideoUrl,
      messageStatus,
    });
    await message.save();

    if (message?.content) {
      conversation.lastMessage = message?.id;
    }
    conversation.unreadCount += 1;
    await conversation.save();

    const populateMessage = await Message.findOne(message?._id)
      .populate("sender", "username profilePicture")
      .populate("receiver", "username profilePicture");

    return response(res, 201, "Message send successfully.", {
      populateMessage,
    });
  } catch (err) {
    console.error(err);
    return response(res, 500, "Internal Server Error!.");
  }
};

// get all conversation
exports.getConversation = async (req, res) => {
  const userId = req.user.userId;

  try {
    let conversation = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "username profilePicture isOnline lastSeen")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender receiver",
          select: "username profilePicture",
        },
      })
      .sort({ updatedAt: -1 });

    return response(res, 200, "Conversation get successful", conversation);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error.");
  }
};

// get the specific user message 
exports.getMessage = (req,res) => 
{
    const {conversationId} = req.params;
    const userId = req.user.userId;

    try
    {
        const conversation = await Conversation.findById(conversation)

        if (!conversation)
        {
            return response (res, 404, 'Conversation not found.')
        }

        if (!conversation.participants.includes(userId))
        {
            return response(res,404,'not authorized to view this conversation ')
        }

        const message = await Message.find({conversation: conversationId})
        .populate("sender", "username profilePicture")
        .populate("receiver", "username profilePicture")
        .sort('createAt');

        await Message.updateMany(
            {
            conversation: conversationId,
            receiver: userId,
            messageStatus: {$in: ['send', "delivered"]},
            } ,{$set: {messageStatus: 'read'}},
        )

        conversation.unreadCount = 0
        await conversation.save()
        return response(res,200, 'retrive user ', message)
    }
    catch (err)
    {
        console.error(err.message)
        response(res,500,'Internal server error.')
    }
}

// mark as read the message status
exports.markAsRead = async (req,res)=>
{
    const {messageId}  = req.body;
    const userId = req.user.userId;

    try
    {
        // get relevant message to determine sender 
        let messages = await Message.find({
            _id:{$in:messageId},
            receiver: userid
        })

        await Message.updateMany(
            {_id: {$in: messageId}, receiver: userId},
            {$set: {messageStatus: 'read'}}
        )

        return response(res,200,'message marked as read.', messages)
    }
    catch (err)
    {

    }
}

