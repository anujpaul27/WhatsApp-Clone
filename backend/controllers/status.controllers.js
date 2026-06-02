const { uploadFileToCloudinary } = require("../config/cloudinary.config");
const response = require("../utils/response.handler");
const Message = require("../models/message.model");
const statusModel = require("../models/status.model");

exports.CreateStatus = async (req, res) => {
  try {
    const { content, contentType } = req.body;
    const userId = req.user.userId;
    const file = req.file;

    let mediaUrl = null;
    let finalContentType = contentType || "text";

    // handle file upload
    if (file) {
      const uploadFile = await uploadFileToCloudinary(file);

      if (!uploadFile?.secure_url) {
        return response(res, 400, "Failed Image upload to cloudinary ");
      }
      imageOrVideoUrl = uploadFile?.secure_url;

      if (file.mimetype.startwith("image")) {
        finalContentType = "image";
      } else if (file.mimetype.startwith("video")) {
        finalContentType = "video";
      } else {
        return response(res, 400, "Unsupported file type");
      }
    } else if (content?.trim()) {
      finalContentType = "text";
    } else {
      return response(res, 400, "Message Content user is required.");
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const status = new statusModel({
      user: userId,
      content: mediaUrl || content,
      contentType: finalContentType,
      imageOrVideoUrl,
      messageStatus,
    });
    await status.save();

    const populateStatus = await statusModel
      .findOne(status?._id)
      .populate("user", "username profilePicture")
      .populate("viewers", "username profilePicture");

    return response(res, 201, "Message send successfully.", {
      populateMessage,
    });
  } catch (err) {
    console.error(err);
    return response(res, 500, "Internal Server Error!.");
  }
};

exports.getStatus = async (req, res) => {
  try {
    const statuses = await statusModel
      .find({
        expiresAt: { $gt: new Date() },
      })
      .populate("user", "username profilePicture")
      .populate("viewers", "username profilePicture")
      .sort({ createdAt: -1 });

    return response(res, 200, "Status retrive successfull, ", { statuses });
  } catch (err) {
    console.error(err);
    return response(res, 500, "Internal Server Error!.");
  }
};

exports.viewStatus = async (req, res) => {
  const {statusId} = req.params;
  const userId = req.user.userId;

  try {
    const status = await statusModel.findById(statusId);
    if (!status) {
      return response(res, 404, "Status Not Found.");
    }
    if (!status.viewers.include(userId)) {
      status.viewers.push(userId);
      status.save();

      const updateStatus = await statusModel
        .findById(statusId)
        .populate("user", "username profilePicture")
        .populate("viewers", "username profilePicture");
    }
    return response(res,200, 'user status view successful')
  } catch (err) {
    console.error(err);
    return response(res, 500, "Internal Server Error!.");
  }
};


exports.deleteStatus = async (req,res) => 
{
    const {statusId} = req.params;
    const userId = req.user.userId;

    try
    {
        const status = await statusModel.findById(statusId)
        if (!status)
        {
            return response(res,404,'Status Not Found.')
        }
        if (status.user.toString() !== userId)
        {
            return response(res,403,'Not auhorized delete this sataus')
        }
        await status.deleteOne()
        return response(res,200,'Status Delete Successful.')
    }
    catch (err) {
    console.error(err);
    return response(res, 500, "Internal Server Error!.");
  }
}